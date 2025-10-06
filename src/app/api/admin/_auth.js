import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// Extract bearer token from Authorization header
function getBearerToken(req) {
  try {
    const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    const parts = auth.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  } catch {}
  return null;
}

export async function requireAdmin(req) {
  const token = getBearerToken(req);
  if (!token) {
    return { ok: false, status: 401, error: 'Missing bearer token' };
  }
  try {
    // Validate token and get user
    const { data: userRes, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr) throw authErr;
    const user = userRes?.user;
    const userId = user?.id;
    if (!userId) return { ok: false, status: 401, error: 'Invalid token' };

    // Check admin table
    const { data: adminRow, error: aErr } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!adminRow) return { ok: false, status: 403, error: 'Forbidden' };

    return { ok: true, user };
  } catch (e) {
    return { ok: false, status: 500, error: e?.message || 'Auth error' };
  }
}

export function unauthorized(status = 401, message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status });
}
