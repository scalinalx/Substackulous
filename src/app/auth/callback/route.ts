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