"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mode, setMode] = useState("signin"); // or "signup"
  const search = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const next = search.get("next");
    // If already authenticated, redirect
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(next || "/");
    });
  }, [router, search]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSuccess("Signed in successfully! Redirecting...");
        const next = search.get("next");
        setTimeout(() => router.replace(next || "/"), 500);
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (!fullName.trim()) {
          throw new Error("Please enter your full name");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone,
            },
          },
        });
        if (error) throw error;
        
        // Check if email confirmation is required
        if (data?.user && !data.session) {
          setSuccess("Account created! Please check your email to verify your account.");
          setLoading(false);
          return;
        }
        
        setSuccess("Account created successfully! Redirecting...");
        const next = search.get("next");
        setTimeout(() => router.replace(next || "/"), 500);
      }
    } catch (err) {
      setError(err?.message || "Authentication failed");
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="container">
        <div className="auth-card">
          {/* Brand panel */}
          <aside className="brand-panel">
            <div className="brand-inner">
              <img src="/logo.png" alt="Virginia's Cakes and Confectionery" className="brand-logo" />
              <h1 className="brand-title">Virginia&apos;s Cakes and Confectionery</h1>
              <p className="brand-tag">Luxury cakes, handcrafted with elegance.</p>
            </div>
          </aside>

          {/* Form panel */}
          <main className="form-panel">
            <div className="form-head">
              <h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
              <p className="muted">
                {mode === "signin"
                  ? "Sign in to continue your order."
                  : "Join us to place custom orders and manage your cart."}
              </p>
            </div>

            <form onSubmit={onSubmit} className="auth-form">
              {mode === "signup" && (
                <label className="field">
                  <span>Full Name</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input"
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </label>
              )}
              {mode === "signup" && (
                <label className="field">
                  <span>Phone</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                    placeholder="Optional"
                    autoComplete="tel"
                  />
                </label>
              )}
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Your password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </label>
              {mode === "signup" && (
                <label className="field">
                  <span>Confirm Password</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />
                </label>
              )}
              {error && <div className="message error-message">{error}</div>}
              {success && <div className="message success-message">{success}</div>}

              <button className="btn btn-gold submit" type="submit" disabled={loading}>
                {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            {mode === "signin" && (
              <div className="aux-actions">
                <a className="link-like" href="/reset">Forgot your password?</a>
              </div>
            )}

            <div className="switch">
              {mode === "signin" ? (
                <span>
                  New here?{" "}
                  <button className="link-like" onClick={() => setMode("signup")} type="button">
                    Create an account
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button className="link-like" onClick={() => setMode("signin")} type="button">
                    Sign in
                  </button>
                </span>
              )}
            </div>
          </main>
        </div>
      </div>

      <style jsx>{`
        .auth-wrap {
          min-height: 100vh;
          background: linear-gradient(180deg, #fff 0%, #fff 60%, var(--pink) 100%);
          display: grid;
          align-items: center;
          padding: 60px 0;
        }
        .auth-card {
          background: #fff;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          overflow: hidden;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
        }
        .brand-panel {
          background: linear-gradient(135deg, #fff, var(--pink));
          display: grid;
          place-items: center;
          padding: 40px 24px;
        }
        .brand-inner { text-align: center; max-width: 480px; }
        .brand-logo { height: 54px; width: auto; margin-bottom: 14px; }
        .brand-title { font-size: 1.4rem; margin-bottom: 6px; }
        .brand-tag { color: #555; }

        .form-panel { padding: 36px 28px; display: grid; align-content: start; gap: 16px; }
        .form-head h2 { margin: 0; }
        .auth-form { display: grid; gap: 14px; margin-top: 6px; }
        .field { display: grid; gap: 6px; }
        .field > span { font-weight: 600; font-size: 0.95rem; }
        .input {
          width: 100%;
          border: 1px solid #e5e5e5;
          border-radius: 10px;
          padding: 12px 12px;
          outline: none;
          transition: border-color 160ms ease, box-shadow 160ms ease;
          background: #fff;
        }
        .input:focus { border-color: var(--gold-strong); box-shadow: 0 0 0 3px rgba(199,166,90,0.12); }
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
        .submit { width: 100%; margin-top: 4px; }
        .switch { margin-top: 10px; font-size: 0.95rem; }
        .link-like { background: none; border: none; color: var(--gold-strong); font-weight: 600; cursor: pointer; }
        .link-like:hover { color: var(--gold); }

        .aux-actions { margin-top: 10px; }

        @media (max-width: 900px) {
          .auth-card { grid-template-columns: 1fr; }
          .brand-panel { padding: 26px 18px; }
          .form-panel { padding: 26px 18px; }
          .brand-logo { height: 46px; }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 20 }}><p className="muted">Loading...</p></div>}>
      <LoginContent />
    </Suspense>
  );
}
