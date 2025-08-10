import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import type { Database } from './database.types';

// These constants are imported from lib/config.ts
// Please update your credentials in that file.
const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
  throw new Error('Supabase URL and Anon Key must be configured in lib/config.ts. Please read the instructions in that file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);