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

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
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

    // Fetch and process each post in parallel with timeout
    console.log('Fetching post data...');
    const postsData = await Promise.all(
      postUrls.map(async (postUrl: string) => {
        const { html, error } = await fetchPageData(postUrl);
        if (error || !html) {
          console.error(`Failed to fetch ${postUrl}:`, error);
          return null;
        }
        return extractPostData(html, postUrl);
      })
    );

    // Filter out null results and sort by engagement
    const validPosts = postsData.filter((post): post is SubstackPost => post !== null);
    const sortedPosts = validPosts.sort((a: SubstackPost, b: SubstackPost) => 
      (b.likes + b.comments + b.restacks) - (a.likes + a.comments + a.restacks)
    );

    const endTime = Date.now();
    console.log('Total posts processed:', sortedPosts.length);
    console.log('Processing time:', endTime - debugInfo.startTime, 'ms');
    
    return new NextResponse(
      JSON.stringify({ 
        posts: sortedPosts,
        debugInfo: {
          ...debugInfo,
          postsFound: sortedPosts.length,
          processingTimeMs: endTime - debugInfo.startTime
        }
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error('Error analyzing Substack posts:', error);
    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to analyze posts',
        code: 'ANALYSIS_ERROR',
        details: error instanceof Error ? error.stack : undefined,
        debugInfo: {
          error: String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
} 