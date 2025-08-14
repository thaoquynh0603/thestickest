import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const templateIdNum = parseInt(templateId, 10);
    if (isNaN(templateIdNum)) {
      return NextResponse.json(
        { error: 'Invalid templateId format' },
        { status: 400 }
      );
    }
    // First, get the custom template
    const { data: template, error: templateError } = await supabase
      .from('custom_template')
      .select('*')
      .eq('id', templateIdNum)
      .single();

    if (templateError || !template) {
      console.error('Error fetching custom template:', templateError);
      return NextResponse.json(
        { error: 'Custom template not found' },
        { status: 404 }
      );
    }

    // Then get all questions for this template
    const { data: questions, error: questionsError } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('custom_template_id', templateIdNum)
      .order('created_at', { ascending: true });

    if (questionsError) {
      console.error('Error fetching custom questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch custom questions' },
        { status: 500 }
      );
    }

    // Transform questions to match ApplicationQuestion type
    const transformedQuestions = (questions || []).map(question => ({
      id: question.id,
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || [],
      is_required: false,
      // custom_questions table doesn't have sort_order/is_customisable columns
      // Defaulting for UI compatibility
      sort_order: 0,
      is_customisable: false,
      custom_template_id: null 
    }));

    return NextResponse.json(transformedQuestions);
  } catch (error) {
    console.error('Error in custom questions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
