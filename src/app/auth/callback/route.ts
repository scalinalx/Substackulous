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
  
  // For all verification flows, redirect to login with the code
  // Let the client-side handle the actual verification
  if (code || type === 'signup' || type === 'recovery' || type === 'invite') {
    const loginUrl = new URL('/login', requestUrl.origin);
    
    // If we have a code, add it to the URL
    if (code) {
      loginUrl.searchParams.set('code', code);
    }
    
    return NextResponse.redirect(loginUrl);
  }
  
  // Default fallback - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
} 