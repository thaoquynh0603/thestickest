# TheStickest MVP Database - Entity Relationship Diagram (ERD)

## Database Overview
**Project:** thestickest-mvp  
**Supabase URL:** https://hyrjcmrvrxtepvlpmgxs.supabase.co  
**Schema:** public (main application tables)

---

## Core Entities & Relationships

### 1. PRODUCTS (Core Product Catalog)
```
┌─────────────────────────────────────────────────────────────┐
│                        PRODUCTS                             │
├─────────────────────────────────────────────────────────────┤
│ PK: id (uuid)                                               │
│     slug (varchar) UNIQUE                                   │
│     title (varchar)                                         │
│     subtitle (text)                                         │
│     product_image_url (text)                                │
│     description (text)                                      │
│     examples (text[])                                       │
│     is_active (boolean)                                     │
│     price (numeric) DEFAULT 2.00                            │
│     template_id (uuid) FK → TEMPLATES.id                    │
│     created_at (timestamptz)                                │
│     updated_at (timestamptz)                                │
└─────────────────────────────────────────────────────────────┘
```

### 2. TEMPLATES (Design Templates)
```
┌─────────────────────────────────────────────────────────────┐
│                        TEMPLATES                            │
├─────────────────────────────────────────────────────────────┤
│ PK: id (uuid)                                               │
│     name (varchar)                                          │
│     font_family (varchar)                                   │
│     palette (jsonb)                                         │
│     created_at (timestamptz)                                │
│     updated_at (timestamptz)                                │
└─────────────────────────────────────────────────────────────┘
```

### 3. DESIGN_REQUESTS (Main Application Entity)
```
┌─────────────────────────────────────────────────────────────┐
│                    DESIGN_REQUESTS                          │
├─────────────────────────────────────────────────────────────┤
│ PK: id (uuid)                                               │
│     product_id (uuid) FK → PRODUCTS.id                      │
│     email (varchar)                                         │
│     design_code (varchar) UNIQUE                            │
│     status (varchar) DEFAULT 'DRAFT'                        │
│     created_at (timestamptz)                                │
│     updated_at (timestamptz)                                │
└─────────────────────────────────────────────────────────────┘
```

### 4. REQUEST_QUESTIONS (Dynamic Form Questions)
```
┌─────────────────────────────────────────────────────────────┐
│                   REQUEST_QUESTIONS                         │
├─────────────────────────────────────────────────────────────┤
│ PK: id (uuid)                                               │
│     product_id (uuid) FK → PRODUCTS.id                      │
│     question_text (text)                                    │
│     question_type (varchar)                                 │
│     options (jsonb)                                         │
│     is_required (boolean) DEFAULT true                      │
│     sort_order (integer) DEFAULT 0                          │
│     is_active (boolean) DEFAULT true                        │
│     created_at (timestamptz)                                │
│     updated_at (timestamptz)                                │
└─────────────────────────────────────────────────────────────┘
```

### 5. REQUEST_ANSWERS (User Responses)
```
┌─────────────────────────────────────────────────────────────┐
│                   REQUEST_ANSWERS                           │
├─────────────────────────────────────────────────────────────┤
│ PK: id (uuid)                                               │
│     application_id (uuid) FK → DESIGN_REQUESTS.id           │
│     question_id (uuid) FK → REQUEST_QUESTIONS.id            │
│     answer_text (text)                                      │
│     answer_file_url (text)                                  │
│     answer_options (jsonb)                                  │
│     created_at (timestamptz)                                │
│     updated_at (timestamptz)                                │
└─────────────────────────────────────────────────────────────┘
```

### 6. PAYMENT_EVENTS (Stripe Payment Tracking)
```
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT_EVENTS                           │
├─────────────────────────────────────────────────────────────┤
│ PK: id (uuid)                                               │
│     application_id (uuid) FK → DESIGN_REQUESTS.id           │
│     stripe_payment_intent_id (varchar)                      │
│     event_type (varchar)                                    │
│     event_data (jsonb)                                      │
│     amount (numeric)                                        │
│     currency (varchar) DEFAULT 'USD'                        │
│     status (varchar)                                        │
│     error_message (text)                                    │
│     created_at (timestamptz)                                │
│     updated_at (timestamptz)                                │
└─────────────────────────────────────────────────────────────┘
```

### 7. DESIGN_REQUEST_STATES (Current State View)
```
┌─────────────────────────────────────────────────────────────┐
│                DESIGN_REQUEST_STATES                        │
├─────────────────────────────────────────────────────────────┤
│ PK: id (uuid)                                               │
│     request_id (uuid) FK → DESIGN_REQUESTS.id UNIQUE        │
│     current_status (varchar) DEFAULT 'DRAFT'                │
│     current_payment_status (varchar) DEFAULT 'PENDING'      │
│     email (varchar)                                         │
│     design_code (varchar)                                   │
│     product_id (uuid) FK → PRODUCTS.id                      │
│     total_amount (numeric) DEFAULT 2.00                     │
│     stripe_payment_intent_id (varchar)                      │
│     payment_net_amount (numeric)                            │
│     payment_currency (varchar) DEFAULT 'USD'                │
│     payment_fee_amount (numeric)                            │
│     payment_failure_reason (text)                           │
│     payment_failure_code (varchar)                          │
│     payment_attempts (integer) DEFAULT 0                    │
│     last_payment_attempt_at (timestamptz)                   │
│     payment_confirmed_at (timestamptz)                      │
│     payment_method (varchar)                                │
│     created_at (timestamptz)                                │
│     updated_at (timestamptz)                                │
└─────────────────────────────────────────────────────────────┘
```

### 8. DESIGN_REQUEST_EVENTS (Event Sourcing)
```
┌─────────────────────────────────────────────────────────────┐
│                DESIGN_REQUEST_EVENTS                        │
├─────────────────────────────────────────────────────────────┤
│ PK: id (uuid)                                               │
│     request_id (uuid) FK → DESIGN_REQUESTS.id               │
│     event_type (varchar)                                    │
│     event_data (jsonb) DEFAULT '{}'                         │
│     created_at (timestamptz)                                │
│     created_by (varchar)                                    │
│     metadata (jsonb) DEFAULT '{}'                           │
└─────────────────────────────────────────────────────────────┘
```

### 9. DESIGN_REQUEST_ANSWERS_HISTORY (Audit Trail)
```
┌─────────────────────────────────────────────────────────────┐
│           DESIGN_REQUEST_ANSWERS_HISTORY                    │
├─────────────────────────────────────────────────────────────┤
│ PK: id (uuid)                                               │
│     request_id (uuid) FK → DESIGN_REQUESTS.id               │
│     question_id (uuid) FK → REQUEST_QUESTIONS.id            │
│     answer_text (text)                                      │
│     answer_file_url (text)                                  │
│     answer_options (jsonb)                                  │
│     version (integer) DEFAULT 1                             │
│     created_at (timestamptz)                                │
│     created_by (varchar)                                    │
│     is_current (boolean) DEFAULT true                       │
└─────────────────────────────────────────────────────────────┘
```

### 10. CAROUSEL_ITEMS (Product Showcase)
```
┌─────────────────────────────────────────────────────────────┐
│                    CAROUSEL_ITEMS                           │
├─────────────────────────────────────────────────────────────┤
│ PK: id (uuid)                                               │
│     product_id (uuid) FK → PRODUCTS.id                      │
│     image_url (text)                                        │
│     message_h1 (varchar)                                    │
│     message_text (text)                                     │
│     position (varchar) DEFAULT 'center'                     │
│     sort_order (integer) DEFAULT 0                          │
│     is_active (boolean) DEFAULT true                        │
│     created_at (timestamptz)                                │
│     updated_at (timestamptz)                                │
└─────────────────────────────────────────────────────────────┘
```

### 11. DESIGN_STYLES (Available Styles)
```
┌─────────────────────────────────────────────────────────────┐
│                    DESIGN_STYLES                            │
├─────────────────────────────────────────────────────────────┤
│ PK: id (uuid)                                               │
│     name (varchar)                                          │
│     description (text)                                      │
│     image_url (text)                                        │
│     is_active (boolean) DEFAULT true                        │
│     sort_order (integer) DEFAULT 0                          │
│     created_at (timestamptz)                                │
│     updated_at (timestamptz)                                │
└─────────────────────────────────────────────────────────────┘
```

### 12. PAYMENT_ANALYTICS (Admin Dashboard)
```
┌─────────────────────────────────────────────────────────────┐
│                  PAYMENT_ANALYTICS                          │
├─────────────────────────────────────────────────────────────┤
│ PK: id (uuid)                                               │
│     date (date) UNIQUE                                      │
│     total_applications (integer) DEFAULT 0                  │
│     successful_payments (integer) DEFAULT 0                 │
│     failed_payments (integer) DEFAULT 0                     │
│     total_revenue (numeric) DEFAULT 0                       │
│     total_fees (numeric) DEFAULT 0                          │
│     net_revenue (numeric) DEFAULT 0                         │
│     average_payment_time_seconds (integer)                  │
│     created_at (timestamptz)                                │
│     updated_at (timestamptz)                                │
└─────────────────────────────────────────────────────────────┘
```

### 13. FAQ_SUBMISSIONS (Customer Support)
```
┌─────────────────────────────────────────────────────────────┐
│                   FAQ_SUBMISSIONS                           │
├─────────────────────────────────────────────────────────────┤
│ PK: id (uuid)                                               │
│     name (varchar)                                          │
│     email (varchar)                                         │
│     subject (varchar)                                       │
│     message (text)                                          │
│     status (varchar) DEFAULT 'PENDING'                      │
│     created_at (timestamptz)                                │
│     updated_at (timestamptz)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Entity Relationships

### Primary Relationships
```
PRODUCTS (1) ──── (N) DESIGN_REQUESTS
PRODUCTS (1) ──── (N) REQUEST_QUESTIONS  
PRODUCTS (1) ──── (N) CAROUSEL_ITEMS
TEMPLATES (1) ──── (N) PRODUCTS

DESIGN_REQUESTS (1) ──── (N) REQUEST_ANSWERS
DESIGN_REQUESTS (1) ──── (N) PAYMENT_EVENTS
DESIGN_REQUESTS (1) ──── (1) DESIGN_REQUEST_STATES
DESIGN_REQUESTS (1) ──── (N) DESIGN_REQUEST_EVENTS
DESIGN_REQUESTS (1) ──── (N) DESIGN_REQUEST_ANSWERS_HISTORY

REQUEST_QUESTIONS (1) ──── (N) REQUEST_ANSWERS
REQUEST_QUESTIONS (1) ──── (N) DESIGN_REQUEST_ANSWERS_HISTORY
```

### Event-Driven Architecture
- **DESIGN_REQUEST_EVENTS**: Immutable event log for state changes
- **DESIGN_REQUEST_STATES**: Current state view (automatically updated by events)
- **DESIGN_REQUEST_ANSWERS_HISTORY**: Immutable history of answer changes

### Payment Flow
- **PAYMENT_EVENTS**: Tracks all Stripe webhook events
- **DESIGN_REQUEST_STATES**: Contains current payment status and details
- **PAYMENT_ANALYTICS**: Daily aggregated metrics for admin dashboard

---

## Key Design Patterns

### 1. Event Sourcing
- **DESIGN_REQUEST_EVENTS**: Immutable event log
- **DESIGN_REQUEST_STATES**: Materialized view of current state
- Enables audit trail and state reconstruction

### 2. CQRS (Command Query Responsibility Segregation)
- **DESIGN_REQUESTS**: Write model (commands)
- **DESIGN_REQUEST_STATES**: Read model (queries)
- Optimized for different access patterns

### 3. Audit Trail
- **DESIGN_REQUEST_ANSWERS_HISTORY**: Versioned answer history
- **DESIGN_REQUEST_EVENTS**: Complete event log
- **PAYMENT_EVENTS**: Payment audit trail

### 4. Dynamic Forms
- **REQUEST_QUESTIONS**: Configurable questions per product
- **REQUEST_ANSWERS**: Flexible answer storage (text, files, options)

---

## Data Governance Features

### Row Level Security (RLS)
- All tables have RLS enabled
- **faq_submissions**: RLS forced (admin-only access)
- Proper access control for multi-tenant data

### Data Integrity
- Foreign key constraints enforce referential integrity
- Check constraints validate status enums
- Unique constraints prevent duplicates

### Audit Fields
- **created_at**, **updated_at**: Standard audit timestamps
- **created_by**: User tracking for events
- **version**: Version control for answer history

---

## Backup Tables
- **design_requests_backup**: Backup of design requests
- **request_answers_backup**: Backup of request answers

---

## Supabase Auth & Storage
- **auth schema**: User authentication and sessions
- **storage schema**: File storage and buckets
- Integrated with main application tables

---

*This ERD represents the current state of the thestickest-mvp database as of the latest schema inspection.*
