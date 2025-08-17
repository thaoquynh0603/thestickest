import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('design_request_answers_history')
      .select('question_id, answer_text, answer_file_url, answer_options, created_at, is_current')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch answers history', error);
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }

    // Keep only the latest entry per question (prefer rows marked is_current=true)
    const latestByQ: Record<string, typeof data[number]> = {};
    for (const row of data || []) {
      const existing = latestByQ[row.question_id];
      if (!existing || (existing.is_current === false && row.is_current === true) || new Date(row.created_at) > new Date(existing.created_at)) {
        latestByQ[row.question_id] = row;
      }
    }

    // Resolve human-readable labels for question IDs where possible
    const allQKeys = Object.keys(latestByQ).filter(id => id && id !== 'how_did_you_hear');
    let questionLabels: Record<string, string> = {};

    // 1) Lookup standard request_questions by id
    const qIds = allQKeys.filter(k => !k.includes(':'));
    if (qIds.length > 0) {
      const { data: qrows, error: qerr } = await supabase
        .from('request_questions')
        .select('id, question_text')
        .in('id', qIds as any[]);
      if (!qerr && Array.isArray(qrows)) {
        qrows.forEach((q: any) => { questionLabels[String(q.id)] = q.question_text; });
      }
    }

    // 2) Handle namespaced keys and custom template questions like "templateId:subId".
    const namespaced = allQKeys.filter(k => k.includes(':'));
    const templateIds = Array.from(new Set(namespaced.map(k => k.split(':')[0])));
    if (templateIds.length > 0) {
      // For each templateId, fetch its custom questions ordered by created_at
      await Promise.all(templateIds.map(async (tid) => {
        try {
          const tidNum = /^\\\\d+\\b$/.test(tid) ? parseInt(tid, 10) : NaN;
          if (isNaN(tidNum)) return;
          const { data: cq, error: cqErr } = await supabase
            .from('custom_questions')
            .select('id, question_text')
            .eq('custom_template_id', tidNum)
            .order('created_at', { ascending: true });
          if (cq && !cqErr && Array.isArray(cq)) {
            // Map both template:id and template:position (1-based)
            cq.forEach((q: any, idx: number) => {
              questionLabels[`${tid}:${String(q.id)}`] = q.question_text;
              questionLabels[`${tid}:${String(idx + 1)}`] = q.question_text;
              // Also map bare numeric id if it appears in our keys
              questionLabels[String(q.id)] = questionLabels[String(q.id)] ?? q.question_text;
            });
          }
        } catch (e) {
          // ignore per-template failures
        }
      }));
    }

    // 3) Also try to resolve any remaining bare ids from custom_questions table
    const remainingIds = Object.keys(latestByQ).filter(k => !questionLabels[k] && !k.includes(':'));
    if (remainingIds.length > 0) {
      const { data: bareCq, error: bareErr } = await supabase
        .from('custom_questions')
        .select('id, question_text')
        .in('id', remainingIds as any[]);
      if (!bareErr && Array.isArray(bareCq)) {
        bareCq.forEach((q: any) => { questionLabels[String(q.id)] = q.question_text; });
      }
    }

    // Build a mapping keyed by question_text (fallback to original id when missing)
    const result: Record<string, any> = {};
    for (const [qid, row] of Object.entries(latestByQ)) {
      const label = questionLabels[qid] ?? qid;
      // Prefer text, then options, then file URL. If the answer_text is a
      // JSON object from a custom flow, unpack its entries into top-level
      // labeled keys (using any available questionLabels mapping) so the API
      // returns friendly keys rather than nested JSON strings.
      if (row.answer_text) {
        try {
          const parsed = JSON.parse(row.answer_text as string);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            // Merge each inner key into the top-level result using label resolution
            for (const [innerKey, innerVal] of Object.entries(parsed as Record<string, any>)) {
              const innerLabel = questionLabels[innerKey] ?? innerKey;
              // Prefer simple unwrap for arrays that look like values
              if (Array.isArray(innerVal)) result[innerLabel] = innerVal;
              else result[innerLabel] = innerVal;
            }
            // Do not also set the parent label to the raw JSON string - we've
            // expanded it into individual keys above.
            continue;
          }
        } catch {
          // Not JSON - fall back to treating as plain text below
        }
        result[label] = row.answer_text;
      } else if (row.answer_options) {
        // If options payload contains a 'values' array, unwrap it, otherwise return raw object
        try {
          const opts = row.answer_options as any;
          if (opts && Array.isArray(opts.values)) result[label] = opts.values;
          else result[label] = opts;
        } catch {
          result[label] = row.answer_options;
        }
      } else if (row.answer_file_url) result[label] = row.answer_file_url;
      else result[label] = null;
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error('Unexpected error fetching answers', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


