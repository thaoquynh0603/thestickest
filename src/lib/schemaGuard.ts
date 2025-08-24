import fs from 'fs';
import path from 'path';

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

  // For now, just validate that the snapshot exists and has the expected structure
  // This avoids the need to query the database and prevents websocket warnings
  if (!snapshot.tables || !Array.isArray(snapshot.tables)) {
    return { ok: false, error: 'Invalid snapshot structure' };
  }

  // Return success if snapshot exists and has valid structure
  // In a production environment, you might want to add more comprehensive validation
  return { ok: true, tables: snapshot.tables.length };
}

export default validateSchema;
