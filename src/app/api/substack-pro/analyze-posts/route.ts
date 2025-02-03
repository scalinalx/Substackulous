import { NextResponse } from 'next/server';
import { chromium } from '@playwright/test';

interface SubstackPost {
  title: string;
  likes: number;
  comments: number;
  restacks: number;
  thumbnail: string;
  url: string;
}

async function autoScroll(page: any) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

async function extractPostData(page: any): Promise<SubstackPost[]> {
  return page.evaluate(() => {
    const posts: SubstackPost[] = [];
    const postElements = document.querySelectorAll('.container-H2dyKk');
    
    postElements.forEach((element) => {
      try {
        // Extract title and URL
        const titleElement = element.querySelector('a[data-testid="post-preview-title"]');
        if (!titleElement) return;
        
        const title = titleElement.textContent?.trim() || '';
        const url = (titleElement as HTMLAnchorElement).href;
        
        // Extract likes
        const likesElement = element.querySelector('.like-button-container .label');
        const likes = parseInt(likesElement?.textContent?.trim() || '0', 10);
        
        // Extract comments
        const commentsElement = element.querySelector('.post-ufi-comment-button .label');
        const comments = parseInt(commentsElement?.textContent?.trim() || '0', 10);
        
        // Extract thumbnail
        let thumbnail = '';
        const imgSelectors = [
          '.image-nBNbRY',
          '.img-OACg1c',
          'img[src*="substackcdn.com"]',
          'img[src*="substack-post-media"]'
        ];

        for (const selector of imgSelectors) {
          const imgElement = element.querySelector(selector);
          if (imgElement && 'src' in imgElement) {
            thumbnail = (imgElement as HTMLImageElement).src;
            break;
          }
        }

        // If no direct image found, try webp source
        if (!thumbnail) {
          const webpSource = element.querySelector('source[type="image/webp"]');
          if (webpSource && webpSource.hasAttribute('srcset')) {
            const srcset = webpSource.getAttribute('srcset') || '';
            const firstUrl = srcset.split(',')[0].trim().split(' ')[0];
            if (firstUrl) {
              thumbnail = firstUrl;
            }
          }
        }

        posts.push({
          title,
          url,
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
  });
}

async function getRestackCount(page: any, url: string): Promise<number> {
  try {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const restackElement = await page.locator('a[aria-label="View repost options"].post-ufi-button.style-button .label').first();
    const restackText = await restackElement.textContent();
    return parseInt(restackText?.trim() || '0', 10);
  } catch (error) {
    console.error('Error fetching restack count:', error);
    return 0;
  }
}

export async function POST(request: Request) {
  let browser;
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

    // Launch browser
    browser = await chromium.launch({
      args: ['--no-sandbox']
    });

    // Create a new context
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });

    // Create a new page
    const page = await context.newPage();

    // Navigate to the archive page
    console.log('Navigating to archive page...');
    await page.goto(`${baseUrl}/archive?sort=top`);
    await page.waitForLoadState('networkidle');

    // Scroll to load more posts
    console.log('Scrolling to load more posts...');
    await autoScroll(page);

    // Wait a bit for any final loading
    await page.waitForTimeout(2000);

    // Extract post data
    console.log('Extracting post data...');
    let posts = await extractPostData(page);
    console.log(`Found ${posts.length} posts`);

    // Take only the first 30 posts
    posts = posts.slice(0, 30);

    // Create a new page for fetching restack counts
    const restackPage = await context.newPage();
    
    // Fetch restack counts in parallel
    console.log('Fetching restack counts...');
    const restackPromises = posts.map(post => getRestackCount(restackPage, post.url));
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
  } finally {
    if (browser) {
      await browser.close();
    }
  }
} 