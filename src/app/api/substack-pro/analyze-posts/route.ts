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
  // Substack loads more posts by appending a timestamp parameter
  const timestamp = Date.now() - (offset * 24 * 60 * 60 * 1000); // Subtract days based on offset
  const archiveUrl = `${baseUrl}/archive?sort=top&timestamp=${timestamp}`;
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
    let offset = 0;
    
    // Keep fetching pages until we have at least 30 posts or hit a reasonable limit
    while (posts.length < 30 && offset < 5) {
      try {
        // Fetch the archive page with the current offset
        const html = await fetchArchivePage(baseUrl, offset);
        const $: CheerioAPI = cheerio.load(html);
        
        // Find all post containers
        const postElements = $('.container-H2dyKk');
        console.log(`Found ${postElements.length} posts on page ${offset + 1}`);

        if (postElements.length === 0) break;

        // Process each post element
        for (const element of postElements.toArray()) {
          if (posts.length >= 30) break;

          const $post = $(element);
          
          // Get title and URL
          const titleElement = $post.find('a[data-testid="post-preview-title"]');
          const title = titleElement.text().trim();
          const postUrl = titleElement.attr('href');
          const fullPostUrl = postUrl ? (postUrl.startsWith('http') ? postUrl : `${baseUrl}${postUrl}`) : '';
          
          if (!title || !fullPostUrl) continue;

          // Get likes and comments
          const likesText = $post.find('.like-button-container .label').text().trim();
          const likes = parseInt(likesText || '0', 10);

          const commentsText = $post.find('.post-ufi-comment-button .label').text().trim();
          const comments = parseInt(commentsText || '0', 10);

          // Get thumbnail
          let thumbnail = '';
          const imageContainer = $post.find('.image-tkPTAj.container-XxSyR3');
          if (imageContainer.length > 0) {
            const webpSource = imageContainer.find('source[type="image/webp"]');
            const srcset = webpSource.attr('srcset');
            if (srcset) {
              // Get the highest quality image URL from srcset
              const srcsetParts = srcset.split(',').map(part => part.trim());
              const highestQuality = srcsetParts[srcsetParts.length - 1].split(' ')[0];
              thumbnail = highestQuality;
            } else {
              // Fallback to regular img src
              thumbnail = imageContainer.find('img').attr('src') || '/placeholder-image.jpg';
            }
          } else {
            thumbnail = '/placeholder-image.jpg';
          }

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

        offset++;
        
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error fetching page ${offset + 1}:`, error);
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
        pagesProcessed: offset
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