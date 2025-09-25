import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('bank_transfers')
      .select('id, created_at, user_id, cart_id, amount_naira, payer_name, phone, transfer_reference, paid_at, proof_base64, proof_mime, proof_size, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, data: data || [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
