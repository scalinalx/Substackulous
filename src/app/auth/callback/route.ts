import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('Auth callback route triggered');
    
    // Get the URL and extract code and error parameters
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const error_description = requestUrl.searchParams.get('error_description');
    
    // If there's an error, redirect to login with the error
    if (error) {
      console.error('Auth callback error:', error, error_description);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error_description || error)}`, request.url)
      );
    }
    
    // If there's a code, exchange it for a session
    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);
      console.log('Code exchanged for session successfully');
    }
    
    // Redirect to the login page - if the exchange was successful,
    // the user will be automatically redirected to the dashboard
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Error in auth callback:', error);
    return NextResponse.redirect(
      new URL('/login?error=Something went wrong during authentication', request.url)
    );
  }
} 