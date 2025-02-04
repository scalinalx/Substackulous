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

const BATCH_SIZE = 5; // Process 5 posts at a time

async function fetchPageData(url: string): Promise<{ html: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
  try {
    const { url, crawlId } = await request.json();

    // Initialize FireCrawl
    const app = new FireCrawlApp({
      apiKey: "fc-f395371cd0614b3cb105a364c0891b0e"
    });

    // If crawlId is provided, check status
    if (crawlId) {
      console.log('Checking crawl status for:', crawlId);
      const statusResponse = await app.checkCrawlStatus(crawlId);
      
      if (!statusResponse.success) {
        throw new Error(`Failed to check crawl status: ${statusResponse.error}`);
      }

      console.log('Status response:', statusResponse);
      return NextResponse.json({ 
        success: true,
        type: 'status',
        status: statusResponse 
      });
    }

    // If no crawlId, start new crawl
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Ensure URL ends with /archive?sort=top
    const baseUrl = url.replace(/\/$/, '');
    const crawlUrl = `${baseUrl}/archive?sort=top`;
    console.log('Starting async crawl for:', crawlUrl);
    
    const crawlResponse = await app.asyncCrawlUrl(crawlUrl, {
      limit: 100,
      scrapeOptions: {
        formats: ['markdown', 'html'],
      }
    });

    if (!crawlResponse.success) {
      throw new Error(`Failed to start crawl: ${crawlResponse.error}`);
    }

    console.log('Crawl started with ID:', crawlResponse.id);
    return NextResponse.json({ 
      success: true,
      type: 'start',
      crawlId: crawlResponse.id 
    });
  } catch (error) {
    console.error('Error in crawl operation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process request',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 