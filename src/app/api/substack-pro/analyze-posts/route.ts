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
    const baseUrl = url.replace(/\/$/, ''); // Remove trailing slash if present
    const archiveUrl = `${baseUrl}/archive?sort=top`;
    
    // Return debugging info with the response
    const debugInfo = {
      originalUrl: url,
      baseUrl,
      archiveUrl,
    };

    console.log('Fetching archive URL:', archiveUrl);

    // Fetch the archive page
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

    // Extract posts data
    const posts: SubstackPost[] = [];
    const postElements = $('.post-preview');
    
    console.log('Found post elements:', postElements.length);

    // If no posts found, return early with debug info
    if (postElements.length === 0) {
      return NextResponse.json({
        error: 'No posts found on the page',
        debugInfo: {
          ...debugInfo,
          htmlLength: html.length,
          foundSelectors: {
            postPreview: $('.post-preview').length,
            anyLinks: $('a').length,
            bodyContent: $('body').text().substring(0, 100) + '...',
          }
        }
      }, { status: 404 });
    }

    for (let i = 0; i < postElements.length; i++) {
      const $post = $(postElements[i]);
      
      // Get post URL for restack count
      const postUrl = $post.find('a.post-preview-title').attr('href');
      console.log(`Processing post ${i + 1}:`, postUrl);

      const title = $post.find('.post-preview-title').text().trim();
      console.log('Title:', title);

      const likes = parseInt($post.find('.like-button-container .label').text().trim() || '0', 10);
      console.log('Likes:', likes);

      const comments = parseInt($post.find('.post-ufi-comment-button .label').text().trim() || '0', 10);
      console.log('Comments:', comments);

      // Get restack count by fetching the individual post page
      let restacks = 0;
      if (postUrl) {
        try {
          console.log('Fetching post page for restacks:', postUrl);
          const postResponse = await fetch(postUrl);
          if (postResponse.ok) {
            const postHtml = await postResponse.text();
            const $post = cheerio.load(postHtml);
            const restackText = $post('.post-ufi-button[aria-label="View repost options"] .label').text().trim();
            restacks = parseInt(restackText || '0', 10);
            console.log('Restacks:', restacks);
          }
        } catch (error) {
          console.error('Error fetching restack count:', error);
        }
      }

      const thumbnail = $post.find('.post-preview-image img').attr('src') || '/placeholder-image.jpg';
      console.log('Thumbnail:', thumbnail);

      posts.push({
        title,
        likes,
        comments,
        restacks,
        thumbnail,
        url: postUrl || '',
      });

      console.log('-------------------');
    }

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