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
    const restackButton = $('a[aria-label="View repost options"].post-ufi-button');
    const restackText = restackButton.find('.label').text().trim();
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

    // First fetch the archive page
    const html = await fetchArchivePage(baseUrl);
    const $: CheerioAPI = cheerio.load(html);
    
    // Find all post containers
    const postElements = $('.container-H2dyKk');
    console.log('Found post elements:', postElements.length);

    if (postElements.length === 0) {
      return NextResponse.json({
        error: 'No posts found on the page',
        debugInfo: {
          ...debugInfo,
          htmlLength: html.length,
          foundSelectors: {
            containers: $('.container-H2dyKk').length,
            anyLinks: $('a').length,
            bodyContent: $('body').text().substring(0, 100) + '...',
          }
        }
      }, { status: 404 });
    }

    const posts: SubstackPost[] = [];
    let processedCount = 0;

    // Process each post element
    for (const element of postElements.toArray()) {
      if (processedCount >= 30) break;

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

      // Get thumbnail - first try webp source, then fallback to img src
      let thumbnail = '';
      const pictureElement = $post.find('.image-tkPTAj picture');
      if (pictureElement.length > 0) {
        const webpSource = pictureElement.find('source[type="image/webp"]');
        const srcset = webpSource.attr('srcset');
        if (srcset) {
          // Get the first URL from srcset (highest quality)
          thumbnail = srcset.split(',')[0].split(' ')[0];
        } else {
          thumbnail = pictureElement.find('img').attr('src') || '/placeholder-image.jpg';
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

      processedCount++;
      console.log(`Processed post ${processedCount}: ${title}`);
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