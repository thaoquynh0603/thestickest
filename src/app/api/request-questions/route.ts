import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns request questions enriched with option_items resolved from option templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const productSlug = searchParams.get('productSlug');

    if (!productId && !productSlug) {
      return NextResponse.json({ error: 'Product ID or slug required' }, { status: 400 });
    }

    const supabase = createClient();

    // Resolve product id if only slug is provided
    let resolvedProductId: string | null = productId;
    if (!resolvedProductId && productSlug) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', productSlug)
        .single();
      if (productError || !product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      resolvedProductId = product.id;
    }

    // Fetch request questions
    const { data: questions, error: questionsError } = await supabase
      .from('request_questions')
      .select('*, is_customisable, custom_template_id')
      .eq('is_active', true)
      .eq('product_id', resolvedProductId!)
      .order('sort_order', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Preload styles only if any question uses the design_styles template
    const hasStyleTemplate = (questions || []).some((q) => !!q.option_template_id);
    let designStyles: any[] = [];
    if (hasStyleTemplate) {
      const { data: ds } = await supabase
        .from('design_styles')
        .select('*')
        .or(`product_id.eq.${resolvedProductId},product_id.is.null`)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      designStyles = ds || [];
    }

  // Build option items resolved from templates
  const questionOptionItems: Record<string, Array<{ id?: string; name: string; description?: string | null; image_url?: string | null }>> = {};
  // Track the source_type for each question's option template so frontend can detect sources (e.g. design_styles)
  const questionOptionSourceType: Record<string, string | null> = {};

    for (const q of questions || []) {
      if (!q.option_template_id) continue;
      const { data: templates } = await supabase
        .from('option_templates')
        .select('*')
        .eq('id', q.option_template_id)
        .limit(1);
      const tmpl = templates?.[0] as any;
      if (!tmpl) continue;
      // remember the template source type for this question
      questionOptionSourceType[q.id] = tmpl.source_type || null;
      if (tmpl.source_type === 'design_styles') {
        questionOptionItems[q.id] = (designStyles || []).map((s: any) => ({ id: s.id, name: s.name, description: s.description, image_url: s.image_url }));
      } else if (tmpl.source_type === 'question_demo_items') {
        const { data: demoItems } = await supabase
          .from('question_demo_items')
          .select('*')
          .eq('question_slug', q.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        questionOptionItems[q.id] = (demoItems || []).map((d: any) => ({ id: d.id, name: d.name, description: d.description, image_url: d.image_url }));
      } else if (tmpl.source_type === 'products') {
        // Support product-based option templates. Allow optional filtering via template config.
        try {
          const cfg = (tmpl.source_config || {}) as any;
          let productsQuery: any = supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .neq('slug', 'general_default_hidden')
            .order('display_order', { ascending: true });
          // If template config specifies a template_id, restrict to that template
          if (cfg && cfg.template_id) {
            productsQuery = productsQuery.eq('template_id', cfg.template_id);
          }
          const { data: products } = await productsQuery;
          questionOptionItems[q.id] = (products || []).map((p: any) => ({ id: p.id, name: p.title || p.name || p.slug, description: p.subtitle || p.description || null, image_url: p.product_image_url || null }));
        } catch (e) {
          // ignore and leave option items undefined
        }
      }
    }

    const transformed = (questions || []).map((q) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      subtext: q.subtext,
      option_items: questionOptionItems[q.id],
      option_source_type: questionOptionSourceType[q.id] || null,
      is_required: q.is_required || false,
      is_customisable: q.is_customisable || false,
      custom_template_id: q.custom_template_id || null,
      sort_order: q.sort_order || 0,
      // AI-related fields
      is_ai_generated: q.is_ai_generated || false,
      ai_generated_prompt: q.ai_generated_prompt || null,
      ai_structured_output: q.ai_structured_output || null,
      ai_prompt_placeholder: q.ai_prompt_placeholder || null,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error in application questions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

