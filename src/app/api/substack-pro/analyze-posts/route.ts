import { NextResponse } from 'next/server';
import FireCrawlApp from '@mendable/firecrawl-js';
import * as cheerio from 'cheerio';

interface SubstackPost {
  title: string;
  likes: number;
  comments: number;
  restacks: number;
  thumbnail: string;
  url: string;
}

interface MapResponse {
  urls: string[];
}

interface ErrorResponse {
  error: string;
}

const BATCH_SIZE = 5; // Process 5 posts at a time

async function fetchPageData(url: string): Promise<{ html: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    return { html };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { 
        html: '', 
        error: 'Request timed out after 30 seconds'
      };
    }
    return { 
      html: '', 
      error: error instanceof Error ? error.message : 'Failed to fetch page' 
    };
  }
}

async function extractPostData(html: string, url: string): Promise<SubstackPost | null> {
  try {
    const $ = cheerio.load(html);
    
    // Extract title
    const title = $('h1.post-title').text().trim();
    if (!title) return null;

    // Extract likes
    const likesText = $('.like-button-container .label').text().trim();
    const likes = parseInt(likesText) || 0;

    // Extract comments
    const commentsText = $('.post-ufi-comment-button .label').text().trim();
    const comments = parseInt(commentsText) || 0;

    // Extract restacks
    const restacksText = $('a[aria-label="View repost options"].post-ufi-button .label').text().trim();
    const restacks = parseInt(restacksText) || 0;

    // Extract thumbnail
    let thumbnail = '';
    const imgSelectors = [
      '.image-nBNbRY',
      '.img-OACg1c',
      'img[src*="substackcdn.com"]',
      'img[src*="substack-post-media"]'
    ];

    for (const selector of imgSelectors) {
      const imgElement = $(selector).first();
      if (imgElement.length && imgElement.attr('src')) {
        thumbnail = imgElement.attr('src') || '';
        break;
      }
    }

    // If no direct image found, try webp source
    if (!thumbnail) {
      const webpSource = $('source[type="image/webp"]').first();
      if (webpSource.length && webpSource.attr('srcset')) {
        const srcset = webpSource.attr('srcset') || '';
        const firstUrl = srcset.split(',')[0].trim().split(' ')[0];
        if (firstUrl) {
          thumbnail = firstUrl;
        }
      }
    }

    return {
      title,
      likes,
      comments,
      restacks,
      thumbnail,
      url
    };
  } catch (error) {
    console.error('Error extracting post data:', error);
    return null;
  }
}

async function processBatch(urls: string[]): Promise<SubstackPost[]> {
  const results = await Promise.all(
    urls.map(async (url) => {
      const { html, error } = await fetchPageData(url);
      if (error || !html) {
        console.error(`Failed to fetch ${url}:`, error);
        return null;
      }
      return extractPostData(html, url);
    })
  );
  return results.filter((post): post is SubstackPost => post !== null);
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  let stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  const writeChunk = async (chunk: any) => {
    await writer.write(encoder.encode(JSON.stringify(chunk) + '\n'));
  };

  try {
    const { url } = await request.json();

    if (!url) {
      throw new Error('URL is required');
    }

    const baseUrl = url.replace(/\/$/, '');
    const debugInfo = {
      originalUrl: url,
      baseUrl,
      startTime: Date.now()
    };

    // Initialize FireCrawl
    const app = new FireCrawlApp({
      apiKey: "fc-f395371cd0614b3cb105a364c0891b0e"
    });

    // Get all URLs from the archive page with timeout
    console.log('Mapping URLs...');
    const mapResponse = await Promise.race([
      app.mapUrl(`${baseUrl}/archive?sort=top`, {
        includeSubdomains: true
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('FireCrawl mapping timed out after 60 seconds')), 60000)
      )
    ]) as MapResponse | ErrorResponse;

    if ('error' in mapResponse) {
      throw new Error(mapResponse.error);
    }

    // Filter for post URLs and take only the first 30
    const postUrls = mapResponse.urls
      .filter((url: string) => url.includes('/p/'))
      .slice(0, 30);

    console.log(`Found ${postUrls.length} post URLs`);

    // Process posts in batches
    const allPosts: SubstackPost[] = [];
    for (let i = 0; i < postUrls.length; i += BATCH_SIZE) {
      const batchUrls = postUrls.slice(i, i + BATCH_SIZE);
      const batchPosts = await processBatch(batchUrls);
      allPosts.push(...batchPosts);
      
      // Send progress update
      await writeChunk({
        type: 'progress',
        processed: Math.min(i + BATCH_SIZE, postUrls.length),
        total: postUrls.length,
        posts: batchPosts
      });
    }

    // Sort all posts by engagement
    const sortedPosts = allPosts.sort((a, b) => 
      (b.likes + b.comments + b.restacks) - (a.likes + a.comments + a.restacks)
    );

    const endTime = Date.now();
    
    // Send final result
    await writeChunk({
      type: 'complete',
      posts: sortedPosts,
      debugInfo: {
        ...debugInfo,
        postsFound: sortedPosts.length,
        processingTimeMs: endTime - debugInfo.startTime
      }
    });

    await writer.close();
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error analyzing Substack posts:', error);
    await writeChunk({
      type: 'error',
      error: error instanceof Error ? error.message : 'Failed to analyze posts',
      code: 'ANALYSIS_ERROR',
      details: error instanceof Error ? error.stack : undefined,
      debugInfo: {
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    });
    await writer.close();
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  }
} 