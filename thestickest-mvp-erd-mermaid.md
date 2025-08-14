# TheStickest MVP Database - Mermaid ERD

## Entity Relationship Diagram

```mermaid
erDiagram
    %% Core Product Entities
    PRODUCTS {
        uuid id PK
        varchar slug
        varchar title
        text subtitle
        text product_image_url
        text description
        text[] examples
        boolean is_active
        numeric price
        uuid template_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    TEMPLATES {
        uuid id PK
        varchar name
        varchar font_family
        jsonb palette
        timestamptz created_at
        timestamptz updated_at
    }

    %% Design Request Flow
    DESIGN_REQUESTS {
        uuid id PK
        uuid product_id FK
        varchar email
        varchar design_code
        varchar status
        uuid selected_style_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    REQUEST_QUESTIONS {
        uuid id PK
        uuid product_id FK
        text question_text
        varchar question_type
        jsonb options
        boolean is_required
        integer sort_order
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    REQUEST_ANSWERS {
        uuid id PK
        uuid application_id FK
        uuid question_id FK
        text answer_text
        text answer_file_url
        jsonb answer_options
        timestamptz created_at
        timestamptz updated_at
    }

    %% Event Sourcing & State Management
    DESIGN_REQUEST_STATES {
        uuid id PK
        uuid request_id FK
        varchar current_status
        varchar current_payment_status
        varchar email
        varchar design_code
        uuid product_id FK
        numeric total_amount
        varchar stripe_payment_intent_id
        numeric payment_net_amount
        varchar payment_currency
        numeric payment_fee_amount
        text payment_failure_reason
        varchar payment_failure_code
        integer payment_attempts
        timestamptz last_payment_attempt_at
        timestamptz payment_confirmed_at
        varchar payment_method
        timestamptz created_at
        timestamptz updated_at
    }

    DESIGN_REQUEST_EVENTS {
        uuid id PK
        uuid request_id FK
        varchar event_type
        jsonb event_data
        timestamptz created_at
        varchar created_by
        jsonb metadata
    }

    DESIGN_REQUEST_ANSWERS_HISTORY {
        uuid id PK
        uuid request_id FK
        uuid question_id FK
        text answer_text
        text answer_file_url
        jsonb answer_options
        integer version
        timestamptz created_at
        varchar created_by
        boolean is_current
    }

    %% Payment & Financial
    PAYMENT_EVENTS {
        uuid id PK
        uuid application_id FK
        varchar stripe_payment_intent_id
        varchar event_type
        jsonb event_data
        numeric amount
        varchar currency
        varchar status
        text error_message
        timestamptz created_at
        timestamptz updated_at
    }

    PAYMENT_ANALYTICS {
        uuid id PK
        date date
        integer total_applications
        integer successful_payments
        integer failed_payments
        numeric total_revenue
        numeric total_fees
        numeric net_revenue
        integer average_payment_time_seconds
        timestamptz created_at
        timestamptz updated_at
    }

    %% Content & UI
    CAROUSEL_ITEMS {
        uuid id PK
        uuid product_id FK
        text image_url
        varchar message_h1
        text message_text
        varchar position
        integer sort_order
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    DESIGN_STYLES {
        uuid id PK
        varchar name
        text description
        text image_url
        boolean is_active
        integer sort_order
        uuid product_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    %% Customer Support
    FAQ_SUBMISSIONS {
        uuid id PK
        varchar name
        varchar email
        varchar subject
        text message
        varchar status
        timestamptz created_at
        timestamptz updated_at
    }

    %% Relationships
    TEMPLATES ||--o{ PRODUCTS : "has"
    PRODUCTS ||--o{ DESIGN_REQUESTS : "receives"
    PRODUCTS ||--o{ REQUEST_QUESTIONS : "has"
    PRODUCTS ||--o{ CAROUSEL_ITEMS : "showcases"
    PRODUCTS ||--o{ DESIGN_STYLES : "offers"

    DESIGN_REQUESTS ||--o{ REQUEST_ANSWERS : "contains"
    DESIGN_REQUESTS ||--o{ PAYMENT_EVENTS : "generates"
    DESIGN_REQUESTS ||--|| DESIGN_REQUEST_STATES : "current_state"
    DESIGN_REQUESTS ||--o{ DESIGN_REQUEST_EVENTS : "produces"
    DESIGN_REQUESTS ||--o{ DESIGN_REQUEST_ANSWERS_HISTORY : "tracks"
    DESIGN_REQUESTS ||--o| DESIGN_STYLES : "selects"

    REQUEST_QUESTIONS ||--o{ REQUEST_ANSWERS : "answered_by"
    REQUEST_QUESTIONS ||--o{ DESIGN_REQUEST_ANSWERS_HISTORY : "versioned_in"
```

## Database Schema Overview

### Core Business Flow
1. **TEMPLATES** define design patterns for **PRODUCTS**
2. **PRODUCTS** have dynamic **REQUEST_QUESTIONS** for customization
3. **DESIGN_REQUESTS** capture customer orders with **REQUEST_ANSWERS**
4. **PAYMENT_EVENTS** track Stripe transactions
5. **DESIGN_REQUEST_STATES** provide current status views
6. **DESIGN_REQUEST_EVENTS** maintain immutable audit trail

### Key Design Patterns
- **Event Sourcing**: DESIGN_REQUEST_EVENTS + DESIGN_REQUEST_STATES
- **CQRS**: Separate read/write models for performance
- **Audit Trail**: Complete history tracking with versioning
- **Dynamic Forms**: Configurable questions per product

### Data Governance
- **Row Level Security (RLS)**: Enabled on all tables
- **Foreign Key Constraints**: Enforce referential integrity
- **Audit Fields**: Standard timestamps and user tracking
- **Unique Constraints**: Prevent duplicate design codes and dates

---

*This Mermaid ERD visualizes the complete thestickest-mvp database schema with all entities, attributes, and relationships.*
