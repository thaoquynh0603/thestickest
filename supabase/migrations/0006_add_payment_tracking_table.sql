-- Migration: Add comprehensive payment tracking table
-- This migration adds a dedicated table to track actual payments made through Stripe
-- and provides clear visibility into which design requests have been paid for

-- Create the payment_tracking table
CREATE TABLE IF NOT EXISTS payment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES design_requests(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    stripe_customer_id TEXT,
    payment_amount INTEGER NOT NULL, -- Amount in cents
    payment_currency TEXT NOT NULL DEFAULT 'usd',
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'canceled', 'failed')),
    payment_method TEXT, -- 'card', 'bank_transfer', etc.
    payment_method_details JSONB, -- Store card brand, last4, etc.
    
    -- Stripe-specific fields
    stripe_charge_id TEXT,
    stripe_receipt_url TEXT,
    stripe_application_fee_amount INTEGER,
    stripe_transfer_data JSONB,
    
    -- Payment metadata
    discount_code_applied TEXT,
    discount_amount INTEGER DEFAULT 0,
    net_amount INTEGER NOT NULL, -- Amount after discounts/fees
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

-- Add comments for documentation
COMMENT ON TABLE payment_tracking IS 'Tracks actual payments made through Stripe for design requests';
COMMENT ON COLUMN payment_tracking.payment_amount IS 'Payment amount in cents (e.g., 1000 = $10.00)';
COMMENT ON COLUMN payment_tracking.payment_status IS 'Current status of the payment in Stripe';
COMMENT ON COLUMN payment_tracking.stripe_payment_intent_id IS 'Unique Stripe payment intent identifier';
COMMENT ON COLUMN payment_tracking.discount_code_applied IS 'Discount code used for this payment';
COMMENT ON COLUMN payment_tracking.net_amount IS 'Final amount charged to customer after discounts and fees';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_tracking_request_id ON payment_tracking(request_id);
CREATE INDEX IF NOT EXISTS idx_payment_tracking_stripe_payment_intent ON payment_tracking(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_tracking_status ON payment_tracking(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_tracking_created_at ON payment_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_tracking_payment_confirmed ON payment_tracking(payment_confirmed_at);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_payment_tracking_request_status ON payment_tracking(request_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_tracking_date_status ON payment_tracking(DATE(created_at), payment_status);

-- Add a unique constraint to ensure one payment record per request
-- (This allows for payment retries but prevents duplicate successful payments)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_tracking_request_unique 
ON payment_tracking(request_id) WHERE payment_status = 'succeeded';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_payment_tracking_updated_at
    BEFORE UPDATE ON payment_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_tracking_updated_at();

-- Create a function to get payment summary for a request
CREATE OR REPLACE FUNCTION get_request_payment_summary(p_request_id UUID)
RETURNS TABLE(
    request_id UUID,
    has_paid BOOLEAN,
    payment_amount INTEGER,
    payment_currency TEXT,
    payment_status TEXT,
    stripe_payment_intent_id TEXT,
    payment_confirmed_at TIMESTAMP WITH TIME ZONE,
    discount_applied TEXT,
    net_amount INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.request_id,
        pt.payment_status = 'succeeded' as has_paid,
        pt.payment_amount,
        pt.payment_currency,
        pt.payment_status,
        pt.stripe_payment_intent_id,
        pt.payment_confirmed_at,
        pt.discount_code_applied,
        pt.net_amount
    FROM payment_tracking pt
    WHERE pt.request_id = p_request_id
    ORDER BY pt.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a function to get all paid requests
CREATE OR REPLACE FUNCTION get_paid_requests(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    request_id UUID,
    design_code TEXT,
    email TEXT,
    payment_amount INTEGER,
    payment_currency TEXT,
    payment_confirmed_at TIMESTAMP WITH TIME ZONE,
    discount_code TEXT,
    net_amount INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.request_id,
        dr.design_code,
        dr.email,
        pt.payment_amount,
        pt.payment_currency,
        pt.payment_confirmed_at,
        pt.discount_code_applied,
        pt.net_amount
    FROM payment_tracking pt
    JOIN design_requests dr ON pt.request_id = dr.id
    WHERE pt.payment_status = 'succeeded'
    AND pt.payment_confirmed_at BETWEEN p_start_date AND p_end_date
    ORDER BY pt.payment_confirmed_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a view for easy payment analytics
CREATE OR REPLACE VIEW payment_tracking_analytics AS
SELECT 
    DATE(created_at) as payment_date,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE payment_status = 'succeeded') as successful_payments,
    COUNT(*) FILTER (WHERE payment_status = 'failed') as failed_payments,
    COUNT(*) FILTER (WHERE payment_status = 'pending') as pending_payments,
    SUM(payment_amount) FILTER (WHERE payment_status = 'succeeded') as total_revenue_cents,
    SUM(net_amount) FILTER (WHERE payment_status = 'succeeded') as total_net_revenue_cents,
    SUM(discount_amount) FILTER (WHERE payment_status = 'succeeded') as total_discounts_cents,
    AVG(payment_amount) FILTER (WHERE payment_status = 'succeeded') as avg_payment_amount_cents
FROM payment_tracking
GROUP BY DATE(created_at)
ORDER BY payment_date DESC;

-- Grant appropriate permissions
GRANT SELECT ON payment_tracking TO authenticated;
GRANT SELECT ON payment_tracking TO anon;
GRANT SELECT ON payment_tracking_analytics TO authenticated;
GRANT SELECT ON payment_tracking_analytics TO anon;

-- Add RLS policies for security
ALTER TABLE payment_tracking ENABLE ROW LEVEL SECURITY;

-- Allow public read access to payment tracking (needed for analytics)
CREATE POLICY "Allow public read access to payment tracking" ON payment_tracking
    FOR SELECT USING (true);

-- Only allow authenticated users to insert/update payment tracking
CREATE POLICY "Allow authenticated users to manage payment tracking" ON payment_tracking
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a function to insert payment tracking record
CREATE OR REPLACE FUNCTION insert_payment_tracking(
    p_request_id UUID,
    p_stripe_payment_intent_id TEXT,
    p_payment_amount INTEGER,
    p_payment_currency TEXT DEFAULT 'usd',
    p_stripe_customer_id TEXT DEFAULT NULL,
    p_discount_code TEXT DEFAULT NULL,
    p_discount_amount INTEGER DEFAULT 0,
    p_created_by TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
BEGIN
    INSERT INTO payment_tracking (
        request_id,
        stripe_payment_intent_id,
        payment_amount,
        payment_currency,
        stripe_customer_id,
        payment_status,
        discount_code_applied,
        discount_amount,
        net_amount,
        payment_created_at,
        created_by
    ) VALUES (
        p_request_id,
        p_stripe_payment_intent_id,
        p_payment_amount,
        p_payment_currency,
        p_stripe_customer_id,
        'pending',
        p_discount_code,
        p_discount_amount,
        p_payment_amount - p_discount_amount,
        NOW(),
        p_created_by
    )
    RETURNING id INTO v_payment_id;
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update payment status
CREATE OR REPLACE FUNCTION update_payment_status(
    p_stripe_payment_intent_id TEXT,
    p_payment_status TEXT,
    p_stripe_charge_id TEXT DEFAULT NULL,
    p_stripe_receipt_url TEXT DEFAULT NULL,
    p_failure_reason TEXT DEFAULT NULL,
    p_failure_code TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN := false;
BEGIN
    UPDATE payment_tracking 
    SET 
        payment_status = p_payment_status,
        stripe_charge_id = COALESCE(p_stripe_charge_id, stripe_charge_id),
        stripe_receipt_url = COALESCE(p_stripe_receipt_url, stripe_receipt_url),
        failure_reason = p_failure_reason,
        failure_code = p_failure_code,
        payment_confirmed_at = CASE WHEN p_payment_status = 'succeeded' THEN NOW() ELSE payment_confirmed_at END,
        payment_failed_at = CASE WHEN p_payment_status = 'failed' THEN NOW() ELSE payment_failed_at END,
        updated_at = NOW()
    WHERE stripe_payment_intent_id = p_stripe_payment_intent_id;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to functions
COMMENT ON FUNCTION insert_payment_tracking IS 'Inserts a new payment tracking record for a design request';
COMMENT ON FUNCTION update_payment_status IS 'Updates the payment status based on Stripe webhook events';
COMMENT ON FUNCTION get_request_payment_summary IS 'Returns payment summary for a specific design request';
COMMENT ON FUNCTION get_paid_requests IS 'Returns all paid requests within a date range for analytics';
