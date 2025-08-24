# Email Confirmation System Setup Guide

## Overview
This system automatically sends confirmation emails when design requests are successfully submitted, both for paid requests and zero-amount requests (when discounts are applied).

## Email Service: Resend
We're using [Resend](https://resend.com) as our email service provider for reliable email delivery.

## Setup Steps

### 1. Get Resend API Key
1. Go to [resend.com](https://resend.com) and create an account
2. Verify your domain (or use the provided test domain)
3. Go to API Keys section and create a new API key
4. Copy the API key

### 2. Configure Environment Variables
Create a `.env.local` file in your project root with:

```bash
# Resend Email Service
RESEND_API_KEY=your_resend_api_key_here

# Existing variables (if not already set)
NEXT_PUBLIC_SUPABASE_URL=https://hyrjcmrvrxtepvlpmgxs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

### 3. Domain Verification ✅ COMPLETED
Your domain "thestickest.com" has been verified in Resend!
The email configuration is already set to use your verified domain.

## How It Works

### Email Triggers
1. **Stripe Payment Success**: When a customer successfully pays via Stripe
2. **Zero-Amount Payment**: When a discount code makes the payment $0

### Email Recipients
- **Customer**: Gets confirmation with design code and next steps
- **Admin**: Gets notification of new successful request

### Email Content
- **Customer Email**: 
  - Design confirmation
  - Design code for tracking
  - Payment details (including discount info if applicable)
  - **Application details** (all questions and answers from the design request)
  - Next steps
  - TheStickest branding with logo

- **Admin Email**:
  - New request notification
  - Customer details
  - Design code
  - Payment information
  - **Complete application details** (all questions and answers for review)
  - Action required reminder

## Email Templates
Templates are generated dynamically in `src/lib/email.ts`:
- HTML version with styling and TheStickest logo
- Plain text version for email clients that don't support HTML
- Responsive design for mobile devices

## Error Handling
- Email failures don't block payment confirmation
- All email errors are logged for debugging
- Emails are sent asynchronously to avoid blocking webhook responses

## Testing
1. Make a test design request
2. Complete payment (or apply discount for zero-amount)
3. Check your email for confirmation
4. Check admin email (quynh.datame@gmail.com) for notification

## Customization
- **Logo**: ✅ Updated to use public Supabase URL (no authentication required)
- **Colors**: Modify CSS variables in email HTML
- **Content**: Update email text in the template functions
- **Admin Email**: Change the admin email address in `sendAdminNotificationEmail`

## Troubleshooting
- Check Resend dashboard for delivery status
- Verify API key is correct
- Check console logs for email errors
- Ensure environment variables are loaded
- Verify domain verification if using custom domain

## Security Notes
- API keys are server-side only
- Emails are sent from verified domains
- No sensitive payment data in emails
- Customer emails only sent to verified customer addresses
