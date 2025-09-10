"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { addItemByProductId } from "../../lib/cart";

export default function CakesPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, image_url, price_naira, rating, views, is_active")
        .eq("is_active", true)
        .order("views", { ascending: false })
        .limit(24);
      if (!error && data) setProducts(data);
    })();
  }, []);

  function formatNaira(amount) {
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount || 0);
    } catch {
      return `₦${amount?.toLocaleString?.() ?? amount ?? 0}`;
    }
  }

  async function handleOrder(p) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login?next=/cakes");
    await addItemByProductId(user.id, p.id, 1);
    alert(`Added '${p.name}' to cart.`);
  }

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Our Cakes</h2>
        <div className="card-grid">
          {products.map((c) => (
            <div key={c.id} className="card">
              <div className="card-media">
                <img src={c.image_url || "/chocolate_cake.jpg"} alt={c.name} />
              </div>
              <div className="card-body">
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 700 }}>{formatNaira(c.price_naira)}</div>
                  <div className="muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{"★".repeat(Math.round(c.rating || 0))}{"☆".repeat(5 - Math.round(c.rating || 0))}</span>
                    <span style={{ fontSize: 12 }}>{(c.views || 0).toLocaleString()} views</span>
                  </div>
                </div>
                <button className="btn btn-gold btn-sm" onClick={() => handleOrder(c)}>Order Now</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
