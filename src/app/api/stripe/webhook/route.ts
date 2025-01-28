import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

// Fixed credit amount for the payment link
const CREDITS_TO_ADD = 250;

export async function POST(req: Request) {
  console.log('\n=== WEBHOOK REQUEST RECEIVED ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  try {
    const body = await req.text();
    console.log('\nRequest body:', body);
    
    const sig = req.headers.get('stripe-signature');
    console.log('\nStripe signature:', sig);
    console.log('Webhook secret (first 10 chars):', process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 10));

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing signature or webhook secret');
      return NextResponse.json(
        { error: 'Missing stripe signature or webhook secret' },
        { status: 400 }
      );
    }

    try {
      console.log('\nAttempting to construct Stripe event...');
      const event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log('\nEvent constructed successfully');
      console.log('Event type:', event.type);
      console.log('Event data:', JSON.stringify(event.data, null, 2));

      // Handle successful payments from payment link
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email;
        
        console.log('\nProcessing completed checkout session');
        console.log('Customer email:', customerEmail);
        console.log('Session ID:', session.id);
        
        if (!customerEmail) {
          throw new Error('No customer email found in session');
        }

        // Find user by email from the profiles table
        console.log('\nFinding user profile for email:', customerEmail);
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, credits, email')
          .eq('email', customerEmail)
          .single();

        console.log('Profile lookup result:', { userProfile, profileError });

        if (profileError || !userProfile) {
          console.error('Profile error:', profileError);
          throw new Error('Failed to find user profile');
        }

        // Update user's credits in the database
        console.log('\nUpdating credits for user:', userProfile.id);
        console.log('Current credits:', userProfile.credits);
        console.log('Adding credits:', CREDITS_TO_ADD);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            credits: (userProfile.credits || 0) + CREDITS_TO_ADD,
          })
          .eq('id', userProfile.id)
          .select()
          .single();

        if (updateError) {
          console.error('Failed to update credits:', updateError);
          throw new Error('Failed to update credits');
        }

        console.log('\nCredits updated successfully');
        return NextResponse.json({ received: true, updated: true });
      }

      console.log('\nEvent processed but no action taken (not a completed checkout)');
      return NextResponse.json({ received: true, processed: false });
    } catch (err) {
      console.error('\nError constructing/handling Stripe event:', err);
      throw err;
    }
  } catch (error) {
    console.error('\nWebhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: (error as Error).message },
      { status: 400 }
    );
  }
} 