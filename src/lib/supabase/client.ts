import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // Minimize websocket warnings by configuring realtime
  realtime: {
    params: {
      eventsPerSecond: 1, // Limit realtime events to reduce websocket overhead
    },
  },
  // Only enable auth features that are actually needed
  auth: {
    autoRefreshToken: true, // Keep this for user authentication
    persistSession: true,   // Keep this for user sessions
  },
  // Disable global features that might import problematic modules
  global: {
    headers: {},
  },
});
