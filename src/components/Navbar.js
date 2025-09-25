"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

export default function Navbar() {
  const navRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      if (!navRef.current) return;
      if (window.scrollY > 8) navRef.current.classList.add("nav-scrolled");
      else navRef.current.classList.remove("nav-scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const cls = "no-scroll";
    if (mobileOpen) document.body.classList.add(cls);
    else document.body.classList.remove(cls);
    return () => document.body.classList.remove(cls);
  }, [mobileOpen]);

  // Close any open overlays when route changes (prevents backdrop blocking clicks)
  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
    if (menuOpen) setMenuOpen(false);
  }, [pathname]);

  // Close profile menu on outside click or ESC
  useEffect(() => {
    function onDocClick(e) {
      if (!navRef.current) return;
      const btn = navRef.current.querySelector(".profile-btn");
      const dd = navRef.current.querySelector(".profile-dropdown");
      if (btn && btn.contains(e.target)) return;
      if (dd && dd.contains(e.target)) return;
      setMenuOpen(false);
    }
    function onKey(e) { if (e.key === "Escape") setMenuOpen(false); }
    if (menuOpen) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
    <header ref={navRef} className="navbar">
      <div className="container nav-inner">
        <div className="nav-left">
          <img src="/logo.png" alt="Virginia's Cakes and Confectionery" className="logo" onClick={() => router.push("/")} style={{ cursor: "pointer" }} />
        </div>
        <nav className="nav-center">
          <Link href="/">Home</Link>
          <Link href="/cakes">Cakes</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/custom-order">Custom Orders</Link>
          <Link href="/about">About Us</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="nav-right">
          <button className="icon-btn" aria-label="Cart" onClick={() => router.push("/cart")}>
            {cartIcon()}
          </button>
          <div className="profile-wrap">
            <button
              className={`icon-btn profile-btn ${menuOpen ? "is-open" : ""}`}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {userIcon()}
            </button>
            <div className={`profile-dropdown ${menuOpen ? "open" : ""}`} role="menu">
              <Link href="/profile" role="menuitem" className="dd-item" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link href="/transactions" role="menuitem" className="dd-item" onClick={() => setMenuOpen(false)}>Transactions</Link>
              <button
                type="button"
                role="menuitem"
                className="dd-item danger"
                onClick={async () => {
                  try {
                    const { error } = await supabase.auth.signOut();
                    if (error) throw error;
                  } catch (err) {
                    console.error("Sign out failed:", err);
                  } finally {
                    setMenuOpen(false);
                    try { router.replace("/"); router.refresh(); } catch {}
                    // Hard fallback
                    if (typeof window !== "undefined") {
                      setTimeout(() => { window.location.href = "/"; }, 50);
                    }
                  }
                }}
              >
                Sign out
              </button>
            </div>
          </div>
          <button
            className={`hamburger ${mobileOpen ? "is-open" : ""}`}
            aria-label="Toggle navigation menu"
            aria-controls="mobile-menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      <div className={`mobile-menu-backdrop ${mobileOpen ? "show" : ""}`} onClick={() => setMobileOpen(false)} />
      <nav id="mobile-menu" className={`mobile-menu ${mobileOpen ? "open" : ""}`} aria-hidden={!mobileOpen} aria-label="Mobile navigation">
        <div className="mobile-menu-header">
          <img src="/logo.png" alt="Virginia's Cakes and Confectionery" className="logo" onClick={() => { setMobileOpen(false); router.push("/"); }} />
          <button className="mobile-close" aria-label="Close menu" onClick={() => setMobileOpen(false)}>&times;</button>
        </div>
        <div className="mobile-menu-links">
          <Link className="mobile-link" href="/" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link className="mobile-link" href="/cakes" onClick={() => setMobileOpen(false)}>Cakes</Link>
          <Link className="mobile-link" href="/categories" onClick={() => setMobileOpen(false)}>Categories</Link>
          <Link className="mobile-link" href="/custom-order" onClick={() => setMobileOpen(false)}>Custom Orders</Link>
          <Link className="mobile-link" href="/about" onClick={() => setMobileOpen(false)}>About Us</Link>
          <Link className="mobile-link" href="/contact" onClick={() => setMobileOpen(false)}>Contact</Link>
        </div>
        {/* Footer CTA removed for a cleaner, non-scroll layout */}
      </nav>
    </header>
    
    <style jsx>{`
      .profile-wrap { position: relative; }
      .profile-dropdown {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        background: #fff;
        border: 1px solid #eee;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        padding: 8px;
        width: 200px;
        opacity: 0;
        transform: translateY(-6px) scale(0.98);
        pointer-events: none;
        transition: opacity 160ms ease, transform 160ms ease;
        z-index: 60;
      }
      .profile-dropdown.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      .dd-item {
        display: block;
        width: 100%;
        text-align: left;
        padding: 10px 12px;
        border-radius: 8px;
        font-weight: 600;
        color: #2b2b2b;
      }
      .dd-item:hover { background: #faf8f3; color: var(--gold-strong); }
      .dd-item.danger { color: #8b0000; }
      .dd-item.danger:hover { background: #fff2f2; color: #8b0000; }
    `}</style>
    </>
  );
}

function cartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 4h-2l-1 2" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 6h14l-2 9H7L6 6z" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="19" r="1.5" fill="#222"/>
      <circle cx="17" cy="19" r="1.5" fill="#222"/>
    </svg>
  );
}

function userIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3.5" stroke="#222" strokeWidth="1.5"/>
      <path d="M4.5 20c1.8-3.2 5-5 7.5-5s5.7 1.8 7.5 5" stroke="#222" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
