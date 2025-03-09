import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  
  // Extract all possible parameters
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const token = requestUrl.searchParams.get('token');
  
  // Log the request for debugging
  console.log('Auth callback received:', { url: request.url, code, type, token });
  
  // Create a new response URL to redirect to after processing
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Handle OAuth code exchange
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Code exchange error:', error);
        return NextResponse.redirect(new URL('/auth/verification-error', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Handle email verification
    // For email verification, we'll redirect to the login page
    // The actual verification happens on Supabase's side before redirecting here
    if (type === 'signup' || type === 'recovery' || type === 'invite') {
      // Store the original URL in a cookie for potential retry
      const originalUrl = request.url;
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set('auth_redirect', originalUrl, { 
        path: '/',
        maxAge: 60 * 10, // 10 minutes
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
      return response;
    }
    
    // Default fallback - redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    // Include the original URL as a query parameter for retry
    const errorUrl = new URL('/auth/verification-error', request.url);
    errorUrl.searchParams.set('originalUrl', request.url);
    return NextResponse.redirect(errorUrl);
  }
}

// Helper function to extract token from URL
// Sometimes the token might be in a different part of the URL
function extractTokenFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Check if token is in the query parameters
    const token = urlObj.searchParams.get('token');
    if (token) return token;
    
    // Check if token is in the path
    const pathParts = urlObj.pathname.split('/');
    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i] === 'verify' && i + 1 < pathParts.length) {
        return pathParts[i + 1];
      }
    }
    
    // Check if token is in the hash
    if (urlObj.hash && urlObj.hash.includes('token=')) {
      const hashParams = new URLSearchParams(urlObj.hash.substring(1));
      return hashParams.get('token');
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting token from URL:', error);
    return null;
  }
} 