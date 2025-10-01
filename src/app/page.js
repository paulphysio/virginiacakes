"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { addItemByProductId } from "../lib/cart";

const MobileCTA = () => {
  const [mounted, setMounted] = useState(false);
  const ctaRef = useRef(null);
  
  useEffect(() => { 
    setMounted(true); 
  }, []);
  
  // Ensure CTA stays visible on mobile - prevent any scroll hiding
  useEffect(() => {
    if (!mounted || !ctaRef.current) return;
    const cta = ctaRef.current;
    
    // Force visibility on mobile
    const ensureVisible = () => {
      if (window.innerWidth <= 1024) {
        cta.style.display = 'flex';
        cta.style.position = 'fixed';
        cta.style.bottom = '0';
        cta.style.left = '0';
        cta.style.right = '0';
        cta.style.zIndex = '1200';
        cta.style.visibility = 'visible';
        cta.style.opacity = '1';
      }
    };
    
    ensureVisible();
    window.addEventListener('scroll', ensureVisible, { passive: true });
    window.addEventListener('resize', ensureVisible, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', ensureVisible);
      window.removeEventListener('resize', ensureVisible);
    };
  }, [mounted]);
  
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(
    <div ref={ctaRef} className="mobile-cta" aria-hidden="true">
      <a href="#cakes" className="btn btn-primary">Order Now</a>
      <Link href="/custom-order" className="btn btn-outline">Custom Cake</Link>
    </div>,
    document.body
  );
};
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

  // Normalize featured list for rendering
  const displayProds = useMemo(() => Array.isArray(featured) ? featured : [], [featured]);

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
  const DISPLAY_ORDER = useMemo(() => [
    "foil-cake",
    "bento",
    "cupcakes",
    "banana-bread",
    "food-tray",
  ], []);
  const NAME_MAP = useMemo(() => ({
    "foil-cake": "Foil Cake",
    "bento": "Bento",
    "cupcakes": "Cupcakes",
    "banana-bread": "Banana Bread",
    "food-tray": "Food Tray",
    "waffle": "Waffle",
  }), []);
  // Simple category list for Shop by Category section
  const displayCats = useMemo(() => (
    DISPLAY_ORDER.map((slug) => ({
      slug,
      name: NAME_MAP[slug] || slug,
      image_url: CATEGORY_IMAGE_OVERRIDES[slug] || "/hero_cake.jpg",
    }))
  ), [DISPLAY_ORDER, NAME_MAP, CATEGORY_IMAGE_OVERRIDES]);

  // Carousel functionality
  const carouselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [catSlidesPerView, setCatSlidesPerView] = useState(1);

  // Signature Creations carousel
  const sigCarouselRef = useRef(null);
  const [sigIndex, setSigIndex] = useState(0);
  const [sigAuto, setSigAuto] = useState(true);
  const [sigSlidesPerView, setSigSlidesPerView] = useState(1);

  // Responsive slides per view for Signature carousel
  useEffect(() => {
    const updateSpv = () => {
      if (typeof window === 'undefined') return;
      const spv = window.innerWidth >= 1024 ? 3 : 1;
      setSigSlidesPerView(spv);
      setCatSlidesPerView(spv);
    };
    updateSpv();
    window.addEventListener('resize', updateSpv);
    return () => window.removeEventListener('resize', updateSpv);
  }, []);

  // Auto-scroll categories by page every 3s
  useEffect(() => {
    if (!isAutoPlaying) return;
    if (displayCats.length <= catSlidesPerView) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(displayCats.length - catSlidesPerView, 0);
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, displayCats.length, catSlidesPerView]);

  // Handle manual navigation
  const goToSlide = (index) => {
    const maxIndex = Math.max(displayCats.length - catSlidesPerView, 0);
    let next = index;
    if (index > maxIndex) next = 0;
    if (index < 0) next = maxIndex;
    setCurrentIndex(next);
    setIsAutoPlaying(false);
    // Resume autoplay after 5 seconds
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const nextSlide = () => {
    goToSlide((currentIndex + 1) % displayCats.length);
  };

  const prevSlide = () => {
    goToSlide(currentIndex === 0 ? displayCats.length - 1 : currentIndex - 1);
  };

  // Signature carousel controls
  const sigGoTo = (index) => {
    const count = displayProds.length;
    const maxIndex = Math.max(count - sigSlidesPerView, 0);
    const clamped = Math.min(Math.max(index, 0), maxIndex);
    setSigIndex(clamped);
    setSigAuto(false);
    // Resume autoplay after 5s
    setTimeout(() => setSigAuto(true), 5000);
  };

  const sigNext = () => sigGoTo(sigIndex + 1);
  const sigPrev = () => sigGoTo(sigIndex - 1);

  // Signature autoplay
  useEffect(() => {
    if (!sigAuto || displayProds.length <= sigSlidesPerView) return;
    const id = setInterval(() => {
      setSigIndex((i) => {
        const maxIndex = Math.max(displayProds.length - sigSlidesPerView, 0);
        return i >= maxIndex ? 0 : i + 1;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [sigAuto, displayProds.length, sigSlidesPerView]);
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
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    // Observe all current reveal elements (handles elements added after loading completes)
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [catsLoading, featuredLoading]);

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
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cart:updated'));
        }
      } catch {}
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
            <div className="badge">Winner • Bakers’ Choice Easter Bake‑Off Challenge</div>
            <h1 className="gradient-text hero-title">Virginia Cakes & Confectionery</h1>
            <p>Handcrafted with premium ingredients and refined artistry. Delivered fresh, right on time.</p>
            <div className="hero-ctas">
              <a href="#cakes" className="btn btn-primary btn-lg" aria-label="Order cakes now">Order Now</a>
              <Link href="/custom-order" className="btn btn-outline btn-lg" aria-label="Explore custom cake options">Custom Orders</Link>
            </div>
            <ul className="trust">
              <li>Trusted by 5k+ celebrants</li>
              <li>Freshly baked daily</li>
              <li>Secure checkout</li>
            </ul>
          </div>
          <div className="hero-media reveal slide-left">
            <div className="hero-image-frame">
              <img src="/hero_cake.jpg" alt="Featured luxury cake" className="hero-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Spotlight */}
      <section className="section categories-spotlight">
        <div className="container">
          <h2 className="section-title reveal slide-up">Shop by Category</h2>
          <p className="text-large reveal slide-up" style={{ textAlign: "center", marginBottom: "var(--space-xl)", color: "var(--foreground-secondary)" }}>
            Explore our full range of indulgent treats beyond cakes.
          </p>
          {catsLoading && displayCats.length === 0 ? (
            <div className="card-grid">
              <div className="card skeleton" style={{ gridColumn: "1 / -1" }}>
                <div className="skeleton-media" />
                <div className="skeleton-lines"><div /><div /></div>
              </div>
            </div>
          ) : (
            <div className="carousel-container categories-carousel">
              <div className="carousel-wrapper" ref={carouselRef}>
                <div 
                  className="carousel-track" 
                  style={{ transform: `translateX(-${currentIndex * (100 / catSlidesPerView)}%)` }}
                >
                  {displayCats.map((c) => (
                    <div key={c.slug} className="carousel-slide">
                      <Link href={`/categories/${c.slug}`} className="card reveal fade-in">
                        <div className="card-media">
                          <img src={c.image_url || "/hero_cake.jpg"} alt={c.name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/hero_cake.jpg"; }} />
                        </div>
                        <div className="card-body">
                          <h3>{c.name}</h3>
                          <p>Discover our {c.name.toLowerCase()} selection.</p>
                          <span className="btn btn-primary btn-sm">Explore</span>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              <button className="carousel-btn carousel-btn-prev" aria-label="Previous categories" onClick={() => goToSlide(currentIndex - 1)}>
                ‹
              </button>
              <button className="carousel-btn carousel-btn-next" aria-label="Next categories" onClick={() => goToSlide(currentIndex + 1)}>
                ›
              </button>
              
              {/* Dots indicator (page-based) */}
              <div className="carousel-dots">
                {Array.from({ length: Math.max(displayCats.length - catSlidesPerView + 1, 1) }).map((_, i) => (
                  <button
                    key={i}
                    className={`carousel-dot ${i === currentIndex ? 'active' : ''}`}
                    onClick={() => goToSlide(i)}
                    aria-label={`Go to categories page ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
          <div style={{ textAlign: "center", marginTop: "var(--space-xl)" }} className="reveal slide-up">
            <Link className="btn btn-gold btn-lg" href="/categories">View all categories</Link>
          </div>
        </div>
      </section>

      {/* Signature Creations */}
      <section id="cakes" className="section signature-creations">
        <div className="container">
          <div className="signature-head">
            <h2 className="section-title reveal slide-up">Signature Creations</h2>
            <p className="text-large reveal slide-up" style={{ textAlign: "center", marginBottom: "var(--space-xl)", color: "var(--foreground-secondary)" }}>
              Handcrafted masterpieces for life&#39;s most precious moments.
            </p>
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
            <div className="carousel-container signature-creations">
              <div className="carousel-wrapper" ref={sigCarouselRef}>
                <div 
                  className="carousel-track" 
                  style={{ transform: `translateX(-${sigIndex * (100 / sigSlidesPerView)}%)` }}
                >
                  {displayProds.map((p, idx) => (
                    <div key={p.id} className="carousel-slide">
                      <SignatureCard product={p} isLarge={idx < 2} onOrder={handleOrder} />
                    </div>
                  ))}
                </div>
              </div>
              <button className="carousel-btn carousel-btn-prev" aria-label="Previous" onClick={sigPrev}>
                ‹
              </button>
              <button className="carousel-btn carousel-btn-next" aria-label="Next" onClick={sigNext}>
                ›
              </button>
              <div className="carousel-dots">
                {Array.from({ length: Math.max(displayProds.length - sigSlidesPerView + 1, 1) }).map((_, i) => (
                  <button 
                    key={i} 
                    className={`carousel-dot ${i === sigIndex ? 'active' : ''}`} 
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => sigGoTo(i)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bespoke Creations */}
      <section className="section bespoke-section">
        <div className="container-wide">
          <div className="bespoke-wrapper">
            {/* Left Column - Visual Showcase */}
            <div className="showcase-column reveal slide-left">
              <div className="showcase-header">
                <span className="showcase-label">From Thought to Taste</span>
                <h2>Artistry Meets <br />Culinary Excellence</h2>
              </div>
              
              <div className="visual-grid">
                <div className="main-visual">
                  <img 
                    src="/wedding_cake.jpg" 
                    alt="Bespoke cake artistry" 
                    onError={(e) => { 
                      e.currentTarget.onerror = null; 
                      e.currentTarget.src = "/hero_cake.jpg"; 
                    }}
                  />
                </div>
                <div className="accent-visuals">
                  <div className="accent-item">
                    <img 
                      src="/chocolate_cake.jpg" 
                      alt="Detail work" 
                      onError={(e) => { 
                        e.currentTarget.onerror = null; 
                        e.currentTarget.src = "/hero_cake.jpg"; 
                      }}
                    />
                  </div>
                  <div className="accent-item">
                    <img 
                      src="/redvelvet.jpg" 
                      alt="Finishing touches" 
                      onError={(e) => { 
                        e.currentTarget.onerror = null; 
                        e.currentTarget.src = "/hero_cake.jpg"; 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="content-column reveal slide-right">
              <div className="content-inner">
                <p className="lead-text">
                  Transform your vision into an edible masterpiece. Our master pâtissiers collaborate 
                  with you to design exceptional cakes that serve as centerpieces for life&#39;s most 
                  significant moments.
                </p>

                <div className="expertise-grid">
                  <div className="expertise-item">
                    <div className="expertise-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div>
                      <h4>Master Craftsmanship</h4>
                      <p>Winner • Bakers’ Choice Easter Bake‑Off Challenge</p>
                    </div>
                  </div>

                  <div className="expertise-item">
                    <div className="expertise-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v6m11-6h-6m-6 0H1"/>
                      </svg>
                    </div>
                    <div>
                      <h4>Precision Engineering</h4>
                      <p>Structural integrity meets artistic vision</p>
                    </div>
                  </div>

                  <div className="expertise-item">
                    <div className="expertise-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
                        <line x1="16" y1="8" x2="2" y2="22"/>
                        <line x1="17.5" y1="15" x2="9" y2="15"/>
                      </svg>
                    </div>
                    <div>
                      <h4>Collaborative Design</h4>
                      <p>Your concept refined through expert consultation</p>
                    </div>
                  </div>
                </div>

                <div className="process-timeline">
                  <h3>Our Approach</h3>
                  <div className="timeline-items">
                    <div className="timeline-item">
                      <span className="timeline-marker">01</span>
                      <div className="timeline-content">
                        <h5>Discovery & Consultation</h5>
                        <p>In-depth discussion of your vision, event details, and design preferences</p>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <span className="timeline-marker">02</span>
                      <div className="timeline-content">
                        <h5>Concept Development</h5>
                        <p>Detailed sketches, flavor profiles, and structural planning</p>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <span className="timeline-marker">03</span>
                      <div className="timeline-content">
                        <h5>Artisan Creation</h5>
                        <p>Meticulous handcrafting using premium ingredients and techniques</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cta-section">
                  <Link href="/custom-order" className="btn-primary-elegant">
                    Begin Your Commission
                  </Link>
                  <div className="consultation-note">
                    <span>Complimentary consultation</span>
                    <span>•</span>
                    <span>14-day minimum lead time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section features">
        <div className="container">
          <h2 className="section-title reveal slide-up">Why Choose Us</h2>
          <div className="feature-grid">
            <div className="reveal slide-up"><Feature icon={leafIcon()} title="Fresh Ingredients" text="Only premium, fresh ingredients for impeccable taste." /></div>
            <div className="reveal slide-up"><Feature icon={sparkleIcon()} title="Elegant Designs" text="Refined aesthetics with meticulous attention to detail." /></div>
            <div className="reveal slide-up"><Feature icon={truckIcon()} title="Fast Delivery" text="Handled with care and delivered on schedule." /></div>
            <div className="reveal slide-up"><Feature icon={starIcon()} title="Premium Taste" text="Balanced flavors crafted by expert pâtissiers." /></div>
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
              <li><Link href="/custom-order">Custom Orders</Link></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul className="muted">
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

      {/* Mobile Sticky CTA (rendered via portal to avoid layout/scroll quirks) */}
      <MobileCTA />
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="feature">
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

