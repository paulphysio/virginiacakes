import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role for admin actions (bypasses RLS)
// Make sure to set these in your environment (.env.local or hosting provider env):
// SUPABASE_SERVICE_ROLE_KEY (never expose to client) and NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('Supabase admin env vars are not set. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured on the server.');
}

export const supabaseAdmin = createClient(supabaseUrl || '', serviceRoleKey || '', {
  auth: { autoRefreshToken: false, persistSession: false },
});
