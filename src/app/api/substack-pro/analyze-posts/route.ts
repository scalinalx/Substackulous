import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';

interface SubstackPost {
  title: string;
  likes: number;
  comments: number;
  restacks: number;
  thumbnail: string;
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

    // Fetch the archive page
    const response = await fetch(archiveUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch Substack archive');
    }

    const html = await response.text();
    const $: CheerioAPI = cheerio.load(html);

    // Extract posts data
    const posts: SubstackPost[] = $('.post-preview').map((_, element) => {
      const $post = $(element);
      
      return {
        title: $post.find('.post-preview-title').text().trim(),
        likes: parseInt($post.find('.like-count').text().trim() || '0', 10),
        comments: parseInt($post.find('.comment-count').text().trim() || '0', 10),
        restacks: parseInt($post.find('.restack-count').text().trim() || '0', 10),
        thumbnail: $post.find('.post-preview-image img').attr('src') || '/placeholder-image.jpg',
      };
    }).get();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error analyzing Substack posts:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to analyze posts',
        code: 'ANALYSIS_ERROR',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
} 