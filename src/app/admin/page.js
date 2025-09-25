"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [rating, setRating] = useState("");
  const [isShow, setIsShow] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const fileRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    // Mark body to disable any site-wide overlays while on admin page
    document.body.classList.add("admin-page");
    // Ensure scrolling allowed in case mobile menu had locked it
    document.body.classList.remove("no-scroll");
    return () => {
      document.body.classList.remove("admin-page");
    };
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/admin");
        return;
      }
      setUser(user);
      // Load categories
      const { data } = await supabase
        .from("categories")
        .select("slug, name, image_url, position")
        .order("position", { ascending: true });
      const cats = data || [];
      setCategories(cats);
      if (cats.length > 0) setCategorySlug(cats[0].slug);
      setLoading(false);
    })();
  }, [router]);

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (f) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !price || !categorySlug) {
      alert("Please fill in name, price and category.");
      return;
    }
    const cat = categories.find((c) => c.slug === categorySlug);
    if (!cat) {
      alert("Selected category not found.");
      return;
    }

    setSaving(true);
    try {
      // 1) Upload image if any
      let imageUrl = cat.image_url || "";
      const file = fileRef.current?.files?.[0];
      if (file) {
        const path = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");
        const { data: up, error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage
          .from("product-images")
          .getPublicUrl(up.path);
        imageUrl = pub?.publicUrl || imageUrl;
      }

      // 2) Insert product
      const priceInt = parseInt(price, 10) || 0;
      const ratingNum = rating ? Math.min(5, Math.max(0, parseFloat(rating))) : null;

      const { error: insErr } = await supabase
        .from("products")
        .insert({
          name,
          description,
          image_url: imageUrl,
          price_naira: priceInt,
          rating: ratingNum,
          views: 0,
          is_active: isActive,
          is_show: isShow,
          category_slug: cat.slug,
          category: cat.name,
          type: cat.name,
        });
      if (insErr) throw insErr;

      alert("Product created successfully.");
      // Reset form
      setName("");
      setDescription("");
      setPrice("");
      setRating("");
      setIsShow(true);
      setIsActive(true);
      if (fileRef.current) fileRef.current.value = "";
      setPreviewUrl("");
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to create product. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <div className="card" style={{ padding: 20, textAlign: "center" }}>Loading...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Admin – Add Product</h2>
        <div className="card" style={{ padding: 20 }}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label htmlFor="name"><strong>Name</strong></label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Classic Belgian Waffle" required style={inputStyle} />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label htmlFor="desc"><strong>Description</strong></label>
              <textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" rows={3} style={textareaStyle} />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label htmlFor="price"><strong>Price (₦)</strong></label>
              <input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 20000" required style={inputStyle} />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label htmlFor="rating"><strong>Rating (0-5, optional)</strong></label>
              <input id="rating" type="number" min="0" max="5" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="e.g. 4.8" style={inputStyle} />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label htmlFor="category"><strong>Category</strong></label>
              <select id="category" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} style={inputStyle}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label htmlFor="image"><strong>Product Image</strong></label>
              <input id="image" type="file" accept="image/*" ref={fileRef} onChange={onFileChange} style={inputStyle} />
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" style={{ maxWidth: 240, borderRadius: 12, marginTop: 8 }} />
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={isShow} onChange={(e) => setIsShow(e.target.checked)} />
                <span>Featured (show on homepage)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Active (available for order)</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" className="btn btn-gold" disabled={saving}>{saving ? "Saving..." : "Create Product"}</button>
              <button type="button" className="btn btn-outline" onClick={() => router.push("/categories")}>View Categories</button>
            </div>
          </form>
        </div>
        <p className="micro muted" style={{ marginTop: 10 }}>
          Images upload to the &quot;product-images&quot; bucket. Product records are inserted into the &quot;products&quot; table with selected category metadata.
        </p>
      </div>
    </section>
  );
}

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #eee",
  borderRadius: 10,
  outline: "none",
};

const textareaStyle = {
  padding: "10px 12px",
  border: "1px solid #eee",
  borderRadius: 10,
  outline: "none",
};
