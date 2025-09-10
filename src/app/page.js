"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { addItemByProductId } from "../lib/cart";

export default function Home() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [featured, setFeatured] = useState([]);
  const [featuredError, setFeaturedError] = useState("");
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const router = useRouter();

  // Navbar is globally rendered via RootLayout

  useEffect(() => {
    // Intersection Observer for fade/slide animations
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // Simple auto-play for testimonials
    const id = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Load featured products (supports snake_case is_show and camelCase isShow)
    (async () => {
      setFeaturedLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, image_url, price_naira, rating, views, is_show, is_active")
        .eq("is_show", true)
        .eq("is_active", true)
        .limit(8);
      if (error) {
        console.error("Failed to load featured products:", error);
        // Try camelCase isShow first, then fallback to any active products
        const { data: alt, error: altErr } = await supabase
          .from("products")
          .select("id, name, description, image_url, price_naira, rating, views, is_active")
          .eq("isShow", true)
          .eq("is_active", true)
          .limit(8);
        if (!altErr && alt && alt.length > 0) {
          setFeatured(alt);
          setFeaturedLoading(false);
          return;
        }
        const { data: fallback, error: fbErr } = await supabase
          .from("products")
          .select("id, name, description, image_url, price_naira, rating, views, is_show, is_active")
          .eq("is_active", true)
          .order("views", { ascending: false })
          .limit(8);
        if (fbErr) {
          setFeaturedError(error.message || "Unable to load featured products");
          setFeatured([]);
        } else {
          setFeatured(fallback || []);
        }
      } else if (!data || data.length === 0) {
        // Try camelCase isShow next
        const { data: alt2, error: alt2Err } = await supabase
          .from("products")
          .select("id, name, description, image_url, price_naira, rating, views, is_active")
          .eq("isShow", true)
          .eq("is_active", true)
          .limit(8);
        if (!alt2Err && alt2 && alt2.length > 0) {
          setFeatured(alt2);
          setFeaturedLoading(false);
          return;
        }
        // Fallback: show any active cakes if no featured flagged yet
        const { data: fallback, error: fbErr } = await supabase
          .from("products")
          .select("id, name, description, image_url, price_naira, rating, views, is_show, is_active")
          .eq("is_active", true)
          .order("views", { ascending: false })
          .limit(8);
        if (fbErr) {
          console.error("Failed to load products fallback:", fbErr);
          setFeaturedError(fbErr.message || "Unable to load products");
          setFeatured([]);
        } else {
          setFeatured(fallback || []);
        }
      } else {
        setFeatured(data || []);
      }
      setFeaturedLoading(false);
    })();
  }, []);

  function formatNaira(amount) {
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount || 0);
    } catch {
      return `₦${amount?.toLocaleString?.() ?? amount ?? 0}`;
    }
  }

  async function handleOrder(product) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=%23cakes");
      return;
    }
    try {
      await addItemByProductId(user.id, product.id, 1);
      alert(`Added '${product.name || product.title}' to cart.`);
    } catch (e) {
      alert(e?.message || "Unable to add to cart. Please try again.");
    }
  }

  const testimonials = [
    {
      quote:
        "The most exquisite cake I've ever tasted. Presentation and flavor were flawless.",
      name: "Charlotte R.",
      rating: 5,
    },
    {
      quote:
        "Elegant design and delivered perfectly on time. Our guests were impressed.",
      name: "Daniel A.",
      rating: 5,
    },
    {
      quote:
        "Refined flavors, not overly sweet, just perfect. Will be ordering again.",
      name: "Sophia L.",
      rating: 5,
    },
  ];

  return (
    <div className="luxe-page">
      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container hero-grid">
          <div className="hero-text reveal slide-up">
            <h1>Indulge in Luxury Cakes</h1>
            <p>Handcrafted, elegant, and delivered fresh.</p>
            <div className="hero-ctas">
              <a href="#cakes" className="btn btn-gold">Order Now</a>
              <a href="#menu" className="btn btn-outline">Explore Menu</a>
            </div>
          </div>
          <div className="hero-media reveal fade-in">
            <div className="hero-image-frame">
              <img src="/hero_cake.jpg" alt="Featured luxury cake" className="hero-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cakes */}
      <section id="cakes" className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Our Signature Creations</h2>
            <p className="muted">Explore customer favorites crafted to perfection.</p>
          </div>
          <div className="card-grid">
            {featuredLoading ? (
              <div className="card reveal fade-in" style={{ gridColumn: "1 / -1" }}>
                <div className="card-body">
                  <h3>Loading cakes...</h3>
                  <p className="muted">Please wait a moment.</p>
                </div>
              </div>
            ) : featured.length === 0 ? (
              <div className="card reveal fade-in" style={{ gridColumn: "1 / -1" }}>
                <div className="card-body">
                  <h3>No featured cakes yet</h3>
                  <p className="muted">
                    {featuredError
                      ? `Error: ${featuredError}`
                      : "Please add cakes in your database with is_show = true and is_active = true."}
                  </p>
                </div>
              </div>
            ) : featured.map((p) => (
              <div key={p.id} className="card">
                <div className="card-media">
                  <img src={p.image_url || "/chocolate_cake.jpg"} alt={p.name} />
                </div>
                <div className="card-body">
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ fontWeight: 700 }}>{formatNaira(p.price_naira)}</div>
                    <div className="muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{"★".repeat(Math.round(p.rating || 0))}{"☆".repeat(5 - Math.round(p.rating || 0))}</span>
                      <span style={{ fontSize: 12 }}>{(p.views || 0).toLocaleString()} views</span>
                    </div>
                  </div>
                  <button type="button" className="btn btn-gold btn-sm" onClick={() => handleOrder(p)}>
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Orders */}
      <section id="custom" className="section custom">
        <div className="container custom-grid">
          <div className="custom-title reveal slide-up">
            <h2>Your Imagination, Our Creation</h2>
          </div>
          <div className="custom-media reveal fade-in">
            <div className="image-frame">
              <img src="/custom_cake.jpg" alt="Custom cake" />
            </div>
          </div>
          <div className="custom-copy reveal slide-up">
            <p>
              From intimate celebrations to grand occasions, our master pastry chefs
              collaborate with you to craft bespoke cakes that reflect your vision.
              Choose flavors, finishes, and artistry tailored to your event.
            </p>
            <a className="btn btn-gold" href="#custom-form">Start Your Custom Order</a>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section features">
        <div className="container">
          <h2 className="section-title reveal slide-up">Why Choose Us</h2>
          <div className="feature-grid">
            <Feature icon={leafIcon()} title="Fresh Ingredients" text="Only premium, fresh ingredients for impeccable taste." />
            <Feature icon={sparkleIcon()} title="Elegant Designs" text="Refined aesthetics with meticulous attention to detail." />
            <Feature icon={truckIcon()} title="Fast Delivery" text="Handled with care and delivered on schedule." />
            <Feature icon={starIcon()} title="Premium Taste" text="Balanced flavors crafted by expert pâtissiers." />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section testimonials">
        <div className="container">
          <h2 className="section-title reveal slide-up">What Our Clients Say</h2>
          <div className="carousel">
            {testimonials.map((t, i) => (
              <article
                key={i}
                className={`slide ${i === activeTestimonial ? "active" : ""}`}
              >
                <div className="stars" aria-label={`${t.rating} star rating`}>
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <span key={idx} className="star" aria-hidden>
                      {starSolidIcon()}
                    </span>
                  ))}
                </div>
                <p className="quote">“{t.quote}”</p>
                <p className="author">— {t.name}</p>
              </article>
            ))}
            <div className="dots" role="tablist">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  className={`dot ${i === activeTestimonial ? "active" : ""}`}
                  onClick={() => setActiveTestimonial(i)}
                  aria-label={`Show testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="footer">
        <div className="container footer-grid">
          <div>
            <img src="/logo.png" alt="Virginia's Cakes and Confectionery" className="logo footer-logo" />
            <p className="muted">Luxury cakes, handcrafted with elegance.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#cakes">Cakes</a></li>
              <li><a href="#custom">Custom Orders</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul className="muted">
              <li>123 Premier Avenue, City, Country</li>
              <li>+1 (555) 123-4567</li>
              <li>hello@luxebakery.com</li>
            </ul>
          </div>
          <div>
            <h4>Follow</h4>
            <div className="socials">
              <a href="#" aria-label="Facebook" className="icon-link">{facebookIcon()}</a>
              <a href="#" aria-label="Instagram" className="icon-link">{instagramIcon()}</a>
              <a href="#" aria-label="Twitter" className="icon-link">{twitterIcon()}</a>
            </div>
          </div>
        </div>
        <div className="container copyright">
          <span>&copy; {new Date().getFullYear()} Virginia's Cakes and Confectionery. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="feature reveal fade-in">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

// Inline vector icons (no emojis)
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

function leafIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 13c7 0 9-6 16-6 0 7-6 13-13 13-1.5 0-2.5-.5-3-1 0-3 2-6 5-7" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function sparkleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M4 4l.8 2.2L7 7l-2.2.8L4 10l-.8-2.2L1 7l2.2-.8L4 4z" stroke="#1a1a1a" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

function truckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 6h11v9H2z" stroke="#1a1a1a" strokeWidth="1.6"/>
      <path d="M13 10h4l3 3v2h-7" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
      <circle cx="6" cy="18" r="1.6" fill="#1a1a1a"/>
      <circle cx="17" cy="18" r="1.6" fill="#1a1a1a"/>
    </svg>
  );
}

function starIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1.1 6.3L12 17.8 6.4 20.2l1.1-6.3L3 9.5l6.3-.9L12 3z" stroke="#1a1a1a" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

function starSolidIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1.1 6.3L12 17.8 6.4 20.2l1.1-6.3L3 9.5l6.3-.9L12 3z" fill="#C7A65A"/>
    </svg>
  );
}

function facebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8h3V5h-3c-2 0-3 .9-3 3v2H8v3h3v6h3v-6h3l1-3h-4V8c0-.7.3-1 1-1z" fill="#ffffff"/>
    </svg>
  );
}

function instagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="#ffffff" opacity="0.95"/>
      <circle cx="12" cy="12" r="4" fill="#333333"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="#333333"/>
    </svg>
  );
}

function twitterIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 7.3c-.6.3-1.2.5-1.9.6.7-.4 1.2-1 1.5-1.8-.6.4-1.4.7-2.1.8-.6-.6-1.5-1-2.4-1-1.9 0-3.4 1.5-3.4 3.4 0 .3 0 .6.1.9-2.8-.1-5.3-1.5-7-3.6-.3.5-.5 1-.5 1.7 0 1.2.6 2.2 1.5 2.8-.6 0-1.1-.2-1.6-.4 0 0 0 .1 0 .1 0 1.6 1.1 2.9 2.6 3.2-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.7 2.2 3.2 2.2-1.2.9-2.7 1.4-4.3 1.4H4c1.6 1 3.6 1.6 5.6 1.6 6.7 0 10.4-5.6 10.4-10.4v-.5c.7-.4 1.3-1 2-1.7-.7.3-1.4.5-2 .6z" fill="#ffffff"/>
    </svg>
  );
}
