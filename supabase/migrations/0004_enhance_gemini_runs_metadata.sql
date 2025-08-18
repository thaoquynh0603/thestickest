-- Migration: Enhance gemini_runs table with comprehensive metadata support
-- This migration adds better support for storing enhanced Gemini API metadata
-- including token usage, performance metrics, safety analysis, and response quality

-- Add comments to the gemini_runs table for better documentation
COMMENT ON TABLE gemini_runs IS 'Stores comprehensive metadata for all Gemini AI API calls including token usage, performance metrics, and response analysis';

-- Add comments to existing columns
COMMENT ON COLUMN gemini_runs.metadata IS 'JSONB field containing comprehensive metadata including input_metadata, output_metadata, and gemini_run_summary';
COMMENT ON COLUMN gemini_runs.prompt IS 'The final prompt sent to Gemini API after all placeholder replacements';
COMMENT ON COLUMN gemini_runs.response IS 'The parsed response from Gemini API with structured content';

-- Create a GIN index on the metadata JSONB field for better query performance
-- This allows efficient querying of metadata fields like token usage, safety issues, etc.
CREATE INDEX IF NOT EXISTS idx_gemini_runs_metadata_gin ON gemini_runs USING GIN (metadata);

-- Create specific indexes for commonly queried metadata paths
CREATE INDEX IF NOT EXISTS idx_gemini_runs_total_tokens ON gemini_runs USING BTREE ((metadata->'gemini_run_summary'->>'total_tokens'));
CREATE INDEX IF NOT EXISTS idx_gemini_runs_api_latency ON gemini_runs USING BTREE ((metadata->'gemini_run_summary'->>'api_latency_ms'));
CREATE INDEX IF NOT EXISTS idx_gemini_runs_safety_issues ON gemini_runs USING BTREE ((metadata->'gemini_run_summary'->>'has_safety_issues'));
CREATE INDEX IF NOT EXISTS idx_gemini_runs_finish_reason ON gemini_runs USING BTREE ((metadata->'gemini_run_summary'->>'finish_reason'));
CREATE INDEX IF NOT EXISTS idx_gemini_runs_quality_score ON gemini_runs USING BTREE ((metadata->'gemini_run_summary'->>'response_quality_score'));

-- Create indexes for input metadata paths
CREATE INDEX IF NOT EXISTS idx_gemini_runs_product_slug ON gemini_runs USING BTREE ((metadata->>'product_slug'));
CREATE INDEX IF NOT EXISTS idx_gemini_runs_question_text ON gemini_runs USING BTREE ((metadata->>'question_text'));
CREATE INDEX IF NOT EXISTS idx_gemini_runs_model ON gemini_runs USING BTREE ((metadata->'input_metadata'->>'model'));

-- Create indexes for performance metrics
CREATE INDEX IF NOT EXISTS idx_gemini_runs_prompt_length ON gemini_runs USING BTREE ((metadata->'input_metadata'->>'prompt_length'));
CREATE INDEX IF NOT EXISTS idx_gemini_runs_timestamp ON gemini_runs USING BTREE ((metadata->'input_metadata'->>'timestamp'));

-- Create a composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_gemini_runs_request_question ON gemini_runs (request_id, question_id);

-- Add a function to help calculate quality scores for existing records
CREATE OR REPLACE FUNCTION calculate_gemini_quality_score(metadata jsonb)
RETURNS integer AS $$
DECLARE
    score integer := 100;
    has_safety_issues boolean;
    finish_reason text;
    parsing_success boolean;
    has_structured_content boolean;
BEGIN
    -- Extract values from metadata
    has_safety_issues := COALESCE((metadata->'output_metadata'->'gemini_metadata'->'safety_analysis'->>'has_safety_issues')::boolean, false);
    finish_reason := metadata->'output_metadata'->'gemini_metadata'->>'finishReason';
    parsing_success := COALESCE((metadata->'output_metadata'->'response_analysis'->>'parsing_success')::boolean, false);
    has_structured_content := COALESCE((metadata->'output_metadata'->'response_analysis'->'content_quality'->>'has_structured_content')::boolean, false);
    
    -- Calculate score based on quality indicators
    IF has_safety_issues THEN
        score := score - 20;
    END IF;
    
    IF finish_reason != 'STOP' THEN
        score := score - 15;
    END IF;
    
    IF NOT parsing_success THEN
        score := score - 25;
    END IF;
    
    IF has_structured_content THEN
        score := score + 10;
    END IF;
    
    RETURN GREATEST(0, LEAST(100, score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a comment to the function
COMMENT ON FUNCTION calculate_gemini_quality_score(jsonb) IS 'Calculates a quality score (0-100) for Gemini API responses based on safety, completion, parsing success, and content structure';

-- Create a view for easy querying of Gemini run analytics
CREATE OR REPLACE VIEW gemini_runs_analytics AS
SELECT 
    id,
    request_id,
    question_id,
    created_at,
    -- Basic metadata
    metadata->>'product_slug' as product_slug,
    metadata->>'question_text' as question_text,
    metadata->'input_metadata'->>'model' as model,
    metadata->'input_metadata'->>'prompt_length' as prompt_length,
    metadata->'input_metadata'->>'timestamp' as request_timestamp,
    
    -- Performance metrics
    (metadata->'output_metadata'->'performance_metrics'->>'api_latency_ms')::integer as api_latency_ms,
    (metadata->'output_metadata'->'performance_metrics'->>'total_processing_time_ms')::integer as total_processing_time_ms,
    
    -- Token usage
    (metadata->'output_metadata'->'gemini_metadata'->'token_usage'->>'total_tokens')::integer as total_tokens,
    (metadata->'output_metadata'->'gemini_metadata'->'token_usage'->>'billable_tokens')::integer as billable_tokens,
    
    -- Quality indicators
    (metadata->'output_metadata'->'gemini_metadata'->'safety_analysis'->>'has_safety_issues')::boolean as has_safety_issues,
    metadata->'output_metadata'->'gemini_metadata'->>'finishReason' as finish_reason,
    (metadata->'output_metadata'->'response_analysis'->>'parsing_success')::boolean as parsing_success,
    
    -- Calculated quality score
    calculate_gemini_quality_score(metadata) as quality_score
    
FROM gemini_runs
WHERE metadata IS NOT NULL;

-- Add comment to the view
COMMENT ON VIEW gemini_runs_analytics IS 'Analytics view for Gemini runs with extracted metadata fields for easy querying and analysis';

-- Grant appropriate permissions
GRANT SELECT ON gemini_runs_analytics TO authenticated;
GRANT SELECT ON gemini_runs_analytics TO anon;

-- Create a function to get Gemini run statistics
CREATE OR REPLACE FUNCTION get_gemini_run_stats(
    p_start_date timestamp DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
    p_end_date timestamp DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE(
    total_runs bigint,
    total_tokens bigint,
    avg_latency_ms numeric,
    avg_quality_score numeric,
    safety_issues_count bigint,
    parsing_failures bigint,
    incomplete_responses bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_runs,
        COALESCE(SUM((metadata->'output_metadata'->'gemini_metadata'->'token_usage'->>'total_tokens')::integer), 0) as total_tokens,
        ROUND(AVG((metadata->'output_metadata'->'performance_metrics'->>'api_latency_ms')::integer), 2) as avg_latency_ms,
        ROUND(AVG(calculate_gemini_quality_score(metadata)), 2) as avg_quality_score,
        COUNT(*) FILTER (WHERE (metadata->'output_metadata'->'gemini_metadata'->'safety_analysis'->>'has_safety_issues')::boolean) as safety_issues_count,
        COUNT(*) FILTER (WHERE NOT (metadata->'output_metadata'->'response_analysis'->>'parsing_success')::boolean) as parsing_failures,
        COUNT(*) FILTER (WHERE (metadata->'output_metadata'->'gemini_metadata'->>'finishReason') != 'STOP') as incomplete_responses
    FROM gemini_runs
    WHERE created_at BETWEEN p_start_date AND p_end_date
    AND metadata IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment to the function
COMMENT ON FUNCTION get_gemini_run_stats(timestamp, timestamp) IS 'Returns comprehensive statistics for Gemini runs within a date range including token usage, performance, and quality metrics';
