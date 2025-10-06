import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import nodemailer from 'nodemailer';
import { requireAdmin, unauthorized } from '../_auth';

// Email sending
async function sendEmail({ to, subject, html }) {
  const SMTP_URL = process.env.SMTP_URL;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@virginiacakes.com';
  if (SMTP_URL && to) {
    try {
      const transporter = nodemailer.createTransport(SMTP_URL);
      await transporter.sendMail({ from: FROM_EMAIL, to, subject, html });
      return { ok: true };
    } catch (e) {
      console.warn('SMTP send failed, falling back to Resend if available:', e?.message);
    }
  }
  // Fallback to Resend if configured
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && to) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, reason: text };
    }
    return { ok: true };
  }
  return { ok: false, reason: 'No email provider configured' };
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return unauthorized(auth.status, auth.error);
  try {
    const body = await req.json();
    const { transferId } = body || {};
    if (!transferId) return NextResponse.json({ error: 'transferId is required' }, { status: 400 });

    // 1) Load the bank transfer record
    const { data: transfer, error: tErr } = await supabaseAdmin
      .from('bank_transfers')
      .select('*')
      .eq('id', transferId)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!transfer) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    if (transfer.status === 'verified') return NextResponse.json({ ok: true, message: 'Already verified' });

    const userId = transfer.user_id;
    const cartId = transfer.cart_id;

    if (!cartId) return NextResponse.json({ error: 'Missing cart_id on transfer' }, { status: 400 });

    // 2) Fetch cart items with products
    const { data: cartItems, error: ciErr } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity, product:products(id, name, price_naira)')
      .eq('cart_id', cartId);
    if (ciErr) throw ciErr;
    if (!cartItems || cartItems.length === 0) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

    const total_naira = cartItems.reduce((sum, it) => sum + (it.product?.price_naira || 0) * it.quantity, 0);
    const total_cents = total_naira * 100;

    // 3) Create order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({ user_id: userId, cart_id: cartId, total_cents, status: 'paid', shipping_address: null })
      .select('id, created_at')
      .single();
    if (orderErr) throw orderErr;

    // 4) Insert order items
    const orderItems = cartItems.map((it) => ({
      order_id: order.id,
      product_id: it.product.id,
      quantity: it.quantity,
      unit_price_cents: (it.product.price_naira || 0) * 100,
    }));
    if (orderItems.length) {
      const { error: oiErr } = await supabaseAdmin.from('order_items').insert(orderItems);
      if (oiErr) throw oiErr;
    }

    // 5) Close cart
    const { error: updCartErr } = await supabaseAdmin
      .from('carts')
      .update({ status: 'ordered' })
      .eq('id', cartId);
    if (updCartErr) throw updCartErr;

    // 6) Mark bank transfer verified
    const { error: updTransferErr } = await supabaseAdmin
      .from('bank_transfers')
      .update({ status: 'verified' })
      .eq('id', transferId);
    if (updTransferErr) throw updTransferErr;

    // 7) Load user email
    const { data: userRow, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userErr) console.warn('admin.getUserById error', userErr);
    const userEmail = userRow?.user?.email || '';

    // 8) Send email to admin (optional)
    const adminEmail = process.env.EMAIL || process.env.ADMIN_EMAIL;
    const BRAND = process.env.BRAND_NAME || 'Virginia Cakes';
    const subject = `${BRAND}: Order Confirmed #${String(order.id).slice(0, 8)} – ₦${total_naira.toLocaleString('en-NG')}`;
    const itemsHtml = cartItems.map((it) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${it.product?.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${it.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">₦${(it.product?.price_naira||0).toLocaleString('en-NG')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">₦${(((it.product?.price_naira||0)*it.quantity)).toLocaleString('en-NG')}</td>
      </tr>
    `).join('');

    const html = `
      <div style=\"font-family:Inter,Segoe UI,Arial,sans-serif;color:#333;background:#fff;padding:24px;\">
        <h2 style=\"margin:0 0 6px 0;color:#333;\">${BRAND} – Order Confirmed</h2>
        <p style=\"margin:0 0 16px 0;color:#666;\">Order <strong>#${String(order.id).slice(0,8)}</strong> has been confirmed and marked as paid.</p>

        <div style=\"border:1px solid #F8C8DC;border-radius:12px;padding:16px;background:#fff5f8;\">
          <h3 style=\"margin:0 0 10px 0;color:#333;\">Payer & Transfer Details</h3>
          <p style=\"margin:0;\">
            <strong>Name:</strong> ${transfer.payer_name}<br/>
            <strong>Phone:</strong> ${transfer.phone}<br/>
            <strong>User Email:</strong> ${userEmail || 'N/A'}<br/>
            <strong>Reference:</strong> ${transfer.transfer_reference || 'N/A'}<br/>
            <strong>Paid At:</strong> ${transfer.paid_at || 'N/A'}
          </p>
        </div>

        <h3 style=\"margin:18px 0 8px 0;color:#333;\">Items</h3>
        <table style=\"width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:12px;overflow:hidden;\">
          <thead>
            <tr style=\"background:#fafafa;\">
              <th style=\"text-align:left;padding:8px 12px;border-bottom:1px solid #eee;\">Item</th>
              <th style=\"text-align:left;padding:8px 12px;border-bottom:1px solid #eee;\">Qty</th>
              <th style=\"text-align:left;padding:8px 12px;border-bottom:1px solid #eee;\">Unit</th>
              <th style=\"text-align:left;padding:8px 12px;border-bottom:1px solid #eee;\">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan=\"3\" style=\"padding:10px 12px;text-align:right;font-weight:700;\">Grand Total</td>
              <td style=\"padding:10px 12px;font-weight:700;\">₦${total_naira.toLocaleString('en-NG')}</td>
            </tr>
          </tfoot>
        </table>

        <p style=\"margin-top:16px;color:#999;font-size:12px;\">${BRAND} • Admin confirmation email</p>
      </div>
    `;

    if (adminEmail) {
      await sendEmail({ to: adminEmail, subject, html });
    }

    return NextResponse.json({ ok: true, orderId: order.id, total_naira });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
