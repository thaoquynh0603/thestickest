# Payment Tracking System Documentation

## Overview

The Payment Tracking System provides comprehensive tracking of all payments made through Stripe for design requests. This system solves the critical gap of not being able to clearly identify which design requests have been paid for.

## Key Features

### 1. **Clear Payment Status Tracking**
- **Definitive Payment Confirmation**: Each payment is tracked from creation to completion
- **Stripe Integration**: Direct integration with Stripe webhooks for real-time updates
- **Payment Lifecycle**: Track payment from intent creation to success/failure

### 2. **Comprehensive Payment Records**
- **Payment Amount**: Original amount and net amount after discounts
- **Discount Tracking**: Applied discount codes and amounts
- **Stripe Metadata**: Payment intent ID, charge ID, receipt URLs
- **Failure Handling**: Detailed failure reasons and error codes

### 3. **Real-time Webhook Processing**
- **Payment Intent Created**: Track when payment process begins
- **Payment Success**: Confirm successful payments
- **Payment Failure**: Handle failed payments with detailed error information
- **Payment Cancellation**: Track canceled payments

## Database Schema

### `payment_tracking` Table

```sql
CREATE TABLE payment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES design_requests(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    stripe_customer_id TEXT,
    payment_amount INTEGER NOT NULL, -- Amount in cents
    payment_currency TEXT NOT NULL DEFAULT 'usd',
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'canceled', 'failed')),
    payment_method TEXT,
    payment_method_details JSONB,
    
    -- Stripe-specific fields
    stripe_charge_id TEXT,
    stripe_receipt_url TEXT,
    stripe_application_fee_amount INTEGER,
    stripe_transfer_data JSONB,
    
    -- Payment metadata
    discount_code_applied TEXT,
    discount_amount INTEGER DEFAULT 0,
    net_amount INTEGER NOT NULL,
    processing_fee_amount INTEGER DEFAULT 0,
    
    -- Timestamps
    payment_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_confirmed_at TIMESTAMP WITH TIME ZONE,
    payment_failed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Audit fields
    created_by TEXT,
    failure_reason TEXT,
    failure_code TEXT
);
```

## API Endpoints

### 1. **Check Payment Status**
```http
GET /api/payment-status?requestId={uuid}
GET /api/payment-status?designCode={string}
```

**Response:**
```json
{
  "hasPaid": true,
  "paymentStatus": "succeeded",
  "paymentAmount": 29.99,
  "paymentCurrency": "usd",
  "stripePaymentIntentId": "pi_1234567890",
  "paymentConfirmedAt": "2024-01-15T10:30:00Z",
  "discountApplied": "WELCOME20",
  "netAmount": 23.99,
  "message": "Payment confirmed"
}
```

### 2. **Get Detailed Payment Information**
```http
POST /api/payment-status
{
  "requestId": "uuid",
  "designCode": "string"
}
```

**Response:**
```json
{
  "hasPaid": true,
  "paymentStatus": "succeeded",
  "paymentAmount": 29.99,
  "paymentCurrency": "usd",
  "stripePaymentIntentId": "pi_1234567890",
  "stripeChargeId": "ch_1234567890",
  "stripeReceiptUrl": "https://receipt.stripe.com/...",
  "paymentCreatedAt": "2024-01-15T10:25:00Z",
  "paymentConfirmedAt": "2024-01-15T10:30:00Z",
  "discountCode": "WELCOME20",
  "discountAmount": 6.00,
  "netAmount": 23.99,
  "processingFee": 0.73,
  "designCode": "DESIGN-2024-001",
  "email": "customer@example.com",
  "productId": "prod_123",
  "requestStatus": "COMPLETED",
  "message": "Payment confirmed"
}
```

### 3. **Enhanced Payment Analytics**
```http
GET /api/payment-analytics-enhanced?period=30d&includeUnpaid=true
```

**Response:**
```json
{
  "period": "30d",
  "summary": {
    "totalRequests": 150,
    "paidRequests": 89,
    "unpaidRequests": 61,
    "conversionRate": 59.33,
    "totalRevenue": 2670.00,
    "totalDiscounts": 445.50,
    "averageOrderValue": 30.00
  },
  "dailyTrends": [...],
  "paidRequests": [...],
  "unpaidRequests": [...],
  "insights": {...}
}
```

## Utility Functions

### 1. **Check Payment Status**
```typescript
import { checkPaymentStatusByRequestId, checkPaymentStatusByDesignCode } from '@/lib/paymentUtils';

// Check by request ID
const status = await checkPaymentStatusByRequestId('request-uuid');

// Check by design code
const status = await checkPaymentStatusByDesignCode('DESIGN-2024-001');
```

### 2. **Get Payment Details**
```typescript
import { getPaymentDetails } from '@/lib/paymentUtils';

const details = await getPaymentDetails('request-uuid');
if (details?.hasPaid) {
  console.log(`Payment confirmed: $${details.netAmount}`);
}
```

### 3. **Check if Request is Paid**
```typescript
import { hasRequestBeenPaid } from '@/lib/paymentUtils';

const isPaid = await hasRequestBeenPaid('request-uuid');
if (isPaid) {
  // Process paid request
}
```

## Stripe Webhook Integration

### Webhook Events Handled

1. **`payment_intent.created`**
   - Creates payment tracking record
   - Sets initial status to 'pending'

2. **`payment_intent.succeeded`**
   - Updates payment status to 'succeeded'
   - Sets payment confirmation timestamp
   - Records Stripe charge ID

3. **`payment_intent.payment_failed`**
   - Updates payment status to 'failed'
   - Records failure reason and error code
   - Sets payment failure timestamp

4. **`payment_intent.canceled`**
   - Updates payment status to 'canceled'
   - Records cancellation details

5. **`checkout.session.completed`**
   - Updates payment status to 'succeeded'
   - Records checkout session completion

## Database Functions

### 1. **`insert_payment_tracking`**
Creates a new payment tracking record when payment intent is created.

### 2. **`update_payment_status`**
Updates payment status based on Stripe webhook events.

### 3. **`get_request_payment_summary`**
Returns payment summary for a specific design request.

### 4. **`get_paid_requests`**
Returns all paid requests within a date range for analytics.

## Views

### 1. **`payment_tracking_analytics`**
Daily aggregation of payment metrics including:
- Total payments per day
- Successful vs failed payments
- Revenue and discount totals
- Average payment amounts

## Security Features

### 1. **Row Level Security (RLS)**
- Public read access for analytics
- Authenticated users only for write operations

### 2. **Security Definer Functions**
- Database functions run with elevated privileges
- Secure payment tracking operations

### 3. **Input Validation**
- Comprehensive parameter validation
- SQL injection prevention

## Migration Instructions

### 1. **Apply Database Migration**
```bash
# Run the migration file
supabase db push
```

### 2. **Update Environment Variables**
Ensure Stripe webhook endpoint is configured to handle new events:
- `payment_intent.created`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `checkout.session.completed`

### 3. **Test Webhook Integration**
Verify that payment tracking records are created and updated correctly.

## Benefits

### 1. **Clear Payment Visibility**
- **Definitive Payment Status**: No more ambiguity about whether a request was paid
- **Real-time Updates**: Immediate payment status updates via webhooks
- **Complete Audit Trail**: Full payment history for each request

### 2. **Improved Analytics**
- **Conversion Tracking**: Clear visibility into payment conversion rates
- **Revenue Analysis**: Accurate revenue tracking with discount accounting
- **Customer Insights**: Payment behavior analysis

### 3. **Operational Efficiency**
- **Automated Tracking**: No manual payment verification needed
- **Error Handling**: Comprehensive failure tracking and reporting
- **Compliance**: Complete payment audit trail for regulatory requirements

### 4. **Customer Experience**
- **Payment Confirmation**: Clear confirmation of successful payments
- **Receipt Access**: Direct access to Stripe receipts
- **Status Transparency**: Real-time payment status updates

## Troubleshooting

### Common Issues

1. **Payment Tracking Record Not Created**
   - Check Stripe webhook configuration
   - Verify `payment_intent.created` event handling
   - Check database function permissions

2. **Payment Status Not Updated**
   - Verify webhook signature validation
   - Check Stripe webhook endpoint configuration
   - Review database function execution logs

3. **Missing Payment Data**
   - Ensure all required metadata is passed in Stripe payment intent
   - Verify webhook event processing
   - Check database constraints and relationships

### Debug Tools

1. **Webhook Logs**: Check Stripe dashboard for webhook delivery status
2. **Database Logs**: Review function execution logs
3. **API Response**: Use payment status endpoints for debugging

## Future Enhancements

### 1. **Payment Analytics Dashboard**
- Real-time payment metrics
- Conversion rate optimization
- Revenue forecasting

### 2. **Advanced Reporting**
- Customer payment behavior analysis
- Product performance metrics
- Geographic payment patterns

### 3. **Automated Notifications**
- Payment confirmation emails
- Failed payment alerts
- Payment reminder system

This payment tracking system provides the foundation for comprehensive payment management and analytics, ensuring clear visibility into which design requests have been paid for through Stripe.
