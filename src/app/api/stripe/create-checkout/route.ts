import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '1000 Credits',
              description: 'Credits for generating content',
            },
            unit_amount: 51, // $0.51
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: process.env.NEXT_PUBLIC_VERCEL_URL
        ? `${process.env.NEXT_PUBLIC_VERCEL_URL}/dashboard?success=true`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
      cancel_url: process.env.NEXT_PUBLIC_VERCEL_URL
        ? `${process.env.NEXT_PUBLIC_VERCEL_URL}/dashboard?canceled=true`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?canceled=true`,
      customer_email: email,
      metadata: {
        credits: '1000',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 