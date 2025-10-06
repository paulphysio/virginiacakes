"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

function ResetContent() {
  const search = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("request"); // "request" or "update"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If Supabase redirects here with a recovery token, switch to update mode
    const type = search.get("type");
    if (type === "recovery") {
      setMode("update");
    }
  }, [search]);

  async function requestReset(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const redirectTo = window.location.origin + "/reset"; // will come back with type=recovery
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setMessage("If an account exists for that email, a reset link has been sent.");
    } catch (err) {
      setError(err?.message || "Unable to send reset email");
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (password !== confirm) throw new Error("Passwords do not match");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Password updated. Redirecting to login...");
      setTimeout(() => router.replace("/login"), 1400);
    } catch (err) {
      setError(err?.message || "Unable to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <h2 className="section-title">{mode === "request" ? "Reset Password" : "Set New Password"}</h2>
        <div className="card" style={{ padding: 20 }}>
          {mode === "request" ? (
            <form onSubmit={requestReset} style={{ display: "grid", gap: 12 }}>
              <label className="field">
                <span>Email</span>
                <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </label>
              {error && <div className="message error-message">{error}</div>}
              {message && <div className="message success-message">{message}</div>}
              <button className="btn btn-gold" type="submit" disabled={loading}>{loading ? "Please wait..." : "Send reset link"}</button>
            </form>
          ) : (
            <form onSubmit={updatePassword} style={{ display: "grid", gap: 12 }}>
              <label className="field">
                <span>New Password</span>
                <input className="input" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" />
              </label>
              <label className="field">
                <span>Confirm Password</span>
                <input className="input" type="password" minLength={6} required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter new password" />
              </label>
              {error && <div className="message error-message">{error}</div>}
              {message && <div className="message success-message">{message}</div>}
              <button className="btn btn-gold" type="submit" disabled={loading}>{loading ? "Please wait..." : "Update password"}</button>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .message { 
          padding: 12px 16px; 
          border-radius: 10px; 
          font-size: 0.9rem; 
          font-weight: 600;
        }
        .error-message { 
          background: #fee2e2; 
          color: #991b1b; 
          border: 1px solid #fecaca;
        }
        .success-message { 
          background: #d1fae5; 
          color: #065f46; 
          border: 1px solid #a7f3d0;
        }
      `}</style>
    </section>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<section className="section"><div className="container" style={{ maxWidth: 520 }}><p className="muted">Loading...</p></div></section>}>
      <ResetContent />
    </Suspense>
  );
}
