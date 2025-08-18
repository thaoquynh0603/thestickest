# AI Inspiration Feature for QuestionRenderer

## Overview

The AI Inspiration feature enhances the user experience by providing AI-generated suggestions for textarea fields in the design application form. Users can click "Get AI Inspiration!" to receive creative, contextual suggestions that help them fill out their design requirements.

## How It Works

### 1. Trigger Detection
- The feature automatically detects if a question supports AI generation by checking the `is_ai_generated` field in the `request_questions` table
- Only textarea fields with `is_ai_generated = true` will show the AI inspiration button

### 2. Prompt Construction
The system builds the final prompt by replacing placeholders with actual data:

#### Product Information Replacement
For products with `slug = 'general_default_hidden'`:
- `##product_title##` → Product title
- `##product_subtitle##` → Product subtitle  
- `##description##` → Product description

#### Enhanced Product Context for General Products
For `general_default_hidden` products, the system automatically detects user's product choice from previous answers and adds:
- `##user_product_choice##` → The specific product/design the user is interested in
- `##product_context##` → Context about what the user wants to create
- `##design_context##` → Design-specific context for the AI

#### Answer Placeholder Replacement
Uses the `ai_prompt_placeholder` JSON configuration to replace placeholders with previous answers:
```json
[{
  "##design_details##": {
    "question_id": [],
    "question_text": ["What do you want to design?"]
  }
}]
```

### 3. AI Generation
- Calls Google's Gemini 2.0 Flash model via the Gemini API
- Uses the constructed prompt to generate contextual suggestions
- Supports structured output based on `ai_structured_output` schema

### 4. Response Display
- Shows the generated text with highlighted placeholders
- Auto-fills the textarea with the AI suggestion
- Displays customizable elements as tags for user reference

### 5. Logging and Tracking
- Logs all AI generation requests in the `gemini_runs` table
- Links AI-generated answers to the `design_request_answers_history.ai_generated_id` field
- Tracks metadata including product slug, question text, and prompt details

## Database Schema

### New Tables

#### `gemini_runs`
```sql
CREATE TABLE gemini_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES design_requests(id) ON DELETE CASCADE,
  question_id UUID REFERENCES request_questions(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enhanced Fields

#### `request_questions` - New AI Fields
- `is_ai_generated` (boolean): Whether this question supports AI generation
- `ai_generated_prompt` (text): The base prompt template with placeholders
- `ai_structured_output` (text): JSON schema for structured AI responses
- `ai_prompt_placeholder` (jsonb): Configuration for answer-based placeholder replacement

#### `design_request_answers_history` - New AI Fields
- `ai_generated_id` (UUID): Links to the gemini_runs table when AI was used

## Usage Examples

### Basic Product Context Prompt
For `general_default_hidden` products, you can use these placeholders in your AI prompts:

```
You are a creative design consultant. The user is interested in ##user_product_choice##.

Product details:
- Title: ##product_title##
- Subtitle: ##product_subtitle##
- Description: ##description##

##product_context##

Please provide design inspiration and suggestions for ##design_context##.
```

### Answer-Based Placeholder Example
```json
[{
  "##design_details##": {
    "question_id": [],
    "question_text": ["What do you want to design?", "Describe your design idea"]
  }
}]
```

## Implementation Notes

### Automatic Product Context Detection
The system automatically detects when a user has answered questions about their product interests and injects this context into AI prompts. This works by:

1. Identifying `general_default_hidden` products
2. Scanning previous answers for product-related keywords
3. Adding contextual placeholders to the prompt
4. Logging the enhanced context for debugging

### Placeholder Priority
1. Product information placeholders (##product_title##, etc.)
2. User product choice context (##user_product_choice##, ##product_context##, ##design_context##)
3. Answer-based placeholders from ai_prompt_placeholder configuration

### Debugging and Monitoring
- All placeholder replacements are logged with detailed context
- Metadata includes information about which placeholders were successfully replaced
- Failed placeholder replacements don't break the AI generation process
