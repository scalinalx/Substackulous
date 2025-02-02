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
  const archiveUrl = `${baseUrl}/archive?sort=top${offset > 0 ? `&offset=${offset}` : ''}`;
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
  const webpSource = $post.find('source[type="image/webp"]');
  if (webpSource.length > 0) {
    const srcset = webpSource.attr('srcset');
    if (srcset) {
      // The srcset format is like:
      // https://substackcdn.com/image/fetch/w_424,c_fill,f_webp,q_auto:good,fl_progressive:steep,g_auto/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F4580fca0-b5d6-44c1-b197-aaadf3c55a8e_1200x630.png 424w, ...
      const urls = srcset.split(',').map((part: string) => {
        const [url] = part.trim().split(' ');
        return url;
      });

      // Get the URL with the highest width parameter
      const highestQualityUrl = urls
        .map((url: string) => {
          const match = url.match(/w_(\d+)/);
          return {
            url,
            width: match ? parseInt(match[1], 10) : 0
          };
        })
        .sort((a: { url: string; width: number }, b: { url: string; width: number }) => b.width - a.width)[0]?.url;

      if (highestQualityUrl) {
        // Extract the actual image URL from the Substack CDN URL
        const actualImageUrl = highestQualityUrl.split('/https%3A%2F%2F')[1];
        if (actualImageUrl) {
          return 'https://' + decodeURIComponent(actualImageUrl);
        }
        return highestQualityUrl;
      }
    }
  }

  // Fallback to regular img src
  const img = $post.find('img[src*="substackcdn.com"]');
  const imgSrc = img.attr('src');
  if (imgSrc) {
    // Handle the same URL transformation for regular img src if needed
    const actualImageUrl = imgSrc.split('/https%3A%2F%2F')[1];
    if (actualImageUrl) {
      return 'https://' + decodeURIComponent(actualImageUrl);
    }
    return imgSrc;
  }

  return '/placeholder-image.jpg';
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

    // First fetch just one page to get initial posts
    const html = await fetchArchivePage(baseUrl);
    const $: CheerioAPI = cheerio.load(html);
    
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

    // Process first 15 posts
    const maxPosts = Math.min(15, postElements.length);
    const restackPromises: Promise<number>[] = [];
    const postData: Array<{ title: string; url: string; likes: number; comments: number; thumbnail: string }> = [];

    // First collect all post data and create restack fetch promises
    for (let i = 0; i < maxPosts; i++) {
      const $post = $(postElements[i]);
      
      const titleElement = $post.find('a[data-testid="post-preview-title"]');
      const title = titleElement.text().trim();
      const postUrl = titleElement.attr('href');
      const fullPostUrl = postUrl ? (postUrl.startsWith('http') ? postUrl : `${baseUrl}${postUrl}`) : '';
      
      if (!title || !fullPostUrl || processedUrls.has(fullPostUrl)) continue;
      processedUrls.add(fullPostUrl);

      const likesText = $post.find('.like-button-container .label').text().trim();
      const likes = parseInt(likesText || '0', 10);

      const commentsText = $post.find('.post-ufi-comment-button .label').text().trim();
      const comments = parseInt(commentsText || '0', 10);

      const thumbnail = extractThumbnail($post);

      postData.push({
        title,
        url: fullPostUrl,
        likes,
        comments,
        thumbnail
      });

      // Create promise for restack count but don't await yet
      restackPromises.push(getRestackCount(fullPostUrl));
    }

    // Now fetch all restack counts in parallel
    console.log('Fetching restack counts in parallel...');
    const restackCounts = await Promise.all(restackPromises);

    // Combine post data with restack counts
    posts.push(...postData.map((post, index) => ({
      ...post,
      restacks: restackCounts[index]
    })));

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