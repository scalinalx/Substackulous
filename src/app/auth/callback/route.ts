import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const token = requestUrl.searchParams.get('token');
  
  // Log the request parameters for debugging
  console.log('Auth callback params:', { code, type, token, url: request.url });
  
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // If we have a code, it's an OAuth or magic link flow
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Code exchange error:', error);
        return NextResponse.redirect(new URL('/auth/verification-error', request.url));
      }
      
      // Successful code exchange
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // If we have a token in the URL, it's likely from email verification
    // We'll try to extract it from the URL and handle it
    const urlToken = token || extractTokenFromUrl(request.url);
    
    if (urlToken) {
      // For email verification, we'll redirect to the success page
      // The actual verification happens on Supabase's side before redirecting here
      return NextResponse.redirect(new URL('/auth/verification-success', request.url));
    }
    
    // If we don't have a code or token, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/auth/verification-error', request.url));
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