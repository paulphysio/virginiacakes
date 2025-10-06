"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function AdminTransfersPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/admin/transfers");
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";
      if (!token) {
        router.replace("/login?next=/admin/transfers");
        return;
      }
      const res = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      setAccessToken(token);
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
      const res = await fetch("/api/admin/pending-transfers", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ transferId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Confirm failed");
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
    <>
      <div className="admin-header">
        <div>
          <h1>Bank Transfers</h1>
          <p>Review and approve pending bank transfer submissions</p>
        </div>
        <button className="btn btn-outline" onClick={loadPending}>Refresh</button>
      </div>

      <div className="admin-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name, phone, ref or amount"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {loading ? (
          <p className="loading-text">Loading transfers...</p>
        ) : error ? (
          <div className="error-box">{error}</div>
        ) : filtered.length === 0 ? (
          <p className="no-data">No pending transfers.</p>
        ) : (
          <div className="transfers-list">
            {filtered.map((t) => {
              const dataUrl = `data:${t.proof_mime || "image/jpeg"};base64,${t.proof_base64}`;
              const when = t.paid_at ? new Date(t.paid_at).toLocaleString() : "N/A";
              return (
                <div key={t.id} className="transfer-card">
                  <div className="transfer-proof">
                    <img src={dataUrl} alt="Proof" />
                  </div>
                  <div className="transfer-details">
                    <div className="transfer-row">
                      <div className="detail-item">
                        <span className="detail-label">Name:</span>
                        <span className="detail-value">{t.payer_name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{t.phone}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Reference:</span>
                        <span className="detail-value">{t.transfer_reference || "N/A"}</span>
                      </div>
                    </div>
                    <div className="transfer-row">
                      <div className="detail-item">
                        <span className="detail-label">Amount:</span>
                        <span className="detail-value amount">₦{Number(t.amount_naira || 0).toLocaleString("en-NG")}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Paid At:</span>
                        <span className="detail-value">{when}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Size:</span>
                        <span className="detail-value">{(t.proof_size/1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                    <div className="transfer-meta">
                      Submitted: {new Date(t.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="transfer-actions">
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
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download Proof
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .admin-header h1 {
          margin: 0 0 4px 0;
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
        }
        .admin-header p {
          margin: 0;
          color: #6b7280;
          font-size: 16px;
        }
        .admin-section {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .search-bar {
          margin-bottom: 24px;
        }
        .search-input {
          width: 100%;
          max-width: 500px;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          outline: none;
        }
        .search-input:focus {
          border-color: #D4AF37;
        }
        .loading-text, .no-data {
          text-align: center;
          color: #6b7280;
          padding: 40px;
        }
        .error-box {
          padding: 16px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 10px;
          text-align: center;
        }
        .transfers-list {
          display: grid;
          gap: 20px;
        }
        .transfer-card {
          display: grid;
          grid-template-columns: 160px 1fr auto;
          gap: 20px;
          padding: 20px;
          border: 1px solid #F8C8DC;
          border-radius: 12px;
          background: #fff5f8;
          align-items: center;
        }
        .transfer-proof {
          width: 160px;
          height: 160px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          background: #fff;
        }
        .transfer-proof img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .transfer-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .transfer-row {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .detail-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
        }
        .detail-value {
          font-size: 15px;
          color: #1f2937;
          font-weight: 600;
        }
        .detail-value.amount {
          color: #D4AF37;
          font-size: 18px;
        }
        .transfer-meta {
          font-size: 12px;
          color: #9ca3af;
        }
        .transfer-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 200px;
        }
        @media (max-width: 968px) {
          .transfer-card {
            grid-template-columns: 1fr;
          }
          .transfer-actions {
            min-width: auto;
          }
        }
      `}</style>
    </>
  );
}
