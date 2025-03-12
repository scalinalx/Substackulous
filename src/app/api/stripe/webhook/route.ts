import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia' as any,
});

export async function POST(req: Request) {
  try {
    console.log('Webhook received');
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    
    console.log('Constructing Stripe event');
    if (!sig) {
      throw new Error('No stripe signature found');
    }
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('Webhook event type:', event.type);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      console.log('Processing checkout.session.completed');
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_details?.email;
      const isSubscription = session.mode === 'subscription';
      
      console.log('Customer email:', customerEmail);
      console.log('Is subscription:', isSubscription);

      if (!customerEmail) {
        console.error('No customer email found in session');
        throw new Error('No customer email found');
      }

      // 1. Get current user profile
      console.log('Fetching user profile');
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', customerEmail)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      if (!profile) {
        console.error('Profile not found for email:', customerEmail);
        throw new Error('Profile not found');
      }

      const creditsToAdd = Number(session.metadata?.credits || 0);
      const planType = session.metadata?.plan || 'one_time';
      console.log('Credits to add:', creditsToAdd);
      console.log('Plan type:', planType);

      // 2. Update profile
      console.log('Updating user profile');
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          credits: (profile.credits || 0) + creditsToAdd,
          subscription_id: isSubscription ? session.subscription as string : null,
          subscription_plan: isSubscription ? planType : profile.subscription_plan,
          subscription_status: isSubscription ? 'active' : profile.subscription_status,
          plan_start_date: isSubscription ? new Date().toISOString() : profile.plan_start_date,
          credits_reset_date: isSubscription 
            ? new Date(Date.now() + (planType === 'LEGEND' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
            : null
        })
        .eq('email', customerEmail);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      // 3. Log credit purchase
      if (creditsToAdd > 0) {
        console.log('Logging credit purchase');
        // console.log ('TESTING TESTINGTEST!!');
        const { error: creditLogError } = await supabaseAdmin
          .from('credit_purchase_logs')
          .insert({
            user_email: customerEmail,
            credits_added: creditsToAdd,
            purchase_type: isSubscription ? planType : 'one_time',
            timestamp: new Date().toISOString(),
            expiration_date: isSubscription 
              ? new Date(Date.now() + (planType === 'LEGEND' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (creditLogError) {
          console.error('Credit purchase log error:', creditLogError);
          throw creditLogError;
        }
      }

      // 4. Log subscription change if applicable
      if (isSubscription) {
        console.log('Logging subscription change');
        const { error: subscriptionLogError } = await supabaseAdmin
          .from('subscription_logs')
          .insert({
            user_email: customerEmail,
            previous_plan: profile.subscription_plan || 'none',
            new_plan: planType,
            subscription_id: session.subscription as string,
            credits_remaining: profile.credits || 0,
            credits_added: creditsToAdd,
            event: 'subscription_started',
            timestamp: new Date().toISOString()
          });

        if (subscriptionLogError) {
          console.error('Subscription log error:', subscriptionLogError);
          throw subscriptionLogError;
        }
      }

      // 5. Log payment
      console.log('Logging payment');
      const { error: paymentLogError } = await supabaseAdmin
        .from('payment_logs')
        .insert({
          user_email: customerEmail,
          subscription_id: isSubscription ? session.subscription as string : null,
          event: isSubscription ? 'subscription_payment' : 'one_time_payment',
          timestamp: new Date().toISOString(),
          details: JSON.stringify(session),
          resolved: true,
          resolution_date: new Date().toISOString(),
          attempt_count: 1
        });

      if (paymentLogError) {
        console.error('Payment log error:', paymentLogError);
        throw paymentLogError;
      }

      console.log('Successfully processed checkout session');
      return NextResponse.json({ received: true });
    }

    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
      console.log('Processing subscription cancellation');
      const subscription = event.data.object as Stripe.Subscription;
      // Get customer email from subscription
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      if (!('email' in customer)) {
        throw new Error('Retrieved customer is not valid');
      }
      const customerEmail = (customer as Stripe.Customer).email;

      console.log('Subscription details:', {
        id: subscription.id,
        customerEmail,
        status: subscription.status,
        cancelAt: subscription.cancel_at
      });

      if (!customerEmail) {
        console.error('No customer email found in subscription');
        throw new Error('No customer email found');
      }

      // Get current user profile
      console.log('Fetching user profile for cancellation');
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', customerEmail)
        .single();

      if (profileError) {
        console.error('Profile fetch error during cancellation:', profileError);
        throw profileError;
      }

      // Update profile subscription status
      console.log('Updating profile subscription status');
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'canceled',
          subscription_id: null,
          subscription_plan: null,
          plan_start_date: null,
          credits_reset_date: null
        })
        .eq('email', customerEmail);

      if (updateError) {
        console.error('Profile update error during cancellation:', updateError);
        throw updateError;
      }

      // Log subscription cancellation
      console.log('Logging subscription cancellation');
      const { error: subscriptionLogError } = await supabaseAdmin
        .from('subscription_logs')
        .insert({
          user_email: customerEmail,
          previous_plan: profile?.subscription_plan || 'unknown',
          new_plan: null,
          subscription_id: subscription.id,
          credits_remaining: profile?.credits || 0,
          event: 'subscription_canceled',
          timestamp: new Date().toISOString()
        });

      if (subscriptionLogError) {
        console.error('Subscription cancellation log error:', subscriptionLogError);
        throw subscriptionLogError;
      }

      console.log('Successfully processed subscription cancellation');
      return NextResponse.json({ received: true });
    }

    // Handle payment failure
    if (event.type === 'invoice.payment_failed') {
      console.log('Processing payment failure');
      const invoice = event.data.object as Stripe.Invoice;
      const customerEmail = invoice.customer_email;

      console.log('Invoice payment failure details:', {
        id: invoice.id,
        customerEmail,
        amount: invoice.amount_due,
        status: invoice.status
      });

      if (!customerEmail) {
        console.error('No customer email found in invoice');
        throw new Error('No customer email found');
      }

      // Log payment failure
      console.log('Logging payment failure');
      const { error: paymentLogError } = await supabaseAdmin
        .from('payment_logs')
        .insert({
          user_email: customerEmail,
          subscription_id: invoice.subscription as string,
          event: 'payment_failed',
          timestamp: new Date().toISOString(),
          details: JSON.stringify(invoice),
          resolved: false,
          attempt_count: (invoice.attempt_count || 1)
        });

      if (paymentLogError) {
        console.error('Payment failure log error:', paymentLogError);
        throw paymentLogError;
      }

      // Update profile subscription status
      console.log('Updating profile payment status');
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'payment_failed'
        })
        .eq('email', customerEmail);

      if (updateError) {
        console.error('Profile update error during payment failure:', updateError);
        throw updateError;
      }

      console.log('Successfully processed payment failure');
      return NextResponse.json({ received: true });
    }

    console.log('Successfully processed webhook');
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
// Add this function before handleSubscriptionEvent
async function getCurrentUser(event: any) {
  const session = event.data.object;
  const customer = await stripe.customers.retrieve(session.customer as string);
  if (!('email' in customer)) {
    throw new Error('Retrieved customer is not valid');
  }
  const customerEmail = (customer as Stripe.Customer).email;

  const { data: user, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', customerEmail)
    .single();

  if (error || !user) {
    throw new Error('Failed to fetch user profile');
  }

  return user;
}

// Add this function to handle subscription cancellations
async function handleSubscriptionCancellation(event: any) {
  const currentUser = await getCurrentUser(event);
  
  return {
    subscription_plan: 'Starter',
    credits: currentUser.credits, // Keep existing credits
    subscription_status: 'canceled',
    subscription_id: null,
    plan_start_date: null,
    credits_reset_date: null
  };
}

// Add this function to handle one-time purchases
async function handleOneTimeCredits(event: any) {
  const { metadata } = event.data.object;
  const creditsToAdd = parseInt(metadata.credits);
  const currentUser = await getCurrentUser(event);
  
  return {
    credits: currentUser.credits + creditsToAdd,
    subscription_plan: currentUser.subscription_plan // Maintain existing plan
  };
}

// Handle subscription events
async function handleSubscriptionEvent(event: any) {
  const subscription = event.data.object;
  const currentUser = await getCurrentUser(event);
  
  // Handle subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
    return {
      subscription_plan: 'Starter',
      credits: currentUser.credits, // Preserve existing credits
      subscription_status: 'canceled',
      subscription_id: null,
      plan_start_date: null,
      credits_reset_date: null
    };
  }

  if (event.type === 'checkout.session.completed') {
    const { mode, metadata } = event.data.object;
    
    // Handle one-time credit purchase
    if (mode === 'payment' && metadata.plan === 'one_time') {
      const creditsToAdd = parseInt(metadata.credits);
      return {
        credits: currentUser.credits + creditsToAdd,
        subscription_plan: currentUser.subscription_plan // Keep existing plan
      };
    }

    // Handle subscription changes
    const newCredits = parseInt(metadata.credits);
    return {
      credits: currentUser.credits + newCredits,
      subscription_plan: metadata.plan,
      subscription_status: 'active',
      subscription_id: event.data.object.subscription,
      plan_start_date: new Date().toISOString(),
      credits_reset_date: new Date(Date.now() + (metadata.plan === 'LEGEND' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
    };
  }
}

