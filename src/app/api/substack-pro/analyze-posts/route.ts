import { NextResponse } from 'next/server';
import FireCrawlApp from '@mendable/firecrawl-js';
import * as cheerio from 'cheerio';

interface SubstackPost {
  title: string;
  likes: number;
  comments: number;
  restacks: number;
  url: string;
  preview?: string;
}

interface SubstackNote {
  url: string;
}

interface MapResponse {
  success: boolean;
  error?: string;
  urls?: string[];
}

interface ErrorResponse {
  error: string;
}

interface CrawlResponse {
  success: boolean;
  error?: string;
  data: CrawlResult[];
  links?: string[];
}

interface StatusResponse {
  success: boolean;
  error?: string;
  status?: string;
  data?: any;
}

interface CrawlResult {
  success?: boolean;
  error?: string;
  markdown?: string;
  metadata?: any;
}

interface MapResult {
  success: boolean;
  error?: string;
  links?: string[];
}

interface CrawlJobResponse {
  success: boolean;
  error?: string;
  id?: string;
  data?: any;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  notes?: string[];
  posts?: SubstackPost[];
  rawResponse?: any;
  logs: string[];
}

interface CrawlStatusResponse {
  success: boolean;
  error?: string;
  data: CrawlResult[];
}

const BATCH_SIZE = 5; // Process 5 posts at a time

// Set maximum duration for this API route to 25 seconds
export const maxDuration = 35;

async function fetchPostData(url: string): Promise<SubstackPost | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract title
    const title = $('h1.post-title').text().trim();
    if (!title) return null;

    // Extract preview content (first 500 characters of the post content)
    const content = $('.body.markup').text().trim();
    const preview = content ? content.slice(0, 500) + (content.length > 500 ? '...' : '') : undefined;

    // Extract engagement metrics using more specific selectors
    const likes = parseInt($('.like-button-container .label').first().text().trim()) || 0;
    const comments = parseInt($('.post-ufi-comment-button .label').first().text().trim()) || 0;
    const restacks = parseInt($('a[aria-label="View repost options"] .label').first().text().trim()) || 0;

    return {
      title,
      likes,
      comments,
      restacks,
      url,
      preview
    };
  } catch (error) {
    // Just return null on error, consistent with our error handling approach
    return null;
  }
}

function extractNoteUrls(markdown: string): string[] {
  const regex = /https:\/\/substack\.com\/@[^\/]+\/note\/[a-zA-Z0-9-]+/g;
  const matches = markdown.match(regex) || [];
  return Array.from(new Set(matches));
}

async function waitForCrawlCompletion(app: FireCrawlApp, jobId: string, maxAttempts = 10, logs: string[] = []): Promise<[CrawlResult[], string[]]> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const statusResponse = await app.checkCrawlStatus(jobId) as CrawlStatusResponse;
      logs.push(`Checking crawl status (attempt ${attempt + 1}/${maxAttempts}): ${JSON.stringify(statusResponse)}`);

      if (statusResponse.data && Array.isArray(statusResponse.data) && statusResponse.data.length > 0) {
        return [statusResponse.data, logs];
      }

      // Wait for 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      logs.push(`Error checking status (attempt ${attempt + 1}): ${error}`);
      // Continue to next attempt
    }
  }

  throw new Error('Crawl timed out: Maximum attempts reached');
}

export async function POST(request: Request) {
  const logs: string[] = [];
  
  try {
    const { url, type = 'posts' } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required', logs }, { status: 400 });
    }

    // Initialize FireCrawl
    const app = new FireCrawlApp({
      apiKey: "fc-f395371cd0614b3cb105a364c0891b0e"
    });

    if (type === 'notes') {
      // Handle notes crawling
      const notesUrl = `${url.replace(/\/$/, '')}/notes/`;
      logs.push(`Submitting crawl job for: ${notesUrl}`);
      
      // Submit the crawl job
      const crawlResponse = await app.crawlUrl(notesUrl, {
        limit: 1,
        scrapeOptions: {
          formats: ["markdown"],
        }
      }) as CrawlJobResponse;

      logs.push(`Crawl response: ${JSON.stringify(crawlResponse)}`);

      // The response might already contain the data we need
      if (crawlResponse.data && Array.isArray(crawlResponse.data) && crawlResponse.data.length > 0) {
        const firstResult = crawlResponse.data[0];
        if (firstResult.markdown) {
          const noteUrls = extractNoteUrls(firstResult.markdown);
          logs.push(`Found ${noteUrls.length} note URLs directly from response`);
          
          const response: ApiResponse = {
            success: true,
            notes: noteUrls,
            rawResponse: crawlResponse.data,
            logs
          };
          
          return NextResponse.json(response);
        }
      }

      // If we don't have data yet, we need to wait for the job to complete
      if (!crawlResponse.id) {
        logs.push(`Unexpected crawl response: ${JSON.stringify(crawlResponse)}`);
        throw new Error('No job ID or immediate data returned from crawl');
      }

      logs.push(`Crawl job submitted, ID: ${crawlResponse.id}`);

      // Wait for crawl completion and get results
      const [crawlResults, completionLogs] = await waitForCrawlCompletion(app, crawlResponse.id, 10, logs);
      logs.push(...completionLogs);
      
      // Get the first result which contains the markdown
      const firstResult = crawlResults[0];
      if (!firstResult.markdown) {
        throw new Error('Crawl completed but no markdown content found in response');
      }

      const noteUrls = extractNoteUrls(firstResult.markdown);
      logs.push(`Found ${noteUrls.length} note URLs after waiting for completion`);

      const response: ApiResponse = {
        success: true,
        notes: noteUrls,
        rawResponse: crawlResults,
        logs
      };

      return NextResponse.json(response);
    } else {
      // Handle posts crawling with fallback
      const baseUrl = url.replace(/\/$/, '');
      const mapUrl = `${baseUrl}/archive?sort=top`;
      logs.push(`Mapping URLs from: ${mapUrl}`);
      
      // First attempt with /archive?sort=top
      const mapResult = await app.mapUrl(mapUrl, {
        includeSubdomains: true
      }) as MapResult;

      let postUrls: string[] = [];

      if (mapResult.success && mapResult.links) {
        postUrls = mapResult.links
          .filter(url => url.includes('/p/'))
          .filter(url => !url.includes('/comments'))
          .slice(0, 60);
      }

      logs.push(`Found ${postUrls.length} post URLs from top posts`);

      // If we got less than 5 posts, try the fallback
      if (postUrls.length < 5) {
        logs.push('Insufficient posts from top sort, trying fallback crawl with crawlUrl...');
        
        try {
          const fallbackCrawlResult = await app.crawlUrl(`${baseUrl}/archive?sort=top`, {
            limit: 1,
            scrapeOptions: {
              formats: ["markdown", "links"],
            }
          }) as CrawlResponse;
          
          logs.push(`Fallback crawl result: ${JSON.stringify(fallbackCrawlResult).substring(0, 200)}...`);
          
          // Check if we have links directly in the response object (top-level links array)
          if (fallbackCrawlResult.links && Array.isArray(fallbackCrawlResult.links) && fallbackCrawlResult.links.length > 0) {
            logs.push(`Found ${fallbackCrawlResult.links.length} links in top-level links array`);
            
            // Filter and process links from the top-level links array
            const fallbackUrls = Array.from(new Set(
              fallbackCrawlResult.links
                .filter((url: string) => url && url.includes('/p/'))
                .filter((url: string) => !url.includes('/comments'))
            )).slice(0, 60);
            
            // Combine URLs and remove duplicates
            postUrls = Array.from(new Set([...postUrls, ...fallbackUrls]));
            logs.push(`Added ${fallbackUrls.length} posts from fallback crawl top-level links. Total unique posts: ${postUrls.length}`);
          }
          // Check if we have data with links in metadata as fallback (original expectation)
          else if (fallbackCrawlResult.success && fallbackCrawlResult.data && fallbackCrawlResult.data.length > 0) {
            // Extract links from the result
            const firstResult = fallbackCrawlResult.data[0];
            const linksData = firstResult.metadata?.links || [];
            
            if (Array.isArray(linksData) && linksData.length > 0) {
              // Extract URLs from links data, filter and remove duplicates
              const fallbackUrls = Array.from(new Set(
                linksData
                  .map(link => typeof link === 'string' ? link : link.url)
                  .filter(url => url && url.includes('/p/'))
                  .filter(url => !url.includes('/comments'))
              )).slice(0, 60);
              
              // Combine URLs and remove duplicates (again, just to be safe)
              postUrls = Array.from(new Set([...postUrls, ...fallbackUrls]));
              logs.push(`Added ${fallbackUrls.length} posts from fallback crawl metadata links. Total unique posts: ${postUrls.length}`);
            } else {
              logs.push('No links found in fallback crawl result metadata');
            }
          } else {
            logs.push('No links found in fallback crawl result (checked both top-level and metadata)');
          }
        } catch (fallbackError) {
          logs.push(`Error in fallback crawl: ${fallbackError}`);
          // Continue with original fallback if the new approach fails
          logs.push('Falling back to original mapUrl approach...');
          
          const fallbackMapResult = await app.mapUrl(baseUrl, {
            includeSubdomains: true
          }) as MapResult;

          if (fallbackMapResult.success && fallbackMapResult.links) {
            const fallbackUrls = fallbackMapResult.links
              .filter(url => url.includes('/p/'))
              .filter(url => !url.includes('/comments'))
              .slice(0, 60);

            // Combine URLs and remove duplicates
            postUrls = Array.from(new Set([...postUrls, ...fallbackUrls]));
            logs.push(`Added ${fallbackUrls.length} posts from original fallback crawl. Total unique posts: ${postUrls.length}`);
          }
        }
      }

      if (postUrls.length === 0) {
        throw new Error('No posts found after both crawl attempts');
      }

      // Fetch post data in parallel
      const posts = await Promise.all(
        postUrls.map(url => fetchPostData(url))
      );

      // Filter out null results and sort by engagement
      const validPosts = posts
        .filter((post): post is SubstackPost => post !== null)
        .sort((a, b) => (b.likes + b.comments + b.restacks) - (a.likes + a.comments + a.restacks));

      if (validPosts.length === 0) {
        throw new Error('No valid posts could be processed');
      }

      logs.push(`Successfully processed ${validPosts.length} valid posts`);

      const response: ApiResponse = {
        success: true,
        posts: validPosts,
        rawResponse: {
          topPosts: mapResult,
          fallback: postUrls.length < 5 ? 'used' : 'not needed'
        },
        logs
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    logs.push(`Error processing request: ${error}`);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process request',
      logs
    };

    return NextResponse.json(response, { status: 500 });
  }
} 