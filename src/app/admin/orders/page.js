"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function AdminOrdersApprovalPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/admin/orders");
        return;
      }
      setUser(user);
      setAuthChecked(true);
    })();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    loadPending();
  }, [authChecked]);

  async function loadPending() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pending-transfers", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load pending transfers");
      setPending(json.data || []);
    } catch (e) {
      setError(e?.message || "Unable to load data");
    } finally {
      setLoading(false);
    }
  }

  async function confirmTransfer(transferId) {
    if (!transferId) return;
    const ok = window.confirm("Confirm this transfer? This will create an order, mark it as paid, and send a notification email.");
    if (!ok) return;
    setConfirmingId(transferId);
    try {
      const res = await fetch("/api/admin/confirm-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Confirm failed");
      // Remove from list
      setPending((prev) => prev.filter((t) => t.id !== transferId));
      alert(`Order created successfully. Order ID: ${json.orderId}`);
    } catch (e) {
      alert(e?.message || "Unable to confirm transfer");
    } finally {
      setConfirmingId(null);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return pending;
    const q = search.toLowerCase();
    return pending.filter((p) =>
      (p.payer_name || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q) ||
      (p.transfer_reference || "").toLowerCase().includes(q) ||
      (p.amount_naira + "").includes(q)
    );
  }, [pending, search]);

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 1024 }}>
        <div className="section-head" style={{ marginBottom: 16 }}>
          <h2 className="section-title">Admin – Approve Orders</h2>
          <p className="muted">Review bank transfer submissions, view proofs, and confirm to create orders.</p>
        </div>

        <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search by name, phone, ref or amount"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #eee",
                borderRadius: 10,
                outline: "none",
                minWidth: 260,
              }}
            />
            <button className="btn" onClick={loadPending}>Refresh</button>
          </div>

          {loading ? (
            <p className="muted">Loading...</p>
          ) : error ? (
            <div style={{ color: "#b00020" }}>{error}</div>
          ) : filtered.length === 0 ? (
            <p className="muted">No pending transfers.</p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {filtered.map((t) => {
                const dataUrl = `data:${t.proof_mime || "image/jpeg"};base64,${t.proof_base64}`;
                const when = t.paid_at ? new Date(t.paid_at).toLocaleString() : "N/A";
                return (
                  <div key={t.id} style={{
                    border: "1px solid #F8C8DC",
                    padding: 12,
                    borderRadius: 12,
                    background: "#fff5f8",
                    display: "grid",
                    gridTemplateColumns: "140px 1fr auto",
                    gap: 12,
                    alignItems: "center",
                  }}>
                    <div>
                      <img src={dataUrl} alt="Proof" style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 10, border: "1px solid #eee" }} />
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <div><strong>Name:</strong> {t.payer_name}</div>
                        <div><strong>Phone:</strong> {t.phone}</div>
                        <div><strong>Ref:</strong> {t.transfer_reference || "N/A"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <div><strong>Amount:</strong> ₦{Number(t.amount_naira || 0).toLocaleString("en-NG")}</div>
                        <div><strong>Paid At:</strong> {when}</div>
                        <div><strong>Size:</strong> {(t.proof_size/1024).toFixed(0)} KB</div>
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>Submitted: {new Date(t.created_at).toLocaleString()}</div>
                    </div>
                    <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
                      <button
                        className="btn btn-gold"
                        onClick={() => confirmTransfer(t.id)}
                        disabled={confirmingId === t.id}
                      >
                        {confirmingId === t.id ? "Confirming..." : "Confirm & Create Order"}
                      </button>
                      <a
                        className="btn btn-outline"
                        href={dataUrl}
                        download={`proof-${t.id}.jpg`}
                        target="_blank" rel="noopener noreferrer"
                      >Download Proof</a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
