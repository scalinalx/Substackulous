# Stripe Subscription System Implementation

This document outlines the complete implementation of a Stripe subscription system with PRO (monthly) and LEGEND (yearly) plans, as well as one-time purchases.

## Table of Contents
1. [Database Schema](#database-schema)
2. [Webhook Implementation](#webhook-implementation)
3. [Checkout Functions](#checkout-functions)
4. [Frontend Integration](#frontend-integration)
5. [Subscription Management](#subscription-management)
6. [Authentication Middleware](#authentication-middleware)
7. [Testing](#testing)

## Database Schema

### Existing Tables
- profiles
- payment_logs
- credit_purchase_logs

### New Table: subscription_logs

```sql
CREATE TABLE subscription_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email text REFERENCES profiles(email),
  previous_plan text,
  new_plan text NOT NULL,
  subscription_id text,
  credits_remaining integer,
  credits_added integer,
  event text NOT NULL,
  timestamp timestamptz DEFAULT now()
);
```

## Implementation Steps

### 1. Update Webhook Handler
- Location: `src/app/api/stripe/webhook/route.ts`
- Handle checkout.session.completed events
- Handle subscription cancellations
- Handle payment failures
- Update user profiles accordingly
- Log all events

### 2. Create/Update Checkout Functions
- Location: `src/app/api/stripe/create-checkout/route.ts`
- Implement PRO plan checkout
- Implement LEGEND plan checkout
- Handle one-time purchases
- Add proper metadata

### 3. Update Frontend
- Location: `src/app/dashboard/upgrade/page.tsx`
- Add subscription buttons
- Handle success/cancel redirects
- Show current plan info
- Add cancellation option

### 4. Add Subscription Management
- Create cancel subscription API
- Add subscription management UI
- Handle credit preservation
- Log all changes

### 5. Testing Checklist
- [ ] Test PRO subscription flow
- [ ] Test LEGEND subscription flow
- [ ] Test one-time purchases
- [ ] Test subscription cancellations
- [ ] Verify credit preservation
- [ ] Check webhook handling
- [ ] Verify database updates

## Code Snippets

### Webhook Event Types to Handle
```typescript
// Main events
'checkout.session.completed'
'customer.subscription.deleted'
'invoice.payment_failed'

// Additional events to consider
'customer.subscription.updated'
'invoice.payment_succeeded'
'customer.subscription.trial_will_end'
```

### Plan Transitions to Support
1. Starter → PRO
2. Starter → LEGEND
3. PRO → LEGEND
4. PRO → Cancel → Starter (preserve credits)
5. LEGEND → Cancel → Starter (preserve credits)
6. Any plan + One-time purchase

### Credit Management
- PRO Plan: 2500 credits monthly
- LEGEND Plan: 30000 credits yearly
- One-time: 250 credits (90-day expiration)
- Preserve credits on cancellation
- Reset credits based on plan type

### Database Fields to Track
```sql
-- In profiles table
subscription_plan       -- Current plan (Starter/PRO/LEGEND)
subscription_id        -- Stripe subscription ID
subscription_status    -- active/canceled/payment_failed
credits               -- Current credit balance
credits_reset_date    -- When credits expire/reset
payment_failure_count -- Number of failed payments
```

## Important Notes

### Testing
1. Use Stripe test mode
2. Use test card numbers
3. Test all transitions
4. Verify webhook handling
5. Check database updates

### Production Deployment
1. Update pricing
   - PRO: $47/month
   - LEGEND: $470/year
   - One-time: $7
2. Configure production webhooks
3. Set up monitoring
4. Add error tracking

### Security Considerations
1. Verify webhook signatures
2. Use admin tokens for database
3. Validate user permissions
4. Secure API endpoints

## Useful Commands

### Stripe CLI Testing
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Database Queries
```sql
-- Check user subscriptions
SELECT email, subscription_plan, credits, subscription_status 
FROM profiles 
WHERE subscription_plan != 'Starter';

-- Check payment logs
SELECT * FROM payment_logs 
ORDER BY timestamp DESC 
LIMIT 10;

-- Check subscription changes
SELECT * FROM subscription_logs 
ORDER BY timestamp DESC 
LIMIT 10;
```

## Error Handling

### Common Issues to Handle
1. Failed payments
2. Invalid webhooks
3. Database errors
4. Network timeouts
5. Invalid transitions

### Error Response Format
```typescript
{
  error: string;
  details?: string;
  code?: string;
  status: number;
}
```

## Monitoring

### Key Metrics to Track
1. Successful subscriptions
2. Failed payments
3. Cancellation rate
4. Credit usage
5. Webhook reliability

### Logging Requirements
1. Subscription changes
2. Payment attempts
3. Credit updates
4. User actions
5. System errors

## Future Considerations

### Potential Improvements
1. Add subscription pausing
2. Implement prorated upgrades
3. Add bulk credit purchases
4. Implement referral system
5. Add usage analytics

### Maintenance Tasks
1. Regular price updates
2. Feature additions
3. Performance monitoring
4. Security updates
5. Database optimization 