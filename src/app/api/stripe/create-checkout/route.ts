import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

// Function for creating PRO Plan Monthly subscription checkout
async function createProPlanCheckoutSession(email: string) {
  try {
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            recurring: {
              interval: 'month',
            },
            product_data: {
              name: 'PRO Plan Monthly',
              description: '2500 Credits Monthly Plan',
            },
            unit_amount: 51, // $0.51
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/upgrade?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/upgrade?canceled=true`,
      customer_email: email,
      metadata: {
        credits: '2500',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating pro plan checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create pro plan checkout session' },
      { status: 500 }
    );
  }
}

// Function for creating LEGEND Plan Yearly subscription checkout
async function createLegendPlanCheckoutSession(email: string) {
  try {
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            recurring: {
              interval: 'year',
            },
            product_data: {
              name: 'LEGEND Plan Yearly',
              description: '30000 Credits Yearly Plan',
            },
            unit_amount: 51, // $0.51 for testing (change to 47000 for production)
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/upgrade?canceled=true`,
      customer_email: email,
      metadata: {
        credits: '30000',
        plan: 'LEGEND'
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating legend plan checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create legend plan checkout session' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { email, planType } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Handle different plan types
    if (planType === 'pro') {
      return await createProPlanCheckoutSession(email);
    } else if (planType === 'legend') {
      return await createLegendPlanCheckoutSession(email);
    } else {
      // Default one-time payment
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: '250 Credits',
                description: 'Credits for generating content',
              },
              unit_amount: 51, // $0.51
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?canceled=true`,
        customer_email: email,
        metadata: {
          credits: '250',
        },
      });

      return NextResponse.json({ url: session.url });
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 