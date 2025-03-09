import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
    // Handle different auth flows
    if (code) {
      // OAuth or magic link flow
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Code exchange error:', error);
        return NextResponse.redirect(new URL('/auth/verification-error', request.url));
      }
      
      // Successful code exchange
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } 
    
    // If we don't have a code but we're in the callback, it might be a redirect from email verification
    // In this case, we should just redirect to the success page
    return NextResponse.redirect(new URL('/auth/verification-success', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/auth/verification-error', request.url));
  }
} 