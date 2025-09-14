"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

// Use the same image overrides as the homepage (except custom-cake)
const STORAGE_BASE = "https://fbjnqxtwwkoxxogtqfzv.supabase.co/storage/v1/object/public/product-images";
const CATEGORY_IMAGE_OVERRIDES = {
  "foil-cake": `${STORAGE_BASE}/foil-cakes.jfif`,
  "cupcakes": `${STORAGE_BASE}/cupcake2.jfif`,
  "bento": `${STORAGE_BASE}/bento1.jfif`,
  "cakelets": `${STORAGE_BASE}/cakelets-collection.jfif`,
  "banana-bread": `${STORAGE_BASE}/banana-bread-collections2.jfif`,
  "food-tray": `${STORAGE_BASE}/food-tray-collection.jfif`,
  "small-chops": `${STORAGE_BASE}/snack-tray.jfif`,
  "waffle": `${STORAGE_BASE}/waffles-collections.jfif`,
};

const FALLBACK_CATEGORIES = [
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

export default function CategoriesPage() {
  const [cats, setCats] = useState(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("slug, name, image_url, position")
        .order("position", { ascending: true });
      if (!error && data && data.length) {
        const mapped = data.map((c) => ({
          ...c,
          image_url:
            c.slug === "custom-cake"
              ? c.image_url || "/custom_cake.jpg"
              : CATEGORY_IMAGE_OVERRIDES[c.slug] || c.image_url,
        }));
        setCats(mapped);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Explore Our Confectioneries</h2>
        <p className="muted" style={{ textAlign: "center", marginBottom: 20 }}>
          Browse by category to find exactly what you crave.
        </p>
        {loading ? (
          <div className="card-grid">
            <div className="card skeleton" style={{ gridColumn: "1 / -1" }}>
              <div className="skeleton-media" />
              <div className="skeleton-lines"><div /><div /></div>
            </div>
          </div>
        ) : (
          <div className="card-grid">
            {cats.map((c) => (
              <Link key={c.slug} href={`/categories/${c.slug}`} className="card" style={{ overflow: "hidden" }}>
                <div className="card-media">
                  <img src={c.image_url || "/hero_cake.jpg"} alt={c.name} />
                </div>
                <div className="card-body">
                  <h3>{c.name}</h3>
                  <p>Handcrafted, premium ingredients, delivered fresh.</p>
                  <span className="btn btn-outline btn-sm" aria-hidden>
                    View {c.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
