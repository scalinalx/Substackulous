import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';

interface SubstackPost {
  title: string;
  likes: number;
  comments: number;
  restacks: number;
  thumbnail: string;
  url: string;
}

async function getRestackCount(postUrl: string): Promise<number> {
  try {
    const response = await fetch(postUrl);
    if (!response.ok) return 0;
    
    const html = await response.text();
    const $: CheerioAPI = cheerio.load(html);
    
    // Find the restack button and get its label
    const restackButton = $('a[aria-label="View repost options"].post-ufi-button.style-button');
    const restackText = restackButton.find('.label').first().text().trim();
    return parseInt(restackText || '0', 10);
  } catch (error) {
    console.error('Error fetching restack count:', error);
    return 0;
  }
}

async function fetchArchivePage(baseUrl: string): Promise<string> {
  const archiveUrl = `${baseUrl}/archive?sort=top`;
  console.log('Fetching archive URL:', archiveUrl);
  
  const response = await fetch(archiveUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch archive: ${response.status} ${response.statusText}`);
  }
  
  return response.text();
}

function extractThumbnail($post: ReturnType<CheerioAPI>): string {
  try {
    // Try multiple selectors for images
    const imgSelectors = [
      '.image-nBNbRY',
      '.img-OACg1c',
      'img[src*="substackcdn.com"]',
      'img[src*="substack-post-media"]',
      'source[type="image/webp"]'
    ];

    for (const selector of imgSelectors) {
      const element = $post.find(selector).first();
      if (element.length > 0) {
        // If it's a webp source, handle srcset
        if (selector === 'source[type="image/webp"]') {
          const srcset = element.attr('srcset');
          if (srcset) {
            // Take the first URL which is typically the highest quality
            const firstUrl = srcset.split(',')[0].trim().split(' ')[0];
            if (firstUrl) {
              console.log('Found webp thumbnail:', firstUrl);
              return firstUrl;
            }
          }
        } else {
          // Regular image, use src attribute
          const src = element.attr('src');
          if (src) {
            console.log('Found image thumbnail:', src);
            return src;
          }
        }
      }
    }

    return '';
  } catch (error) {
    console.error('Error extracting thumbnail:', error);
    return '';
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
    };

    // Fetch the archive page
    const html = await fetchArchivePage(baseUrl);
    const $: CheerioAPI = cheerio.load(html);
    
    // Try multiple selectors for post containers
    const containerSelectors = [
      '.container-H2dyKk',
      '.post-preview',
      'article'
    ];

    let postElements;
    for (const selector of containerSelectors) {
      postElements = $(selector);
      if (postElements.length > 12) {
        console.log(`Found ${postElements.length} posts using selector: ${selector}`);
        break;
      }
    }

    if (!postElements || postElements.length === 0) {
      return NextResponse.json({
        error: 'No posts found',
        debugInfo
      }, { status: 404 });
    }

    const posts: SubstackPost[] = [];
    const processedUrls = new Set<string>();
    const maxPosts = Math.min(30, postElements.length);
    const batchPromises: Promise<SubstackPost | null>[] = [];

    // Process posts in parallel
    for (let i = 0; i < maxPosts; i++) {
      const $post = $(postElements[i]);
      
      // Try multiple selectors for title and URL
      const titleSelectors = [
        'a[data-testid="post-preview-title"]',
        'h2.post-preview-title a',
        'h3 a'
      ];

      let title = '';
      let postUrl = '';
      
      for (const selector of titleSelectors) {
        const titleElement = $post.find(selector);
        if (titleElement.length > 0) {
          title = titleElement.text().trim();
          postUrl = titleElement.attr('href') || '';
          break;
        }
      }

      const fullPostUrl = postUrl ? (postUrl.startsWith('http') ? postUrl : `${baseUrl}${postUrl}`) : '';
      
      if (!title || !fullPostUrl || processedUrls.has(fullPostUrl)) continue;
      processedUrls.add(fullPostUrl);

      // Create a promise for processing this post
      const postPromise = (async () => {
        try {
          const likesText = $post.find('.like-button-container .label').text().trim();
          const likes = parseInt(likesText || '0', 10);

          const commentsText = $post.find('.post-ufi-comment-button .label').text().trim();
          const comments = parseInt(commentsText || '0', 10);

          const thumbnail = extractThumbnail($post);
          const restacks = await getRestackCount(fullPostUrl);

          return {
            title,
            url: fullPostUrl,
            likes,
            comments,
            restacks,
            thumbnail
          };
        } catch (error) {
          console.error('Error processing post:', error);
          return null;
        }
      })();

      batchPromises.push(postPromise);
    }

    // Process all posts in parallel and filter out any nulls
    const results = (await Promise.all(batchPromises)).filter((post): post is SubstackPost => post !== null);

    console.log('Total posts processed:', results.length);
    return NextResponse.json({ 
      posts: results,
      debugInfo: {
        ...debugInfo,
        postsFound: results.length
      }
    });
  } catch (error) {
    console.error('Error analyzing Substack posts:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to analyze posts',
        code: 'ANALYSIS_ERROR',
        details: error instanceof Error ? error.stack : undefined,
        debugInfo: {
          error: String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }
      },
      { status: 500 }
    );
  }
} 