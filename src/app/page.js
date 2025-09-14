"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { addItemByProductId } from "../lib/cart";

export const dynamic = "force-dynamic";

// Currency formatter available to all components in this module
function formatNaira(amount) {
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `₦${amount?.toLocaleString?.() ?? amount ?? 0}`;
  }
}

export default function Home() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [featured, setFeatured] = useState([]);
  const [featuredError, setFeaturedError] = useState("");
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const router = useRouter();

  // Navbar is globally rendered via RootLayout

  // Testimonials data (constant)
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

  // Categories Spotlight: dynamic from DB with graceful fallback
  // Override category card images (except for custom-cake) with Supabase Storage files
  const STORAGE_BASE = "https://fbjnqxtwwkoxxogtqfzv.supabase.co/storage/v1/object/public/product-images";
  const CATEGORY_IMAGE_OVERRIDES = useMemo(() => ({
    // Do NOT override custom-cake per requirement
    "foil-cake": `${STORAGE_BASE}/foil-cakes.jfif`,
    "cupcakes": `${STORAGE_BASE}/cupcake2.jfif`,
    "bento": `${STORAGE_BASE}/bento1.jfif`,
    "cakelets": `${STORAGE_BASE}/cakelets-collection.jfif`,
    "banana-bread": `${STORAGE_BASE}/banana-bread-collections2.jfif`,
    "food-tray": `${STORAGE_BASE}/food-tray-collection.jfif`,
    // Snack tray maps to small-chops
    "small-chops": `${STORAGE_BASE}/snack-tray.jfif`,
    "waffle": `${STORAGE_BASE}/waffles-collections.jfif`,
  }), []);

  const FALLBACK_CATS = [
    { slug: "custom-cake", name: "Custom Cake", image_url: "/custom_cake.jpg" },
    { slug: "foil-cake", name: "Foil Cake", image_url: CATEGORY_IMAGE_OVERRIDES["foil-cake"] || "/redvelvet.jpg" },
    { slug: "cupcakes", name: "Cupcakes", image_url: CATEGORY_IMAGE_OVERRIDES["cupcakes"] || "/cupcakes.jpg" },
    { slug: "bento", name: "Bento", image_url: CATEGORY_IMAGE_OVERRIDES["bento"] || "/hero_cake.jpg" },
    { slug: "cakelets", name: "Cakelets", image_url: CATEGORY_IMAGE_OVERRIDES["cakelets"] || "/chocolate_cake.jpg" },
    { slug: "banana-bread", name: "Banana Bread", image_url: CATEGORY_IMAGE_OVERRIDES["banana-bread"] || "/chocolate_cake.jpg" },
    { slug: "food-tray", name: "Food Tray", image_url: CATEGORY_IMAGE_OVERRIDES["food-tray"] || "/wedding_cake.jpg" },
    { slug: "small-chops", name: "Small Chops", image_url: CATEGORY_IMAGE_OVERRIDES["small-chops"] || "/cupcakes.jpg" },
    { slug: "waffle", name: "Waffle", image_url: CATEGORY_IMAGE_OVERRIDES["waffle"] || "/hero_cake.jpg" },
  ];
  const [cats, setCats] = useState(FALLBACK_CATS);
  const [catsLoading, setCatsLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("slug, name, image_url, position")
        .order("position", { ascending: true });
      if (!error && data && data.length) {
        // Apply image overrides by slug, but keep custom-cake as-is
        const mapped = data.map((c) => ({
          ...c,
          image_url:
            c.slug === "custom-cake"
              ? c.image_url || "/custom_cake.jpg"
              : CATEGORY_IMAGE_OVERRIDES[c.slug] || c.image_url,
        }));
        setCats(mapped);
      }
      setCatsLoading(false);
    })();
  }, [CATEGORY_IMAGE_OVERRIDES]);

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
  }, [testimonials.length]);

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

  

  return (
    <div className="luxe-page">
      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container hero-grid">
          <div className="hero-text reveal slide-up">
            <div className="badge">Since 2010 • Award‑Winning Pâtisserie</div>
            <h1 className="gradient-text">Virginia Cakes & Confectionery</h1>
            <p>Handcrafted with premium ingredients and refined artistry. Delivered fresh, right on time.</p>
            <div className="hero-ctas">
              <a href="#cakes" className="btn btn-gold" aria-label="Order cakes now">Order Now</a>
              <a href="#custom" className="btn btn-outline" aria-label="Explore custom cake options">Custom Orders</a>
            </div>
            <ul className="trust">
              <li>Trusted by 5k+ celebrants</li>
              <li>Freshly baked daily</li>
              <li>Secure checkout</li>
            </ul>
          </div>
          <div className="hero-media reveal fade-in">
            <div className="hero-image-frame">
              <img src="/hero_cake.jpg" alt="Featured luxury cake" className="hero-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Spotlight */}
      <section className="section categories-spotlight">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          <p className="muted" style={{ textAlign: "center", marginBottom: 20 }}>
            Explore our full range of indulgent treats beyond cakes.
          </p>
          {catsLoading ? (
            <div className="card-grid">
              <div className="card skeleton" style={{ gridColumn: "1 / -1" }}>
                <div className="skeleton-media" />
                <div className="skeleton-lines"><div /><div /></div>
              </div>
            </div>
          ) : (
            <div className="card-grid">
              {cats.map((c) => (
                <Link key={c.slug} href={`/categories/${c.slug}`} className="card">
                  <div className="card-media"><img src={c.image_url || "/hero_cake.jpg"} alt={c.name} /></div>
                  <div className="card-body">
                    <h3>{c.name}</h3>
                    <p>Discover our {c.name.toLowerCase()} selection.</p>
                    <span className="btn btn-outline btn-sm">Explore</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link className="btn btn-gold" href="/categories">View all categories</Link>
          </div>
        </div>
      </section>

      {/* Signature Creations (Rebuilt) */}
      <section id="cakes" className="section signature">
        <div className="container">
          <div className="signature-head reveal slide-up">
            <h2 className="section-title">Our Signature Creations</h2>
            <p className="muted">Elevated favorites, perfected by our pâtissiers.</p>
          </div>
          {featuredLoading ? (
            <div className="sig-grid">
              <div className="sig-card skeleton" style={{ gridColumn: "1 / -1" }}>
                <div className="skeleton-media" />
                <div className="skeleton-lines">
                  <div />
                  <div />
                </div>
              </div>
            </div>
          ) : featured.length === 0 ? (
            <div className="sig-grid">
              <div className="sig-card" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
                <div className="sig-body">
                  <h3>No featured cakes yet</h3>
                  <p className="muted">
                    {featuredError
                      ? `Error: ${featuredError}`
                      : "Please add cakes in your database with is_show = true and is_active = true."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="sig-grid">
              {/* Highlight primary card */}
              {featured[0] && (
                <SignatureCard key={featured[0].id} product={featured[0]} variant="lg" onOrder={handleOrder} />
              )}
              {/* Supporting cards */}
              {featured.slice(1, 8).map((p) => (
                <SignatureCard key={p.id} product={p} onOrder={handleOrder} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Custom Orders */}
      <section id="custom" className="section custom">
        <div className="container custom-grid">
          <div className="custom-title reveal slide-up">
            <h2 className="section-title">Your Imagination, Our Creation</h2>
          </div>
          <div className="custom-media reveal fade-in">
            <div className="image-frame">
              <img src="/custom_cake.jpg" alt="Custom cake" />
            </div>
          </div>
          <div className="custom-copy reveal slide-up">
            <p>
              From intimate celebrations to grand occasions, our maîtres pâtissiers craft one‑of‑a‑kind cakes that tell your story — flavors balanced to perfection and finishes tailored to your theme.
            </p>
            <ul className="assurances">
              <li>Design mockups and expert guidance</li>
              <li>Premium ingredients; never overly sweet</li>
              <li>Careful delivery and onsite setup</li>
            </ul>
            <ol className="process">
              <li>
                <div className="num">1</div>
                <div>
                  <h4>Consult</h4>
                  <p>Share your vision, colors, servings, and date. We’ll align on style and budget.</p>
                </div>
              </li>
              <li>
                <div className="num">2</div>
                <div>
                  <h4>Design</h4>
                  <p>Receive a visual concept and flavor pairing recommendations from our team.</p>
                </div>
              </li>
              <li>
                <div className="num">3</div>
                <div>
                  <h4>Create & Deliver</h4>
                  <p>Baked fresh, finished with precision, and delivered on schedule.</p>
                </div>
              </li>
            </ol>
            <div className="custom-ctas">
              <Link className="btn btn-gold" href="/custom-order">Start Your Custom Order</Link>
              <Link className="btn btn-outline" href="/contact">Talk to a Specialist</Link>
            </div>
            <p className="micro muted">Average lead time: 5–7 days • Rush available</p>
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
            <p className="muted">Handcrafted cakes and confectionery with elegance.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#cakes">Cakes</a></li>
              <li><Link href="/categories">Categories</Link></li>
              <li><a href="#custom">Custom Orders</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul className="muted">
              <li>123 Premier Avenue, City, Country</li>
              <li>+234 708 345 3202</li>
              <li>support@virginiascakes.com</li>
            </ul>
          </div>
          <div>
            <h4>Follow</h4>
            <div className="socials">
              <a href="https://www.instagram.com/virginiascakesandconfectionery?igsh=YWRoY2hsMG1zcmZ1" target="_blank" rel="noopener noreferrer" aria-label="Instagram: virginiascakesandconfectionery" className="icon-link">{instagramIcon()}</a>
              <a href="https://www.instagram.com/cakegospel?igsh=MWtpZXBjMTVuaHJrZQ==" target="_blank" rel="noopener noreferrer" aria-label="Instagram: cakegospel" className="icon-link">{instagramIcon()}</a>
              <a href="https://www.tiktok.com/@virginiascakescon?_t=ZS-8ziyyg9eYpV&_r=1" target="_blank" rel="noopener noreferrer" aria-label="TikTok: virginiascakescon" className="icon-link">{tiktokIcon()}</a>
            </div>
          </div>
        </div>
        <div className="container copyright">
          <span>&copy; {new Date().getFullYear()} Virginia Cakes &amp; Confectionery. All rights reserved.</span>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div className="mobile-cta" aria-hidden="true">
        <a href="#cakes" className="btn btn-gold btn-sm">Order Now</a>
        <a href="#custom" className="btn btn-outline btn-sm">Custom Cake</a>
      </div>
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

function ratingStars(rating = 0) {
  const full = Math.round(rating);
  const empty = 5 - full;
  return `${"★".repeat(full)}${"☆".repeat(empty)}`;
}

function SignatureCard({ product, variant = "sm", onOrder }) {
  const price = product?.price_naira;
  const img = product?.image_url || "/chocolate_cake.jpg";
  return (
    <article className={`sig-card ${variant === "lg" ? "lg" : ""}`}> 
      <div className="sig-media">
        <img
          src={img}
          alt={product?.name}
          loading="lazy"
          decoding="async"
          sizes="(max-width: 720px) 80vw, (max-width: 1100px) 40vw, 520px"
        />
        <div className="sig-gradient" aria-hidden="true" />
        <span className="price-pill">{price != null ? formatNaira(price) : ""}</span>
        <button
          type="button"
          className="btn btn-gold btn-sm order-on-media"
          onClick={() => onOrder?.(product)}
          aria-label={`Order ${product?.name}`}
        >
          Order
        </button>
      </div>
      <div className="sig-body">
        <h3 className="sig-title">{product?.name}</h3>
        <p className="sig-desc">{product?.description}</p>
        <div className="sig-meta">
          <span className="sig-rating">{ratingStars(product?.rating || 0)}</span>
          <span className="sig-views muted">{(product?.views || 0).toLocaleString()} views</span>
        </div>
        <div className="sig-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onOrder?.(product)}>Order Now</button>
        </div>
      </div>
    </article>
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

function tiktokIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 3v3.2c0 2.9 2.4 5.3 5.3 5.3h.7v3.1c-1.9-.1-3.7-.8-5.2-1.9v4.9c0 3-2.4 5.4-5.4 5.4S4.5 20.6 4.5 17.6s2.4-5.4 5.4-5.4c.5 0 1 .1 1.5.2v3.2c-.4-.2-.9-.3-1.5-.3-1.7 0-3.1 1.4-3.1 3.1S8.2 21.5 9.9 21.5s3.1-1.4 3.1-3.1V3h1.5z" fill="#ffffff"/>
    </svg>
  );
}
