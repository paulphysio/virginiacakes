"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { addItemByProductId } from "../../../lib/cart";

const CATEGORY_MAP = {
  "custom-cake": { name: "Custom Cake", fallbackImage: "/custom_cake.jpg" },
  "foil-cake": { name: "Foil Cake", fallbackImage: "/redvelvet.jpg" },
  "cupcakes": { name: "Cupcakes", fallbackImage: "/cupcakes.jpg" },
  "bento": { name: "Bento", fallbackImage: "/hero_cake.jpg" },
  "cakelets": { name: "Cakelets", fallbackImage: "/chocolate_cake.jpg" },
  "banana-bread": { name: "Banana Bread", fallbackImage: "/chocolate_cake.jpg" },
  "food-tray": { name: "Food Tray", fallbackImage: "/wedding_cake.jpg" },
  "small-chops": { name: "Small Chops", fallbackImage: "/cupcakes.jpg" },
  "waffle": { name: "Waffle", fallbackImage: "/hero_cake.jpg" },
};

function formatNaira(amount) {
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `₦${amount?.toLocaleString?.() ?? amount ?? 0}`;
  }
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;
  const meta = CATEGORY_MAP[slug] || { name: slug?.replace(/-/g, " ") ?? "Category", fallbackImage: "/hero_cake.jpg" };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      // Try common category fields with graceful fallbacks
      const tryQueries = [
        { col: "category_slug", val: slug },
        { col: "category", val: meta.name },
        { col: "type", val: meta.name },
      ];

      let results = [];
      for (const q of tryQueries) {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, description, image_url, price_naira, rating, views, is_active")
          .eq("is_active", true)
          .eq(q.col, q.val)
          .limit(50);
        if (!error && data && data.length) { results = data; break; }
      }

      // Final fallback: search name contains key words
      if (!results.length) {
        const keyword = (meta.name || slug).split(" ")[0];
        const { data } = await supabase
          .from("products")
          .select("id, name, description, image_url, price_naira, rating, views, is_active")
          .eq("is_active", true)
          .ilike("name", `%${keyword}%`)
          .limit(50);
        if (data) results = data;
      }

      setItems(results || []);
      setLoading(false);
    })();
  }, [slug, meta.name]);

  async function handleOrder(p) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push(`/login?next=/categories/${slug}`);
    await addItemByProductId(user.id, p.id, 1);
    alert(`Added '${p.name}' to cart.`);
  }

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">{meta.name}</h2>
        {loading ? (
          <div className="card" style={{ padding: 20, textAlign: "center" }}>Loading...</div>
        ) : items.length ? (
          <div className="card-grid">
            {items.map((c) => (
              <div key={c.id} className="card">
                <div className="card-media">
                  <img src={c.image_url || meta.fallbackImage} alt={c.name} />
                </div>
                <div className="card-body">
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ fontWeight: 700 }}>{formatNaira(c.price_naira)}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{(c.views || 0).toLocaleString()} views</div>
                  </div>
                  <button className="btn btn-gold btn-sm" onClick={() => handleOrder(c)}>Order Now</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "center" }}>
              <img src={meta.fallbackImage} alt={meta.name} style={{ width: "100%", borderRadius: 12 }} />
              <div>
                <h3 style={{ marginBottom: 8 }}>No items yet</h3>
                <p className="muted">We are updating our {meta.name.toLowerCase()} menu. Please check back soon.</p>
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href="/categories" className="btn btn-outline btn-sm">Browse other categories</Link>
                  <Link href="/custom-order" className="btn btn-gold btn-sm">Request Custom</Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
