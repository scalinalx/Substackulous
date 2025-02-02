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
  // For offset > 0, use the archive/posts endpoint that Substack uses for infinite scroll
  const archiveUrl = offset === 0 
    ? `${baseUrl}/archive?sort=top` 
    : `${baseUrl}/archive?sort=top&offset=${offset}`;

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
    // First try to find the image container
    const imageContainer = $post.find('.image-container').first();
    if (imageContainer.length > 0) {
      // Try to get the webp source first
      const webpSource = imageContainer.find('source[type="image/webp"]');
      if (webpSource.length > 0) {
        const srcset = webpSource.attr('srcset');
        if (srcset) {
          // Get the highest quality URL from srcset
          const urls = srcset.split(',').map(part => {
            const [url, width] = part.trim().split(' ');
            return {
              url,
              width: parseInt(width?.replace('w', '') || '0', 10)
            };
          });
          
          // Sort by width and get the highest quality
          const highestQuality = urls.sort((a, b) => b.width - a.width)[0];
          if (highestQuality?.url) {
            console.log('Found high quality webp:', highestQuality.url);
            return highestQuality.url;
          }
        }
      }

      // Fallback to regular image
      const img = imageContainer.find('img').first();
      const src = img.attr('src');
      if (src) {
        console.log('Found regular image:', src);
        return src;
      }
    }

    // Try direct image selectors as fallback
    const imgSelectors = [
      '.image-nBNbRY',
      '.img-OACg1c',
      'img[src*="substackcdn.com"]',
      'img[src*="substack-post-media"]'
    ];

    for (const selector of imgSelectors) {
      const img = $post.find(selector).first();
      if (img.length > 0) {
        const src = img.attr('src');
        if (src) {
          console.log('Found image via selector:', selector, src);
          return src;
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

    const posts: SubstackPost[] = [];
    const processedUrls = new Set<string>();
    let offset = 0;
    let totalProcessed = 0;

    // Keep fetching pages until we have enough posts or no more are found
    while (posts.length < 30 && offset < 100) {
      // Fetch the archive page
      const html = await fetchArchivePage(baseUrl, offset);
      const $: CheerioAPI = cheerio.load(html);
      
      // Get all post elements
      const postElements = $('.container-H2dyKk');
      console.log(`Found ${postElements.length} posts at offset ${offset}`);

      if (postElements.length === 0) break;

      const batchPromises: Promise<SubstackPost | null>[] = [];

      // Process posts in this batch
      postElements.each((_, element) => {
        const $post = $(element);
        
        const titleElement = $post.find('a[data-testid="post-preview-title"]');
        const title = titleElement.text().trim();
        const postUrl = titleElement.attr('href');
        const fullPostUrl = postUrl ? (postUrl.startsWith('http') ? postUrl : `${baseUrl}${postUrl}`) : '';
        
        if (!title || !fullPostUrl || processedUrls.has(fullPostUrl)) return;
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
      });

      // Process all posts in this batch
      const batchResults = (await Promise.all(batchPromises)).filter((post): post is SubstackPost => post !== null);
      posts.push(...batchResults);
      
      totalProcessed += postElements.length;
      offset += postElements.length;

      // If we have enough posts, break
      if (posts.length >= 30) break;
    }

    if (posts.length === 0) {
      return NextResponse.json({
        error: 'No posts found',
        debugInfo
      }, { status: 404 });
    }

    // Take only the first 30 posts
    const finalPosts = posts.slice(0, 30);

    console.log('Total posts processed:', totalProcessed);
    console.log('Posts returned:', finalPosts.length);
    
    return NextResponse.json({ 
      posts: finalPosts,
      debugInfo: {
        ...debugInfo,
        postsFound: finalPosts.length,
        totalProcessed
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