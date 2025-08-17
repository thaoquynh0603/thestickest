import { notFound } from 'next/navigation';
import DesignApplication from '@/components/DesignApplication';
import { createClient } from '@/lib/supabase/server';

interface DesignPageProps {
  params: {
    category: string;
  };
  searchParams?: {
    start?: string;
  };
}

interface ProductWithStyles {
  product_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  product_image_url: string | null;
  description: string | null;
  examples: string[] | null;
  is_active: boolean;
  price: number;
  template_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  design_styles: any[];
}

export default async function DesignPage({ params, searchParams }: DesignPageProps) {
  const supabase = createClient();
  
  // Step 1: Get product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.category)
    .eq('is_active', true)
    .single();

  if (productError || !product) {
    console.error('Error fetching product:', productError);
    notFound();
  }

  // Get questions for this product, including option template id and custom fields
  const { data: questions, error: questionsError } = await supabase
    .from('request_questions')
    .select('*')
    .eq('product_id', product.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  console.log('questions', questions);

  // Make sure custom fields are included
  const questionsWithCustomFields = questions?.map(q => ({
    ...q,
    is_customisable: q.is_customisable || false,
    custom_template_id: q.custom_template_id || null
  }));

  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    throw new Error('Failed to fetch questions');
  }

  // Resolve option templates for questions server-side to keep UI simple
  // We only need design styles separately if a style question exists.
  const styleQuestion = (questionsWithCustomFields || []).find(q =>
    typeof q.question_text === 'string' && q.question_text.toLowerCase().includes('style')
  );

  let designStyles: any[] = [];
  if (styleQuestion) {
    const { data: ds, error: stylesError } = await supabase
      .from('design_styles')
      .select('*')
      .or(`product_id.eq.${product.id},product_id.is.null`)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (stylesError) {
      console.error('Error fetching design styles:', stylesError);
      throw new Error('Failed to fetch design styles');
    }
    designStyles = ds || [];
  }

  // Build option items per question according to template
  const questionOptionItems: Record<string, Array<{ id?: string; name: string; description?: string | null; image_url?: string | null }>> = {};
  for (const q of questionsWithCustomFields || []) {
    if (!q.option_template_id) continue;
    // Get template to know the source
    const { data: templates, error: tmplErr } = await supabase
      .from('option_templates')
      .select('*')
      .eq('id', q.option_template_id)
      .limit(1);
    if (tmplErr || !templates || templates.length === 0) continue;
    const tmpl = templates[0] as any;
    if (tmpl.source_type === 'design_styles') {
      // Map design styles to option items
      const items = (designStyles || []).map((s: any) => ({ id: s.id, name: s.name, description: s.description, image_url: s.image_url }));
      questionOptionItems[q.id] = items;
    } else if (tmpl.source_type === 'question_demo_items') {
      // Derive a stable slug for legacy demo items. Prefer template config, then heuristic on text, else fall back to id.
      const cfg = (tmpl.source_config || {}) as any;
      const heuristic = (q.question_text || '').toLowerCase().includes('shape') ? 'shape'
        : (q.question_text || '').toLowerCase().includes('style') ? 'style'
        : undefined;
      const demoSlug = cfg.slug || heuristic || q.id;
      const { data: demoItems, error: demoErr } = await supabase
        .from('question_demo_items')
        .select('*')
        .eq('question_slug', demoSlug)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (!demoErr && demoItems) {
        questionOptionItems[q.id] = demoItems.map((d: any) => ({ id: d.id, name: d.name, description: d.description, image_url: d.image_url }));
      }
    } else if (tmpl.source_type === 'products') {
      try {
        const cfg = (tmpl.source_config || {}) as any;
        let productsQuery: any = supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .neq('slug', 'general_default_hidden')
          .order('display_order', { ascending: true });
        if (cfg && cfg.template_id) {
          productsQuery = productsQuery.eq('template_id', cfg.template_id);
        }
        const { data: products } = await productsQuery;
        if (products) {
          questionOptionItems[q.id] = (products || []).map((p: any) => ({ id: p.id, name: p.title || p.name || p.slug, description: p.subtitle || p.description || null, image_url: p.product_image_url || null }));
        }
      } catch (e) {
        // ignore
      }
    }
  }

  // Generate design code
  const { data: designCodeResult, error: codeError } = await supabase
    .rpc('generate_design_code');

  if (codeError) {
    console.error('Error generating design code:', codeError);
    throw new Error('Failed to generate design code');
  }

  const designCode = designCodeResult;
  
  // Ensure product has a price, default to 2.00 if not set
  const productWithPrice = {
    ...product,
    price: (product as any).price || 2.00
  };

  // Create the initial design application
  const { data: designApplication, error } = await supabase
    .from('design_requests')
    .insert({
      product_id: product.id,
      email: null, // Will be filled in later
      design_code: designCode,
      status: 'DRAFT',
      selected_style_id: null // Will be selected by user
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating design application:', error);
    throw new Error('Failed to create design application');
  }

  // Create the initial event for this request
  await supabase.rpc('add_design_request_event', {
    p_request_id: designApplication.id,
    p_created_by: 'system',
    p_event_type: 'REQUEST_CREATED',
    p_event_data: {
      email: null,
      design_code: designCode,
      product_id: product.id,
      total_amount: productWithPrice.price,
      status: 'DRAFT'
    },
    p_metadata: { created_from_page: true }
  });

  // Transform data to match component expectations
  const transformedQuestions = (questions || []).map(q => ({
    id: q.id,
    question_text: q.question_text,
    subtext: (q as any).subtext ?? null,
    question_type: q.question_type,
    option_items: questionOptionItems[q.id] || [],
    is_required: q.is_required || false,
    sort_order: q.sort_order || 0,
    is_customisable: Boolean(q.is_customisable),
    custom_template_id: q.custom_template_id ? String(q.custom_template_id) : null,
    // AI-related fields
    is_ai_generated: Boolean(q.is_ai_generated),
    ai_generated_prompt: q.ai_generated_prompt || null,
    ai_structured_output: q.ai_structured_output || null,
    ai_prompt_placeholder: q.ai_prompt_placeholder || null
  }));

  // Safety check to ensure we have valid data before rendering
  if (!designApplication || !product) {
    return <div>Loading...</div>;
  }

  return (
    <DesignApplication 
      product={product} 
      application={designApplication}
      questions={transformedQuestions} 
    />
  );
}
