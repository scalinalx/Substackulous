// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
})

const CREDITS_TO_ADD = 250

console.log("Hello from Functions!")

// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}

// Helper function to verify Stripe signature
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  try {
    const pairs = sigHeader.split(',');
    const timestamp = pairs.find(pair => pair.startsWith('t='))?.split('=')[1];
    const signatures = pairs
      .filter(pair => pair.startsWith('v1='))
      .map(pair => pair.split('=')[1]);

    if (!timestamp || signatures.length === 0) {
      console.error('Invalid signature format');
      return false;
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );

    const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return signatures.some(sig => sig === expectedSignatureHex);
  } catch (err) {
    console.error('Error verifying signature:', err);
    return false;
  }
}

serve(async (req) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
      },
    })
  }

  try {
    console.log('Webhook received')
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.error('No signature found')
      return new Response('No signature', { status: 400 })
    }

    const body = await req.text()
    console.log('Verifying signature...')
    console.log('Signature header:', signature)
    
    const isValid = await verifyStripeSignature(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );

    if (!isValid) {
      console.error('Invalid signature')
      return new Response('Invalid signature', { status: 400 })
    }

    const event = JSON.parse(body);
    console.log('Signature verified, processing event:', event.type)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const customerEmail = session.customer_details?.email

      console.log('Processing checkout for email:', customerEmail)

      if (!customerEmail) {
        throw new Error('No customer email found in session')
      }

      // Initialize Supabase client
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // Find user by email
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, credits')
        .eq('email', customerEmail)
        .single()

      console.log('Found profile:', userProfile)

      if (profileError || !userProfile) {
        console.error('Profile error:', profileError)
        throw new Error('Failed to find user profile')
      }

      // Update credits
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          credits: (userProfile.credits || 0) + CREDITS_TO_ADD,
        })
        .eq('id', userProfile.id)

      if (updateError) {
        console.error('Update error:', updateError)
        throw new Error('Failed to update credits')
      }

      console.log('Credits updated successfully')

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/stripe-webhook' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
