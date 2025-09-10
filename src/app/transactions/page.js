"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function TransactionsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return router.replace("/login?next=/transactions");
      setUser(user);
      loadOrders(user.id);
    });
  }, [router]);

  async function loadOrders(userId) {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total_cents, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      setError(e?.message || "Unable to load transactions");
    } finally {
      setLoading(false);
    }
  }

  function formatNairaFromCents(cents) {
    const naira = Math.round((cents || 0) / 100);
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(naira);
    } catch {
      return `₦${naira?.toLocaleString?.() ?? naira ?? 0}`;
    }
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 820 }}>
        <div className="section-head" style={{ marginBottom: 16 }}>
          <h2 className="section-title">Transactions</h2>
          <p className="muted">Your recent payments and orders.</p>
        </div>

        <div className="card" style={{ padding: 16 }}>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : error ? (
            <div style={{ color: "#b00020" }}>{error}</div>
          ) : orders.length === 0 ? (
            <p className="muted">No transactions yet.</p>
          ) : (
            <div className="tx-list" style={{ display: "grid", gap: 10 }}>
              {orders.map((o) => (
                <div key={o.id} className="tx-row" style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 10,
                  alignItems: "center",
                  border: "1px solid #eee",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#fff",
                }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Order #{o.id.slice(0, 8)}</div>
                    <div className="muted" style={{ fontSize: 13 }}>{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>{formatNairaFromCents(o.total_cents)}</div>
                  <div>
                    <span className={`badge ${o.status}`}>{o.status === "paid" ? "Paid" : o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .badge {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 12px;
          border: 1px solid #e5e5e5;
        }
        .badge.paid { color: #0d5e00; background: #effbe8; border-color: #cff1bf; }
        .badge.pending { color: #6b4f00; background: #fff7d6; border-color: #ffec9f; }
        .badge.failed { color: #7a001a; background: #ffe7ea; border-color: #ffc2cc; }
      `}</style>
    </section>
  );
}
