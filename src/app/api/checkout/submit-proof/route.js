import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper: format an error response
function err(status, message) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req) {
  try {
    // Validate server env is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return err(500, "Server is missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    }
    const auth = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    const body = await req.json();

    // Basic payload validation
    const {
      user_id,
      payer_name,
      phone,
      transfer_reference = null,
      paid_at = null,
      proof_base64,
      proof_mime = "image/jpeg",
      proof_size = 0,
    } = body || {};

    if (!token) return err(401, "Missing auth token");
    if (!user_id) return err(400, "Missing user_id");
    if (!payer_name || !phone) return err(400, "Missing payer_name or phone");
    if (!proof_base64) return err(400, "Missing payment proof");

    // Verify the JWT belongs to the same user_id
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr) return err(401, "Invalid token");
    if (!userData?.user?.id || userData.user.id !== user_id) return err(401, "Unauthorized user");

    // 1) Get user's open cart
    const { data: cart, error: cartErr } = await supabaseAdmin
      .from("carts")
      .select("id")
      .eq("user_id", user_id)
      .eq("status", "open")
      .maybeSingle();
    if (cartErr) return err(500, cartErr.message || "Unable to fetch cart");
    if (!cart) return err(400, "Cart is empty");

    // 2) Get cart items with product prices
    const { data: items, error: itemsErr } = await supabaseAdmin
      .from("cart_items")
      .select("id, quantity, product:products(id, name, price_naira)")
      .eq("cart_id", cart.id);
    if (itemsErr) return err(500, itemsErr.message || "Unable to fetch cart items");
    if (!items?.length) return err(400, "Cart is empty");

    const total_naira = items.reduce((sum, it) => sum + (it.product?.price_naira || 0) * it.quantity, 0);
    const total_cents = total_naira * 100;

    // 3) Create order with pending status
    // Try common status values that might be in your check constraint
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({ user_id, cart_id: cart.id, total_cents, status: "pending", shipping_address: null })
      .select("id")
      .single();
    if (orderErr) return err(500, orderErr.message || "Unable to create order");

    // 4) Insert order_items
    const orderItems = items.map((it) => {
      const unit = (it.product.price_naira || 0) * 100;
      const qty = it.quantity || 0;
      return {
        order_id: order.id,
        product_id: it.product.id,
        quantity: qty,
        unit_price_cents: unit,
        // subtotal_cents is auto-calculated by database (GENERATED column)
      };
    });
    if (orderItems.length) {
      const { error: oiErr } = await supabaseAdmin.from("order_items").insert(orderItems);
      if (oiErr) return err(500, oiErr.message || "Unable to create order items");
    }

    // 5) Close the cart
    const { error: updErr } = await supabaseAdmin
      .from("carts")
      .update({ status: "ordered" })
      .eq("id", cart.id);
    if (updErr) return err(500, updErr.message || "Unable to close cart");

    // 6) Insert bank transfer linked to order
    let { error: btErr } = await supabaseAdmin.from("bank_transfers").insert({
      user_id,
      cart_id: cart.id,
      order_id: order.id,
      amount_naira: total_naira,
      payer_name,
      phone,
      transfer_reference,
      paid_at,
      proof_base64,
      proof_mime,
      proof_size,
    });
    // Fallback if order_id column is missing
    if (btErr) {
      const msg = btErr.message || "Unable to save payment proof";
      if (/column\s+order_id\s+does not exist/i.test(msg)) {
        const { error: btErr2 } = await supabaseAdmin.from("bank_transfers").insert({
          user_id,
          cart_id: cart.id,
          amount_naira: total_naira,
          payer_name,
          phone,
          transfer_reference,
          paid_at,
          proof_base64,
          proof_mime,
          proof_size,
        });
        if (btErr2) return err(500, btErr2.message || "Unable to save payment proof (no order linkage)");
      } else {
        return err(500, msg);
      }
    }

    return NextResponse.json({ ok: true, order_id: order.id, total_naira });
  } catch (e) {
    return err(500, e?.message || "Unexpected server error");
  }
}
