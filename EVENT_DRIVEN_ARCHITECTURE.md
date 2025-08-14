# Event-Driven Architecture for Design Requests

## Overview

This document describes the new event-driven architecture implemented to prevent data loss and provide better audit trails for design requests. Instead of using UPDATE/INSERT operations that can overwrite data, we now use an immutable event log approach.

## Problem Solved

**Previous Issues:**
- UPDATE operations could overwrite important data
- No audit trail of state changes
- Risk of data loss during concurrent operations
- Difficult to track the history of a request

**Solution:**
- Immutable event log for all state changes
- Separate tables for different concerns
- Complete audit trail
- No data loss through overwrites

## Architecture Components

### 1. Event Tables

#### `design_request_events` (Immutable Event Log)
```sql
- id: UUID (Primary Key)
- request_id: UUID (Foreign Key to design_requests)
- event_type: VARCHAR (REQUEST_CREATED, REQUEST_SUBMITTED, PAYMENT_INTENT_CREATED, etc.)
- event_data: JSONB (Event-specific data)
- created_at: TIMESTAMPTZ
- created_by: VARCHAR (Who triggered the event)
- metadata: JSONB (Additional context)
```

#### `design_request_states` (Current State View)
```sql
- id: UUID (Primary Key)
- request_id: UUID (Foreign Key, Unique)
- current_status: VARCHAR (DRAFT, SUBMITTED, PAID, etc.)
- current_payment_status: VARCHAR (PENDING, PROCESSING, SUCCEEDED, etc.)
- email: VARCHAR
- design_code: VARCHAR
- product_id: UUID
- total_amount: NUMERIC
- stripe_payment_intent_id: VARCHAR
- payment_net_amount: NUMERIC
- payment_currency: VARCHAR
- payment_fee_amount: NUMERIC
- payment_failure_reason: TEXT
- payment_failure_code: VARCHAR
- payment_attempts: INTEGER
- last_payment_attempt_at: TIMESTAMPTZ
- payment_confirmed_at: TIMESTAMPTZ
- payment_method: VARCHAR
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `design_request_answers_history` (Immutable Answer History)
```sql
- id: UUID (Primary Key)
- request_id: UUID (Foreign Key)
- question_id: UUID (Foreign Key)
- answer_text: TEXT
- answer_file_url: TEXT
- answer_options: JSONB
- version: INTEGER (Auto-incrementing version number)
- created_at: TIMESTAMPTZ
- created_by: VARCHAR
- is_current: BOOLEAN (Only one true per question per request)
```

### 2. Views

#### `design_requests_current_state`
A view that combines design requests with their latest state and product information for easy querying.

### 3. Functions

#### `add_design_request_event()`
Creates an event and automatically updates the current state based on the event type.

**Parameters:**
- `p_request_id`: UUID
- `p_event_type`: VARCHAR
- `p_event_data`: JSONB (optional)
- `p_created_by`: VARCHAR (optional)
- `p_metadata`: JSONB (optional)

**Returns:** UUID (event ID)

#### `add_design_request_answer_history()`
Creates a new version of an answer while preserving history.

**Parameters:**
- `p_request_id`: UUID
- `p_question_id`: UUID
- `p_answer_text`: TEXT (optional)
- `p_answer_file_url`: TEXT (optional)
- `p_answer_options`: JSONB (optional)
- `p_created_by`: VARCHAR (optional)

**Returns:** UUID (answer history ID)

## Event Types

### Request Lifecycle Events
1. **REQUEST_CREATED** - Initial request creation
2. **REQUEST_SUBMITTED** - Request submitted with email and answers
3. **REQUEST_CANCELLED** - Request cancelled by user or admin

### Payment Events
4. **PAYMENT_INTENT_CREATED** - Payment intent created in Stripe
5. **PAYMENT_SUCCEEDED** - Payment completed successfully
6. **PAYMENT_FAILED** - Payment failed
7. **PAYMENT_CANCELLED** - Payment cancelled

### Design Events
8. **DESIGN_STARTED** - Design work begins
9. **DESIGN_COMPLETED** - Design work completed

## Migration from Old System

### What Was Changed

1. **API Routes Updated:**
   - `/api/design-applications` - Now uses events instead of UPDATE
   - `/api/webhooks/stripe` - Now uses events instead of UPDATE
   - `/api/create-payment-intent` - Now uses events instead of UPDATE

2. **Database Operations:**
   - No more direct UPDATE operations on main tables
   - All state changes go through events
   - Answer changes create new versions instead of overwriting

3. **Data Preservation:**
   - Original tables backed up as `design_requests_backup` and `request_answers_backup`
   - All existing data migrated to new event structure

### Benefits

1. **Data Integrity:**
   - No data loss through overwrites
   - Complete audit trail
   - Immutable event log

2. **Debugging:**
   - Can trace exact sequence of events
   - Can see who made what changes when
   - Can reconstruct state at any point in time

3. **Analytics:**
   - Rich event data for analysis
   - Can track user behavior patterns
   - Can measure conversion rates at each step

4. **Compliance:**
   - Full audit trail for regulatory requirements
   - Can prove what happened when
   - Immutable records

## Usage Examples

### Creating a New Request
```typescript
// 1. Insert base record
const { data: request } = await supabase
  .from('design_requests')
  .insert({ product_id, design_code, status: 'DRAFT' })
  .select()
  .single();

// 2. Create initial event
await supabase.rpc('add_design_request_event', {
  p_request_id: request.id,
  p_event_type: 'REQUEST_CREATED',
  p_event_data: { email: null, design_code, product_id },
  p_created_by: null
});
```

### Submitting a Request
```typescript
// Create submission event
await supabase.rpc('add_design_request_event', {
  p_request_id: requestId,
  p_event_type: 'REQUEST_SUBMITTED',
  p_event_data: { email, status: 'SUBMITTED' },
  p_created_by: email
});

// Add answers to history
await supabase.rpc('add_design_request_answer_history', {
  p_request_id: requestId,
  p_question_id: questionId,
  p_answer_text: answer,
  p_created_by: email
});
```

### Payment Success
```typescript
// Create payment success event
await supabase.rpc('add_design_request_event', {
  p_request_id: applicationId,
  p_event_type: 'PAYMENT_SUCCEEDED',
  p_event_data: {
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    payment_method: paymentIntent.payment_method_types[0]
  },
  p_created_by: 'stripe_webhook'
});
```

## Querying Current State

### Get Current State
```typescript
const { data: currentState } = await supabase
  .from('design_requests_current_state')
  .select('*')
  .eq('request_id', requestId)
  .single();
```

### Get Event History
```typescript
const { data: events } = await supabase
  .from('design_request_events')
  .select('*')
  .eq('request_id', requestId)
  .order('created_at', { ascending: true });
```

### Get Current Answers
```typescript
const { data: answers } = await supabase
  .from('design_request_answers_history')
  .select('*')
  .eq('request_id', requestId)
  .eq('is_current', true);
```

## Best Practices

1. **Always use events for state changes** - Never update state tables directly
2. **Include relevant data in event_data** - Store all context needed for the event
3. **Use created_by consistently** - Track who triggered each event
4. **Query current state through views** - Use `design_requests_current_state` for current data
5. **Preserve answer history** - Always create new versions, never overwrite

## Monitoring and Maintenance

### Event Volume
Monitor the growth of the events table and consider archiving old events if needed.

### Performance
The current state view provides good performance for most queries. For analytics, consider creating materialized views.

### Backup Strategy
- Events table is critical - ensure regular backups
- Consider point-in-time recovery capabilities
- Test restore procedures regularly

## Future Enhancements

1. **Event Sourcing** - Could implement full event sourcing pattern
2. **CQRS** - Could separate read and write models
3. **Event Streaming** - Could publish events to message queues
4. **Analytics Views** - Could create specialized views for reporting
5. **Event Replay** - Could implement event replay for debugging

## Conclusion

This event-driven architecture provides a robust foundation for the design request system. It eliminates data loss risks while providing rich audit capabilities and maintaining good performance for current operations.
