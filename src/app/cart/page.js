"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import {
  getCartWithItems,
  updateItemQuantity,
  removeItem,
} from "../../lib/cart";

export default function CartPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (uid) => {
    setLoading(true);
    try {
      const { items, total_naira } = await getCartWithItems(uid);
      setItems(items);
      setTotal(total_naira);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return router.replace("/login?next=/cart");
      setUserId(user.id);
      load(user.id);
    });
  }, [router, load]);

  async function onQtyChange(id, qty) {
    if (!userId) return;
    await updateItemQuantity(userId, id, qty);
    await load(userId);
  }

  async function onRemove(id) {
    if (!userId) return;
    await removeItem(userId, id);
    await load(userId);
  }

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Your Cart</h2>
        <div className="card" style={{ padding: 20 }}>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : items.length === 0 ? (
            <>
              <p className="muted">Your cart is currently empty.</p>
              <div style={{ marginTop: 12 }}>
                <a href="/cakes" className="btn btn-gold">Browse Cakes</a>
              </div>
            </>
          ) : (
            <div className="cart-list" style={{ display: "grid", gap: 12 }}>
              {items.map((it) => (
                <div key={it.id} className="cart-row" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{it.product?.name || "Item"}</div>
                    {typeof it.product?.price_cents === "number" && (
                      <div className="muted">{(it.product.price_cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" })}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => onQtyChange(it.id, Math.max(1, it.quantity - 1))}>-</button>
                    <span>{it.quantity}</span>
                    <button className="btn btn-outline btn-sm" onClick={() => onQtyChange(it.id, it.quantity + 1)}>+</button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => onRemove(it.id)}>Remove</button>
                  </div>
                </div>
              ))}
              <hr style={{ border: 0, borderTop: "1px solid #eee", margin: "6px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700 }}>Total</div>
                <div style={{ fontWeight: 700 }}>{new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(total)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <a href="/checkout" className="btn btn-gold">Proceed to Checkout</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
