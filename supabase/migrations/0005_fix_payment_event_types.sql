-- Fix payment event types constraint to allow CHECKOUT_SESSION_CREATED
-- This migration fixes the issue where checkout sessions couldn't be logged

-- Drop the existing constraint
ALTER TABLE design_request_events 
DROP CONSTRAINT IF EXISTS design_request_events_event_type_check;

-- Add the new constraint with all required event types
ALTER TABLE design_request_events 
ADD CONSTRAINT design_request_events_event_type_check 
CHECK (event_type IN (
  'REQUEST_CREATED',
  'REQUEST_SUBMITTED',
  'CHECKOUT_SESSION_CREATED',  -- Add this missing event type
  'PAYMENT_INTENT_CREATED',
  'PAYMENT_SUCCEEDED',
  'PAYMENT_FAILED',
  'PAYMENT_CANCELLED',
  'DESIGN_STARTED',
  'DESIGN_COMPLETED',
  'REQUEST_CANCELLED'
));

-- Add a comment to document the constraint
COMMENT ON CONSTRAINT design_request_events_event_type_check ON design_request_events 
IS 'Ensures only valid event types are allowed in the design request events table';
