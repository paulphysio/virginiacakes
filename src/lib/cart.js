import { supabase } from "./supabaseClient";

async function getOrCreateOpenCart(userId) {
  const { data: existing, error: selectErr } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "open")
    .maybeSingle();
  if (selectErr) throw selectErr;
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("carts")
    .insert({ user_id: userId, status: "open" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function addItem(userId, productId, quantity = 1) {
  const cartId = await getOrCreateOpenCart(userId);
  const { error } = await supabase
    .from("cart_items")
    .upsert(
      [{ cart_id: cartId, product_id: productId, quantity }],
      { onConflict: "cart_id,product_id" }
    );
  if (error) throw error;
  return cartId;
}

export async function addItemByProductId(userId, productId, quantity = 1) {
  return addItem(userId, productId, quantity);
}

export async function addItemByProductName(userId, productName, quantity = 1) {
  // Find product by name; if missing, throw to avoid products insert (blocked by RLS)
  const { data: product, error: findErr } = await supabase
    .from("products")
    .select("id")
    .eq("name", productName)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!product) {
    throw new Error("Product not found. Please seed the products table or update the mapping.");
  }
  return addItem(userId, product.id, quantity);
}

export async function getCartWithItems(userId) {
  // Get open cart
  const { data: cart, error: cartErr } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "open")
    .maybeSingle();
  if (cartErr) throw cartErr;
  if (!cart) return { cartId: null, items: [], total_cents: 0 };

  const { data: items, error: itemsErr } = await supabase
    .from("cart_items")
    .select("id, quantity, product:products(id, name, price_naira, image_url)")
    .eq("cart_id", cart.id);
  if (itemsErr) throw itemsErr;
  const total_naira = items.reduce((sum, it) => sum + (it.product?.price_naira || 0) * it.quantity, 0);
  return { cartId: cart.id, items, total_naira };
}

export async function updateItemQuantity(userId, cartItemId, quantity) {
  if (quantity <= 0) return removeItem(userId, cartItemId);
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId);
  if (error) throw error;
}

export async function removeItem(userId, cartItemId) {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);
  if (error) throw error;
}

export async function getOpenCartId(userId) {
  const { data, error } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "open")
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

export async function getCartLineItems(userId) {
  const cartId = await getOpenCartId(userId);
  if (!cartId) return { cartId: null, items: [] };
  const { data: items, error } = await supabase
    .from("cart_items")
    .select("id, quantity, product:products(id, name, price_naira)")
    .eq("cart_id", cartId);
  if (error) throw error;
  return { cartId, items };
}

export async function completeCheckout(userId, paystack_ref) {
  // Fetch items and compute totals
  const { cartId, items } = await getCartLineItems(userId);
  if (!cartId || items.length === 0) throw new Error("Cart is empty");
  const total_naira = items.reduce((sum, it) => sum + (it.product?.price_naira || 0) * it.quantity, 0);
  const total_cents = total_naira * 100; // keep orders table compatibility

  // Create order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({ user_id: userId, cart_id: cartId, total_cents, status: "paid", shipping_address: null })
    .select("id")
    .single();
  if (orderErr) throw orderErr;

  // Insert order items
  const orderItems = items.map((it) => ({
    order_id: order.id,
    product_id: it.product.id,
    quantity: it.quantity,
    unit_price_cents: (it.product.price_naira || 0) * 100,
  }));
  if (orderItems.length) {
    const { error: oiErr } = await supabase.from("order_items").insert(orderItems);
    if (oiErr) throw oiErr;
  }

  // Close cart
  const { error: updErr } = await supabase
    .from("carts")
    .update({ status: "ordered" })
    .eq("id", cartId);
  if (updErr) throw updErr;

  return { orderId: order.id, total_naira, paystack_ref };
}
