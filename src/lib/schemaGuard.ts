import fs from 'fs';
import path from 'path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SNAPSHOT_PATH = path.join(process.cwd(), 'supabase', 'schema-snapshot-thestickest-mvp.json');

function loadSnapshot() {
  try {
    const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e: any) {
    console.warn('Schema snapshot not found or invalid:', e.message);
    return null;
  }
}

export async function validateSchema() {
  const snapshot = loadSnapshot();
  if (!snapshot) return { ok: false, error: 'Snapshot missing' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) return { ok: false, error: 'Supabase env vars missing' };

  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

  try {
    const { data: pgTables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public');

    if (error) return { ok: false, error: String(error) };

    const existing = new Set((pgTables || []).map((r: any) => r.table_name));
    const missing: string[] = [];
    for (const t of snapshot.tables) {
      if (!existing.has(t.name)) missing.push(t.name);
    }

    if (missing.length > 0) {
      return { ok: false, error: `Missing tables: ${missing.join(', ')}`, missing };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export default validateSchema;
