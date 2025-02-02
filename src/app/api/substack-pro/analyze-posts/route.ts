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

async function fetchArchivePage(baseUrl: string, offset: number = 0): Promise<string> {
  // For the first page, we use the regular archive URL
  // For subsequent pages, we use the archive/posts endpoint which Substack uses for infinite scroll
  const archiveUrl = offset === 0
    ? `${baseUrl}/archive?sort=top`
    : `${baseUrl}/api/v1/archive/posts?sort=top&offset=${offset}&limit=12`;
    
  console.log('Fetching archive URL:', archiveUrl);
  
  const response = await fetch(archiveUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch archive: ${response.status} ${response.statusText}`);
  }
  
  return response.text();
}

function extractThumbnail($post: ReturnType<CheerioAPI>): string {
  try {
    // First try to get the webp source
    const webpSource = $post.find('source[type="image/webp"]');
    if (webpSource.length > 0) {
      const srcset = webpSource.attr('srcset');
      if (srcset) {
        // Split the srcset and get the first URL (usually the highest quality)
        const firstUrl = srcset.split(',')[0].split(' ')[0];
        if (firstUrl) {
          // Extract the actual image URL from the CDN URL
          const match = firstUrl.match(/https:\/\/substackcdn\.com\/image\/fetch\/.*?\/(https?.+)/);
          if (match && match[1]) {
            return decodeURIComponent(match[1]);
          }
          return firstUrl;
        }
      }
    }

    // Try the regular image source as fallback
    const img = $post.find('img').first();
    const src = img.attr('src');
    if (src) {
      // Handle both CDN and direct URLs
      const match = src.match(/https:\/\/substackcdn\.com\/image\/fetch\/.*?\/(https?.+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
      return src;
    }

    // Final fallback
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

    const posts: SubstackPost[] = [];
    const processedUrls = new Set<string>();
    let offset = 0;
    let hasMore = true;

    // Keep fetching until we have enough posts or run out of posts
    while (posts.length < 30 && hasMore && offset < 50) {
      try {
        const html = await fetchArchivePage(baseUrl, offset);
        const $: CheerioAPI = cheerio.load(html);
        
        const postElements = $('.container-H2dyKk');
        console.log(`Found ${postElements.length} posts at offset ${offset}`);

        if (postElements.length === 0) {
          hasMore = false;
          break;
        }

        const batchPromises: Promise<SubstackPost>[] = [];

        // Process posts in this batch
        for (const element of postElements.toArray()) {
          const $post = $(element);
          
          const titleElement = $post.find('a[data-testid="post-preview-title"]');
          const title = titleElement.text().trim();
          const postUrl = titleElement.attr('href');
          const fullPostUrl = postUrl ? (postUrl.startsWith('http') ? postUrl : `${baseUrl}${postUrl}`) : '';
          
          if (!title || !fullPostUrl || processedUrls.has(fullPostUrl)) continue;
          processedUrls.add(fullPostUrl);

          // Create a promise for processing this post
          const postPromise = (async () => {
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
          })();

          batchPromises.push(postPromise);
        }

        // Process all posts in this batch in parallel
        const batchResults = await Promise.all(batchPromises);
        posts.push(...batchResults);

        // Increment offset for next batch
        offset += postElements.length;

        // If we have enough posts, break early
        if (posts.length >= 30) break;

      } catch (error) {
        console.error(`Error fetching posts at offset ${offset}:`, error);
        break;
      }
    }

    if (posts.length === 0) {
      return NextResponse.json({
        error: 'No posts found',
        debugInfo
      }, { status: 404 });
    }

    // Take only the first 30 posts if we got more
    const finalPosts = posts.slice(0, 30);

    console.log('Total posts processed:', finalPosts.length);
    return NextResponse.json({ 
      posts: finalPosts,
      debugInfo: {
        ...debugInfo,
        postsFound: finalPosts.length,
        totalProcessed: posts.length
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