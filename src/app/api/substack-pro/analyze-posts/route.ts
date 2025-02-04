import { NextResponse } from 'next/server';
import FireCrawlApp from '@mendable/firecrawl-js';
import * as cheerio from 'cheerio';

interface SubstackPost {
  title: string;
  likes: number;
  comments: number;
  restacks: number;
  url: string;
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
  id?: string;
}

interface StatusResponse {
  success: boolean;
  error?: string;
  status?: string;
  data?: any;
}

interface CrawlResult {
  success: boolean;
  error?: string;
  markdown?: string;
}

interface MapResult {
  success: boolean;
  error?: string;
  links?: string[];
}

const BATCH_SIZE = 5; // Process 5 posts at a time

// Set maximum duration for this API route to 25 seconds
export const maxDuration = 25;

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

    // Extract engagement metrics using more specific selectors
    const likes = parseInt($('.like-button-container .label').first().text().trim()) || 0;
    const comments = parseInt($('.post-ufi-comment-button .label').first().text().trim()) || 0;
    const restacks = parseInt($('a[aria-label="View repost options"] .label').first().text().trim()) || 0;

    return {
      title,
      likes,
      comments,
      restacks,
      url
    };
  } catch (error) {
    console.error(`Error fetching post data for ${url}:`, error);
    return null;
  }
}

function extractNoteUrls(markdown: string): string[] {
  const regex = /https:\/\/substack\.com\/@[^\/]+\/note\/[a-zA-Z0-9-]+/g;
  const matches = markdown.match(regex) || [];
  return Array.from(new Set(matches));
}

export async function POST(request: Request) {
  try {
    const { url, type = 'posts' } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Initialize FireCrawl
    const app = new FireCrawlApp({
      apiKey: "fc-f395371cd0614b3cb105a364c0891b0e"
    });

    if (type === 'notes') {
      // Handle notes crawling
      const notesUrl = `${url.replace(/\/$/, '')}/notes/`;
      console.log('Crawling notes from:', notesUrl);
      
      const crawlResult = await app.crawlUrl(notesUrl, {
        limit: 1,
        scrapeOptions: {
          formats: ["markdown"],
        }
      }) as CrawlResult;

      if (!crawlResult.success || !crawlResult.markdown) {
        throw new Error(`Failed to crawl notes: ${crawlResult.error || 'No markdown content'}`);
      }

      const noteUrls = extractNoteUrls(crawlResult.markdown);
      console.log(`Found ${noteUrls.length} note URLs`);

      return NextResponse.json({ 
        success: true,
        notes: noteUrls,
        rawResponse: crawlResult
      });
    } else {
      // Handle posts crawling (existing logic)
      const baseUrl = url.replace(/\/$/, '');
      const mapUrl = `${baseUrl}/archive?sort=top`;
      console.log('Mapping URLs from:', mapUrl);
      
      const mapResult = await app.mapUrl(mapUrl, {
        includeSubdomains: true
      }) as MapResult;

      if (!mapResult.success || !mapResult.links) {
        throw new Error(`Failed to map: ${mapResult.error || 'No links found'}`);
      }

      // Filter for post URLs only
      const postUrls = mapResult.links
        .filter(url => url.includes('/p/'))
        .filter(url => !url.includes('/comments'))
        .slice(0, 60);

      console.log(`Found ${postUrls.length} post URLs`);

      // Fetch post data in parallel
      const posts = await Promise.all(
        postUrls.map(url => fetchPostData(url))
      );

      // Filter out null results and sort by engagement
      const validPosts = posts
        .filter((post): post is SubstackPost => post !== null)
        .sort((a, b) => (b.likes + b.comments + b.restacks) - (a.likes + a.comments + a.restacks));

      return NextResponse.json({ 
        success: true,
        posts: validPosts,
        rawResponse: mapResult
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process request',
    }, { status: 500 });
  }
} 