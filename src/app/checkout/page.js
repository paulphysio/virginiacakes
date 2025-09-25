"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { getCartWithItems } from "../../lib/cart";

function CheckoutContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [cartId, setCartId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Form state for bank transfer submission
  const [payerName, setPayerName] = useState("");
  const [phone, setPhone] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);
  const [whatsAppUrl, setWhatsAppUrl] = useState("");

  const load = useCallback(async (uid) => {
    setLoading(true);
    setError("");
    try {
      const { cartId, items, total_naira } = await getCartWithItems(uid);
      setCartId(cartId);
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

  // ====== Bank Account Details (Static) ======
  const ACCOUNT_NUMBER = "1001622115";
  const BANK_NAME = "VFD Microfinance Bank";
  const ACCOUNT_NAME = "Athanesius Virginia Ezindu";
  // TODO: Set your WhatsApp number in full international format without '+' e.g. 2348012345678
  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""; // e.g. 2348012345678

  const formattedTotal = useMemo(() => {
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(total);
    } catch {
      return `₦${total?.toLocaleString?.() ?? total ?? 0}`;
    }
  }, [total]);

  // Utility: compress an image strongly using canvas
  async function compressImage(file, maxW = 1024, maxH = 1024, quality = 0.3) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(maxW / width, maxH / height, 1);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Invalid image"));
      img.src = URL.createObjectURL(file);
    });
  }

  async function fileToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function submitBankTransfer(e) {
    e?.preventDefault?.();
    try {
      setError("");
      setMessage("");
      if (!user) return router.push("/login?next=/checkout");
      if (!cartId || items.length === 0 || total <= 0) throw new Error("Your cart is empty");
      if (!payerName.trim()) throw new Error("Please enter the payer's full name");
      if (!phone.trim()) throw new Error("Please enter your phone number");
      if (!proofFile) throw new Error("Please upload a clear screenshot or photo of the transfer receipt");

      setSubmitting(true);

      // Strong compression
      const compressed = await compressImage(proofFile, 1024, 1024, 0.28);
      // Ensure max ~500KB
      let finalBlob = compressed;
      if (compressed.size > 500 * 1024) {
        // second pass
        const second = await compressImage(proofFile, 900, 900, 0.22);
        finalBlob = second;
      }
      const proof_base64 = await fileToBase64(finalBlob);
      const proof_size = finalBlob.size;
      const proof_mime = "image/jpeg";

      const payload = {
        user_id: user.id,
        cart_id: cartId,
        amount_naira: total,
        payer_name: payerName.trim(),
        phone: phone.trim(),
        transfer_reference: transferRef.trim() || null,
        paid_at: paidAt || null,
        proof_base64,
        proof_mime,
        proof_size,
        status: "pending",
      };

      const { error: insertErr } = await supabase.from("bank_transfers").insert(payload);
      if (insertErr) throw insertErr;

      setMessage("Thank you! Your payment proof has been submitted for review. We'll verify and update your order shortly.");

      // Auto-open WhatsApp chat if configured
      if (WHATSAPP_NUMBER) {
        const text = `Hello Virginia Cakes, I just submitted proof of payment for ${formattedTotal}. Name: ${payerName}. Ref: ${transferRef || "N/A"}.`;
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
        setWhatsAppUrl(url);
        try {
          const win = window.open(url, "_blank", "noopener,noreferrer");
          if (!win) {
            setShowWhatsAppPrompt(true);
          }
        } catch (_) {
          setShowWhatsAppPrompt(true);
        }
      }

      // Optional: redirect after a delay
      // setTimeout(() => router.replace("/orders"), 1500);
      setPayerName("");
      setPhone("");
      setTransferRef("");
      setPaidAt("");
      setProofFile(null);
    } catch (e) {
      setError(e?.message || "Unable to submit your payment proof");
    } finally {
      setSubmitting(false);
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
              {showWhatsAppPrompt && whatsAppUrl && (
                <div className="card" style={{
                  padding: 12,
                  background: "#f0fff5",
                  border: "1px solid #c8e6c9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" aria-hidden>
                      <path d="M20.52 3.48A11.91 11.91 0 0 0 12.04 0C5.46 0 .1 5.36.1 11.94c0 2.1.55 4.18 1.6 6.01L0 24l6.2-1.62a11.86 11.86 0 0 0 5.84 1.5h.01c6.58 0 11.94-5.36 11.94-11.94 0-3.19-1.24-6.19-3.47-8.46zM12.05 21.5h-.01a9.56 9.56 0 0 1-4.88-1.33l-.35-.2-3.68.96.98-3.59-.23-.37a9.54 9.54 0 0 1-1.47-5.13C2.41 6.7 6.76 2.35 12.04 2.35c2.57 0 4.98 1 6.8 2.81a9.54 9.54 0 0 1 2.82 6.81c0 5.28-4.35 9.53-9.61 9.53zm5.49-7.13c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.5-1.77-1.68-2.07-.17-.3-.02-.47.13-.62.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.2-.24-.57-.49-.5-.66-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.06 2.9 1.2 3.1.15.2 2.07 3.17 5.02 4.44.7.3 1.25.47 1.68.6.7.22 1.34.19 1.84.12.56-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
                    </svg>
                    <div>
                      <div style={{ fontWeight: 600, color: "#2e7d32" }}>WhatsApp blocked by your browser</div>
                      <div className="muted">Click the button to send us your message on WhatsApp.</div>
                    </div>
                  </div>
                  <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">Open WhatsApp</a>
                </div>
              )}

              <div className="card" style={{ padding: 16, background: "#fff5f8", border: "1px solid #F8C8DC" }}>
                <h3 style={{ margin: 0, color: "#333" }}>Pay via Bank Transfer</h3>
                <p className="muted" style={{ marginTop: 6 }}>Kindly make a transfer of the total amount to the account below, then upload your proof of payment.</p>
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "160px 1fr auto", alignItems: "center", gap: 8 }}>
                    <strong>Account Name:</strong>
                    <span>{ACCOUNT_NAME}</span>
                    <button className="btn" onClick={() => navigator.clipboard.writeText(ACCOUNT_NAME)}>Copy</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "160px 1fr auto", alignItems: "center", gap: 8 }}>
                    <strong>Account Number:</strong>
                    <span style={{ letterSpacing: 1 }}>{ACCOUNT_NUMBER}</span>
                    <button className="btn" onClick={() => navigator.clipboard.writeText(ACCOUNT_NUMBER)}>Copy</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "160px 1fr auto", alignItems: "center", gap: 8 }}>
                    <strong>Bank:</strong>
                    <span>{BANK_NAME}</span>
                    <button className="btn" onClick={() => navigator.clipboard.writeText(BANK_NAME)}>Copy</button>
                  </div>
                </div>
                {WHATSAPP_NUMBER ? (
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      `Hello Virginia Cakes, I just paid ${formattedTotal}. Name: ${payerName || ""}. Ref: ${transferRef || ""}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 12,
                      color: "#25D366",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M20.52 3.48A11.91 11.91 0 0 0 12.04 0C5.46 0 .1 5.36.1 11.94c0 2.1.55 4.18 1.6 6.01L0 24l6.2-1.62a11.86 11.86 0 0 0 5.84 1.5h.01c6.58 0 11.94-5.36 11.94-11.94 0-3.19-1.24-6.19-3.47-8.46zM12.05 21.5h-.01a9.56 9.56 0 0 1-4.88-1.33l-.35-.2-3.68.96.98-3.59-.23-.37a9.54 9.54 0 0 1-1.47-5.13C2.41 6.7 6.76 2.35 12.04 2.35c2.57 0 4.98 1 6.8 2.81a9.54 9.54 0 0 1 2.82 6.81c0 5.28-4.35 9.53-9.61 9.53zm5.49-7.13c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.5-1.77-1.68-2.07-.17-.3-.02-.47.13-.62.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.2-.24-.57-.49-.5-.66-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.06 2.9 1.2 3.1.15.2 2.07 3.17 5.02 4.44.7.3 1.25.47 1.68.6.7.22 1.34.19 1.84.12.56-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
                    </svg>
                    Message us on WhatsApp
                  </a>
                ) : (
                  <p className="muted" style={{ marginTop: 8 }}>Prefer WhatsApp? Provide your WhatsApp number to enable a quick-chat button.</p>
                )}
              </div>

              <form onSubmit={submitBankTransfer} style={{ display: "grid", gap: 12, marginTop: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <label>Full Name on the Transfer</label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., 0803 123 4567"
                    required
                  />
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <label>Transfer Reference/Description (optional)</label>
                  <input
                    type="text"
                    value={transferRef}
                    onChange={(e) => setTransferRef(e.target.value)}
                    placeholder="e.g., Order 1234"
                  />
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <label>Payment Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                  />
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <label>Upload Proof of Payment (JPG/PNG)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    required
                  />
                  <p className="muted">We will compress the image heavily before secure storage to keep your data usage minimal.</p>
                </div>
                <button className="btn btn-gold" type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Proof of Payment"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<section className="section"><div className="container"><p className="muted">Loading checkout...</p></div></section>}>
      <CheckoutContent />
    </Suspense>
  );
}
