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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);
```

### Updated Tables

#### `request_questions` - New AI Fields
- `is_ai_generated` (boolean): Whether the question supports AI generation
- `ai_generated_prompt` (text): The base prompt template
- `ai_structured_output` (text): Expected response structure
- `ai_prompt_placeholder` (jsonb): Placeholder configuration for answer replacement

#### `design_request_answers_history` - New Field
- `ai_generated_id` (uuid): Reference to the gemini_run that generated this answer

## API Endpoints

### POST `/api/ai-inspiration`
Generates AI inspiration for a specific question.

**Request Body:**
```json
{
  "questionId": "uuid",
  "requestId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "text": "AI generated suggestion with {{placeholder}}",
    "placeholders": ["placeholder"]
  },
  "geminiRunId": "uuid"
}
```

## Components

### AIInspiration Component
Located at `src/components/design-application/AIInspiration.tsx`

**Features:**
- "Get AI Inspiration!" button with loading states
- Error handling and display
- Generated content display with placeholder highlighting
- Automatic textarea population

**Props:**
- `questionId`: The question ID to generate inspiration for
- `requestId`: The design request ID
- `onInspirationGenerated`: Callback when AI content is generated
- `isGenerating`: Whether the parent is currently generating content

## Integration

### QuestionRenderer Integration
The AI Inspiration component is automatically integrated into textarea fields in the QuestionRenderer:

```tsx
case 'textarea': {
  const textareaElement = (
    <textarea 
      value={typeof value === 'string' ? value : ''} 
      onChange={(e) => updateApplicationData(question.id, e.target.value)} 
      className="form-textarea" 
      placeholder="Enter your answer..." 
      rows={4} 
      required={question.is_required} 
      onKeyPress={onTextareaKeyPress} 
    />
  );

  // Show AI inspiration for textarea fields that support it
  if (question.is_ai_generated) {
    return (
      <div>
        {textareaElement}
        <AIInspiration
          questionId={question.id}
          requestId={applicationId}
          onInspirationGenerated={handleAIInspiration}
        />
      </div>
    );
  }

  return textareaElement;
}
```

## Environment Variables

Required environment variables:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Security

- Row Level Security (RLS) enabled on the `gemini_runs` table
- Users can only view and create gemini runs for their own design requests
- API endpoint validates request ownership before processing

## Usage Example

1. **User fills out initial questions** (e.g., "What product are you interested in?")
2. **User reaches AI-enabled textarea** (e.g., "What do you want to design?")
3. **User clicks "Get AI Inspiration!"**
4. **System generates contextual suggestion** based on previous answers and product details
5. **Suggestion auto-fills the textarea** with highlighted placeholders
6. **User can customize** the generated text as needed

## Error Handling

- Graceful fallback if Gemini API is unavailable
- User-friendly error messages for common issues
- Logging of all errors for debugging
- Non-blocking operation (AI failure doesn't prevent form submission)

## Future Enhancements

- Support for multiple AI models
- Caching of common AI responses
- A/B testing of different prompt strategies
- Analytics on AI usage and effectiveness
- User feedback collection on AI suggestions
