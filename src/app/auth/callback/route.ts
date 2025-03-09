import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // Log the request for debugging
  console.log('Auth callback received:', { url: request.url, code });
  
  // Create a Supabase client for the server
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // If we have a code, exchange it for a session
  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      // Continue anyway, as we'll redirect to login
    }
  }
  
  // Always redirect to login - if the exchange was successful,
  // the user will be automatically redirected to the dashboard
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
} 