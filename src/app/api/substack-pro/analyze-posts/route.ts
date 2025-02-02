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
        // Get the highest quality image URL from srcset
        const urls = srcset.split(',').map(part => {
          const [url, width] = part.trim().split(' ');
          return {
            url,
            width: parseInt(width || '0', 10)
          };
        });
        
        // Sort by width and get the highest quality
        const highestQuality = urls.sort((a, b) => b.width - a.width)[0];
        if (highestQuality?.url) {
          return highestQuality.url;
        }
      }
    }

    // Try the regular image source as fallback
    const img = $post.find('img').first();
    const src = img.attr('src');
    if (src) {
      return src;
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
    
    // Get all post elements
    const postElements = $('.container-H2dyKk');
    console.log(`Found ${postElements.length} posts`);

    if (postElements.length === 0) {
      return NextResponse.json({
        error: 'No posts found',
        debugInfo
      }, { status: 404 });
    }

    const posts: SubstackPost[] = [];
    const processedUrls = new Set<string>();
    const maxPosts = Math.min(30, postElements.length);
    const batchPromises: Promise<SubstackPost>[] = [];

    // Process posts in parallel
    for (let i = 0; i < maxPosts; i++) {
      const $post = $(postElements[i]);
      
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

    // Process all posts in parallel
    const results = await Promise.all(batchPromises);
    posts.push(...results);

    console.log('Total posts processed:', posts.length);
    return NextResponse.json({ 
      posts,
      debugInfo: {
        ...debugInfo,
        postsFound: posts.length
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