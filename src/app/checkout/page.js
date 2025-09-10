"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { getCartWithItems } from "../../lib/cart";
import { completeCheckout } from "../../lib/cart";

export default function CheckoutPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (uid) => {
    setLoading(true);
    setError("");
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
      if (!user) return router.replace("/login?next=/checkout");
      setUser(user);
      load(user.id);
    });
  }, [router, load]);

  // If redirected back from Paystack with a reference, verify and complete
  useEffect(() => {
    const ref = search.get("reference") || search.get("ref");
    if (!ref || !user) return;
    (async () => {
      try {
        setMessage("Verifying payment...");
        const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(ref)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Verification failed");
        const status = json?.data?.status;
        if (status !== "success") throw new Error("Payment was not successful");
        await completeCheckout(user.id, ref);
        setMessage("Payment successful. Redirecting to Orders...");
        setTimeout(() => router.replace("/orders"), 1400);
      } catch (e) {
        setError(e?.message || "Unable to verify payment");
      }
    })();
  }, [search, user, router]);

  const formattedTotal = useMemo(() => {
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(total);
    } catch {
      return `₦${total?.toLocaleString?.() ?? total ?? 0}`;
    }
  }, [total]);

  async function startPayment() {
    try {
      setError("");
      if (!user) return router.push("/login?next=/checkout");
      if (total <= 0) throw new Error("Your cart is empty");
      const reference = `PSK_${Date.now()}`;
      const callback_url = `${window.location.origin}/checkout`;
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_naira: total, email: user.email, reference, callback_url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to init payment");
      const authUrl = json?.data?.authorization_url;
      if (!authUrl) throw new Error("No authorization URL from Paystack");
      window.location.href = authUrl;
    } catch (e) {
      setError(e?.message || "Unable to start payment");
    }
  }

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Checkout</h2>
        <div className="card" style={{ padding: 20, display: "grid", gap: 12 }}>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : items.length === 0 ? (
            <p className="muted">Your cart is empty.</p>
          ) : (
            <>
              <div className="cart-review" style={{ display: "grid", gap: 8 }}>
                {items.map((it) => (
                  <div key={it.id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{it.product?.name} × {it.quantity}</span>
                    <span>
                      {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })
                        .format((it.product?.price_naira || 0) * it.quantity)}
                    </span>
                  </div>
                ))}
                <hr style={{ border: 0, borderTop: "1px solid #eee" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span>Total</span>
                  <span>{formattedTotal}</span>
                </div>
              </div>

              {error && <div style={{ color: "#b00020" }}>{error}</div>}
              {message && <div className="muted">{message}</div>}

              <button className="btn btn-gold" onClick={startPayment}>Pay with Paystack</button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
