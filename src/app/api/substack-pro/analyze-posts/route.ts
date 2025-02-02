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

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Clean and format the URL
    const baseUrl = url.replace(/\/$/, '');
    const archiveUrl = `${baseUrl}/archive?sort=top`;
    
    const debugInfo = {
      originalUrl: url,
      baseUrl,
      archiveUrl,
    };

    console.log('Fetching archive URL:', archiveUrl);

    const response = await fetch(archiveUrl);
    if (!response.ok) {
      return NextResponse.json({
        error: `Failed to fetch Substack archive: ${response.status} ${response.statusText}`,
        debugInfo,
      }, { status: response.status });
    }

    const html = await response.text();
    const $: CheerioAPI = cheerio.load(html);
    
    console.log('Successfully loaded archive page');

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
            possiblePostElements: {
              divs: $('div').length,
              links: $('a[href*="/p/"]').length
            }
          }
        }
      }, { status: 404 });
    }

    const posts: SubstackPost[] = [];

    postElements.each((_, element) => {
      const $post = $(element);
      
      // Get title and URL from the first link with data-testid="post-preview-title"
      const titleElement = $post.find('a[data-testid="post-preview-title"]');
      const title = titleElement.text().trim();
      const postUrl = titleElement.attr('href');
      const fullPostUrl = postUrl ? (postUrl.startsWith('http') ? postUrl : `${baseUrl}${postUrl}`) : '';
      
      // Get likes from the like button container
      const likesText = $post.find('.like-button-container .label').text().trim();
      const likes = parseInt(likesText || '0', 10);

      // Get comments from the comment button
      const commentsText = $post.find('.post-ufi-comment-button .label').text().trim();
      const comments = parseInt(commentsText || '0', 10);

      // Get restacks from the repost button
      const restackText = $post.find('a[aria-label="View repost options"]').prev().text().trim();
      const restacks = parseInt(restackText || '0', 10);

      // Get thumbnail from the post image
      const thumbnail = $post.find('img[src*="substackcdn"]').first().attr('src') || '/placeholder-image.jpg';

      if (title && fullPostUrl) {
        posts.push({
          title,
          likes,
          comments,
          restacks,
          thumbnail,
          url: fullPostUrl,
        });
      }
    });

    console.log('Total posts processed:', posts.length);
    return NextResponse.json({ 
      posts,
      debugInfo: {
        ...debugInfo,
        postsFound: posts.length,
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