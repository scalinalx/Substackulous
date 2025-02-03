import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface SubstackPost {
  title: string;
  likes: number;
  comments: number;
  restacks: number;
  thumbnail: string;
  url: string;
}

async function fetchPageHtml(url: string): Promise<string> {
  const response = await fetch('https://instantapi.ai/api/retrieve/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      webpage_url: url,
      api_key: 'FREE_CLASSIC_SCRAPER',
      enable_javascript: true,
      wait_for_xpath: '.container-H2dyKk' // Wait for post containers to load
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`API Error: ${data.reason}`);
  }

  return data.verbose_full_html;
}

async function extractPostData(html: string, baseUrl: string): Promise<SubstackPost[]> {
  const $ = cheerio.load(html);
  const posts: SubstackPost[] = [];
  const processedUrls = new Set<string>();

  $('.container-H2dyKk').each((_, element) => {
    try {
      // Extract title and URL
      const titleElement = $(element).find('a[data-testid="post-preview-title"]');
      const title = titleElement.text().trim();
      const postUrl = titleElement.attr('href');
      const fullPostUrl = postUrl ? (postUrl.startsWith('http') ? postUrl : `${baseUrl}${postUrl}`) : '';
      
      if (!title || !fullPostUrl || processedUrls.has(fullPostUrl)) return;
      processedUrls.add(fullPostUrl);

      // Extract likes
      const likesText = $(element).find('.like-button-container .label').text().trim();
      const likes = parseInt(likesText || '0', 10);

      // Extract comments
      const commentsText = $(element).find('.post-ufi-comment-button .label').text().trim();
      const comments = parseInt(commentsText || '0', 10);

      // Extract thumbnail
      let thumbnail = '';
      const imgSelectors = [
        '.image-nBNbRY',
        '.img-OACg1c',
        'img[src*="substackcdn.com"]',
        'img[src*="substack-post-media"]'
      ];

      for (const selector of imgSelectors) {
        const img = $(element).find(selector);
        if (img.length > 0 && img.attr('src')) {
          thumbnail = img.attr('src') || '';
          break;
        }
      }

      // If no direct image found, try webp source
      if (!thumbnail) {
        const webpSource = $(element).find('source[type="image/webp"]');
        if (webpSource.length > 0) {
          const srcset = webpSource.attr('srcset');
          if (srcset) {
            const firstUrl = srcset.split(',')[0].trim().split(' ')[0];
            if (firstUrl) {
              thumbnail = firstUrl;
            }
          }
        }
      }

      posts.push({
        title,
        url: fullPostUrl,
        likes,
        comments,
        restacks: 0, // We'll fetch this separately
        thumbnail
      });
    } catch (error) {
      console.error('Error processing post:', error);
    }
  });

  return posts;
}

async function getRestackCount(url: string): Promise<number> {
  try {
    const html = await fetchPageHtml(url);
    const $ = cheerio.load(html);
    const restackText = $('a[aria-label="View repost options"].post-ufi-button.style-button .label').first().text().trim();
    return parseInt(restackText || '0', 10);
  } catch (error) {
    console.error('Error fetching restack count:', error);
    return 0;
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
    console.log('Fetching archive page...');
    const html = await fetchPageHtml(`${baseUrl}/archive?sort=top`);

    // Extract post data
    console.log('Extracting post data...');
    let posts = await extractPostData(html, baseUrl);
    console.log(`Found ${posts.length} posts`);

    // Take only the first 30 posts
    posts = posts.slice(0, 30);

    // Fetch restack counts in parallel
    console.log('Fetching restack counts...');
    const restackPromises = posts.map(post => getRestackCount(post.url));
    const restackCounts = await Promise.all(restackPromises);

    // Combine the data
    const finalPosts = posts.map((post, index) => ({
      ...post,
      restacks: restackCounts[index]
    }));

    console.log('Total posts processed:', finalPosts.length);
    
    return NextResponse.json({ 
      posts: finalPosts,
      debugInfo: {
        ...debugInfo,
        postsFound: finalPosts.length
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