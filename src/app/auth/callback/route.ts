import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const token = requestUrl.searchParams.get('token');
  
  const supabase = createRouteHandlerClient({ cookies });
  
  // Handle different auth flows
  if (code) {
    // OAuth or magic link flow
    await supabase.auth.exchangeCodeForSession(code);
  } else if (token && type === 'signup') {
    // Email verification flow
    try {
      // Verify the token
      await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      });
      
      // Redirect to a success page
      return NextResponse.redirect(new URL('/auth/verification-success', request.url));
    } catch (error) {
      console.error('Verification error:', error);
      return NextResponse.redirect(new URL('/auth/verification-error', request.url));
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', request.url));
} 