# Stripe Payment Integration Setup

This guide explains how to set up the Stripe payment integration for the $2 design request fee.

## Environment Variables Required

Add the following environment variables to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Stripe Dashboard Setup

1. **Create a Stripe Account**: Sign up at [stripe.com](https://stripe.com)

2. **Get API Keys**:
   - Go to Developers → API keys in your Stripe dashboard
   - Copy your publishable key and secret key
   - Use test keys for development, live keys for production

3. **Set Up Webhooks**:
   - Go to Developers → Webhooks in your Stripe dashboard
   - Click "Add endpoint"
   - Set the endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
   - Select these events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy the webhook signing secret and add it to your environment variables

## Database Schema Updates

Make sure your `design_requests` table has these columns:

```sql
ALTER TABLE design_requests 
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'DRAFT';
```

## Testing

1. **Test Mode**: Use Stripe's test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

2. **Test the Flow**:
   - Go through the design request process
   - Reach the payment step
   - Use a test card to complete payment
   - Verify the application status updates to 'PAID'

## Production Deployment

1. **Switch to Live Keys**: Replace test keys with live keys in production
2. **Update Webhook URL**: Point webhook to your production domain
3. **SSL Required**: Ensure your domain has SSL for webhook security
4. **Monitor Webhooks**: Check Stripe dashboard for webhook delivery status

## Security Notes

- Never expose your secret key in client-side code
- Always verify webhook signatures
- Use environment variables for all sensitive data
- Test thoroughly in Stripe's test mode before going live

## Troubleshooting

- **Webhook Failures**: Check webhook logs in Stripe dashboard
- **Payment Declines**: Verify card details and Stripe account status
- **Environment Variables**: Ensure all required variables are set
- **Database Connection**: Verify Supabase connection and permissions
