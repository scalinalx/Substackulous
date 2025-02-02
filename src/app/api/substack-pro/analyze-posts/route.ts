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
  // Substack uses a different URL structure for loading more posts
  const archiveUrl = offset === 0 
    ? `${baseUrl}/archive?sort=top`
    : `${baseUrl}/archive?sort=top&offset=${offset}`;
    
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractThumbnail($post: any): string {
  // Look for the webp source with the specific srcset format
  const webpSource = $post.find('source[type="image/webp"]');
  if (webpSource.length > 0) {
    const srcset = webpSource.attr('srcset');
    if (srcset) {
      // Extract the highest quality image URL
      // The format is typically: w_1456,c_fill,f_webp,q_auto:good,fl_progressive:steep,g_auto/...
      const urls = srcset.split(',').map((part: string) => part.trim());
      // Get the URL with the highest width (w_XXXX)
      const highestQualityUrl = urls
        .map((url: string) => {
          const match = url.match(/w_(\d+)/);
          return {
            url,
            width: match ? parseInt(match[1], 10) : 0
          };
        })
        .sort((a: { url: string; width: number }, b: { url: string; width: number }) => b.width - a.width)[0]?.url || urls[0];
      
      return highestQualityUrl;
    }
  }

  // Fallback to regular img src
  const img = $post.find('img[src*="substackcdn.com"]');
  return img.attr('src') || '/placeholder-image.jpg';
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

    while (posts.length < 30 && hasMore && offset < 100) { // Limit to 100 posts to prevent infinite loops
      try {
        const html = await fetchArchivePage(baseUrl, offset);
        const $: CheerioAPI = cheerio.load(html);
        
        // Find all post containers
        const postElements = $('.container-H2dyKk');
        console.log(`Found ${postElements.length} posts at offset ${offset}`);

        if (postElements.length === 0) {
          hasMore = false;
          break;
        }

        // Process each post element
        for (const element of postElements.toArray()) {
          if (posts.length >= 30) break;

          const $post = $(element);
          
          // Get title and URL
          const titleElement = $post.find('a[data-testid="post-preview-title"]');
          const title = titleElement.text().trim();
          const postUrl = titleElement.attr('href');
          const fullPostUrl = postUrl ? (postUrl.startsWith('http') ? postUrl : `${baseUrl}${postUrl}`) : '';
          
          if (!title || !fullPostUrl || processedUrls.has(fullPostUrl)) continue;
          processedUrls.add(fullPostUrl);

          // Get likes and comments
          const likesText = $post.find('.like-button-container .label').text().trim();
          const likes = parseInt(likesText || '0', 10);

          const commentsText = $post.find('.post-ufi-comment-button .label').text().trim();
          const comments = parseInt(commentsText || '0', 10);

          // Get thumbnail using the improved extraction function
          const thumbnail = extractThumbnail($post);

          // Get restack count by visiting the post page
          console.log(`Fetching restacks for post: ${title}`);
          const restacks = await getRestackCount(fullPostUrl);

          posts.push({
            title,
            likes,
            comments,
            restacks,
            thumbnail,
            url: fullPostUrl,
          });

          console.log(`Processed post ${posts.length}: ${title} (${restacks} restacks)`);
        }

        // Increment offset for next batch
        offset += 12; // Substack loads 12 posts at a time
        
        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
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

    console.log('Total posts processed:', posts.length);
    return NextResponse.json({ 
      posts,
      debugInfo: {
        ...debugInfo,
        postsFound: posts.length,
        totalOffset: offset
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