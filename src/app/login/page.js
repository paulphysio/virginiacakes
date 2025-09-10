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
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (!fullName.trim()) {
          throw new Error("Please enter your full name");
        }
        const { error } = await supabase.auth.signUp({
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
      }
      const next = search.get("next");
      router.replace(next || "/");
    } catch (err) {
      setError(err?.message || "Authentication failed");
    } finally {
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
              {error && <div className="error">{error}</div>}

              <button className="btn btn-gold submit" type="submit" disabled={loading}>
                {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            {mode === "signin" && (
              <div className="aux-actions">
                <a className="link-like" href="/reset">Forgot your password?</a>
              </div>
            )}

            <div className="oauth">
              <div className="oauth-sep"><span>or continue with</span></div>
              <div className="oauth-buttons">
                <button
                  type="button"
                  className="oauth-btn"
                  onClick={async () => {
                    const next = search.get("next") || "/";
                    await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: { redirectTo: window.location.origin + next },
                    });
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg" aria-hidden><path fill="#EA4335" d="M255.68 133.5c0-10.6-.86-18.35-2.72-26.38H130.55v47.8h71.87c-1.45 11.9-9.3 29.8-26.7 41.86l-.24 1.6 38.78 30 2.69.27c24.65-22.77 38.73-56.27 38.73-95.15"/><path fill="#34A853" d="M130.55 261.1c35.15 0 64.72-11.6 86.3-31.58l-41.12-31.8c-11.03 7.7-25.9 13.07-45.18 13.07-34.53 0-63.83-22.75-74.28-54.27l-1.53.13-40.23 31.17-.53 1.46C35.23 231.9 79.96 261.1 130.55 261.1"/><path fill="#4A90E2" d="M56.27 156.52c-2.8-8.03-4.42-16.6-4.42-25.52 0-8.9 1.62-17.48 4.28-25.5l-.07-1.71-40.7-31.54-1.33.63C4.55 89.1 0 108.5 0 130.99c0 22.5 4.55 41.9 13.03 58.09l43.24-32.56"/><path fill="#FBBC05" d="M130.55 50.46c24.45 0 41 10.57 50.42 19.4l36.8-35.87C195.2 12.84 165.7 0 130.55 0 79.96 0 35.23 29.2 13.73 72.9l43.31 32.56c10.5-31.52 39.8-54.99 73.51-54.99"/></svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  className="oauth-btn"
                  onClick={async () => {
                    const next = search.get("next") || "/";
                    await supabase.auth.signInWithOAuth({
                      provider: "apple",
                      options: { redirectTo: window.location.origin + next },
                    });
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden><path d="M17.57 12.84c-.02-2.1 1.72-3.11 1.8-3.16-1-1.47-2.54-1.67-3.08-1.69-1.31-.14-2.56.77-3.22.77-.66 0-1.69-.75-2.78-.73-1.43.02-2.74.84-3.47 2.12-1.48 2.55-.38 6.31 1.06 8.38.7 1 1.52 2.12 2.61 2.09 1.06-.04 1.46-.67 2.74-.67s1.65.67 2.78.65c1.15-.02 1.88-1.02 2.58-2.02.81-1.17 1.15-2.31 1.17-2.37-.02-.01-2.25-.86-2.27-3.37zM15.5 5.92c.58-.7.97-1.68.86-2.65-.83.03-1.85.55-2.45 1.24-.54.62-1.01 1.61-.88 2.56.93.07 1.89-.47 2.47-1.15z" fill="#000"/></svg>
                  <span>Apple</span>
                </button>
              </div>
            </div>

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
        .error { color: #b00020; font-size: 0.9rem; }
        .submit { width: 100%; margin-top: 4px; }
        .switch { margin-top: 10px; font-size: 0.95rem; }
        .link-like { background: none; border: none; color: var(--gold-strong); font-weight: 600; cursor: pointer; }
        .link-like:hover { color: var(--gold); }

        .aux-actions { margin-top: 10px; }
        .oauth { margin-top: 18px; }
        .oauth-sep { display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px; align-items: center; color: #777; font-size: 0.9rem; }
        .oauth-sep::before, .oauth-sep::after { content: ""; height: 1px; background: #eee; display: block; }
        .oauth-buttons { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .oauth-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid #e5e5e5; border-radius: 10px; background: #fff; padding: 10px 12px; font-weight: 600; }
        .oauth-btn:hover { border-color: #d9d9d9; }

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
