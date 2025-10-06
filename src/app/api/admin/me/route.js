import { NextResponse } from 'next/server';
import { requireAdmin, unauthorized } from '../_auth';

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return unauthorized(auth.status, auth.error);
  const user = auth.user;
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
}
