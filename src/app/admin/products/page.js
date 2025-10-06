"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function AdminProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_naira: "",
    category_slug: "",
    rating: "",
    is_active: true,
    is_show: true,
    image_url: "",
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/admin/products");
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";
      if (!token) {
        router.replace("/login?next=/admin/products");
        return;
      }
      const res = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      setAccessToken(token);
      await loadCategories();
      await loadProducts(token, "");
      setLoading(false);
    })();
  }, [router]);

  async function loadCategories() {
    const { data } = await supabase
      .from("categories")
      .select("slug, name")
      .order("position", { ascending: true });
    setCategories(data || []);
  }

  async function loadProducts(token, searchQuery) {
    try {
      const url = `/api/admin/products?search=${encodeURIComponent(searchQuery)}&limit=100`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok) {
        setProducts(json.data || []);
      }
    } catch (e) {
      console.error("Failed to load products:", e);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    loadProducts(accessToken, search);
  }

  function openAddModal() {
    setFormData({
      name: "",
      description: "",
      price_naira: "",
      category_slug: categories[0]?.slug || "",
      rating: "",
      is_active: true,
      is_show: true,
      image_url: "",
    });
    setPreviewUrl("");
    setEditingProduct(null);
    setShowAddModal(true);
  }

  function openEditModal(product) {
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price_naira: product.price_naira || "",
      category_slug: product.category_slug || "",
      rating: product.rating || "",
      is_active: product.is_active !== false,
      is_show: product.is_show !== false,
      image_url: product.image_url || "",
    });
    setPreviewUrl(product.image_url || "");
    setEditingProduct(product);
    setShowAddModal(true);
  }

  function closeModal() {
    setShowAddModal(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price_naira: "",
      category_slug: "",
      rating: "",
      is_active: true,
      is_show: true,
      image_url: "",
    });
    setPreviewUrl("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name || !formData.price_naira || !formData.category_slug) {
      alert("Please fill in name, price and category.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formData.image_url;
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

      const cat = categories.find((c) => c.slug === formData.category_slug);
      const payload = {
        ...formData,
        image_url: imageUrl,
        category: cat?.name || formData.category_slug,
        type: cat?.name || formData.category_slug,
      };

      if (editingProduct) {
        // Update
        const res = await fetch("/api/admin/products", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ id: editingProduct.id, ...payload }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Update failed");
        alert("Product updated successfully!");
      } else {
        // Create
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Create failed");
        alert("Product created successfully!");
      }

      closeModal();
      await loadProducts(accessToken, search);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(productId, productName) {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/products?id=${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Delete failed");
      }
      alert("Product deleted successfully!");
      await loadProducts(accessToken, search);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to delete product.");
    }
  }

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (f) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl(formData.image_url || "");
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading products...</div>;
  }

  return (
    <>
      <div className="admin-header">
        <h1>Products</h1>
        <button className="btn btn-gold" onClick={openAddModal}>+ Add Product</button>
      </div>

      <div className="admin-section">
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="Search products by name, description, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-outline">Search</button>
          <button type="button" className="btn btn-outline" onClick={() => { setSearch(""); loadProducts(accessToken, ""); }}>Clear</button>
        </form>

        <div className="products-grid">
          {products.length === 0 ? (
            <p className="no-data">No products found.</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                  <p className="product-price">₦{(product.price_naira || 0).toLocaleString("en-NG")}</p>
                  <div className="product-badges">
                    {product.is_active ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-inactive">Inactive</span>
                    )}
                    {product.is_show && <span className="badge badge-featured">Featured</span>}
                  </div>
                </div>
                <div className="product-actions">
                  <button className="btn-icon btn-edit" onClick={() => openEditModal(product)} title="Edit">✏️</button>
                  <button className="btn-icon btn-delete" onClick={() => handleDelete(product.id, product.name)} title="Delete">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₦) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price_naira}
                    onChange={(e) => setFormData({ ...formData, price_naira: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rating (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category_slug}
                  onChange={(e) => setFormData({ ...formData, category_slug: e.target.value })}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Product Image</label>
                <input type="file" accept="image/*" ref={fileRef} onChange={onFileChange} />
                {previewUrl && (
                  <div className="image-preview">
                    <img src={previewUrl} alt="Preview" />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Active (available for order)</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_show}
                    onChange={(e) => setFormData({ ...formData, is_show: e.target.checked })}
                  />
                  <span>Featured (show on homepage)</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-gold" disabled={saving}>
                  {saving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .admin-header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
        }
        .admin-section {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .search-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .search-input {
          flex: 1;
          min-width: 250px;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          outline: none;
        }
        .search-input:focus {
          border-color: #D4AF37;
        }
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .product-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
          position: relative;
        }
        .product-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .product-image {
          width: 100%;
          height: 200px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .no-image {
          color: #9ca3af;
          font-size: 14px;
        }
        .product-info {
          padding: 16px;
        }
        .product-info h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        .product-category {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #6b7280;
        }
        .product-price {
          margin: 0 0 12px 0;
          font-size: 20px;
          font-weight: 700;
          color: #D4AF37;
        }
        .product-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-success {
          background: #d1fae5;
          color: #065f46;
        }
        .badge-inactive {
          background: #fee2e2;
          color: #991b1b;
        }
        .badge-featured {
          background: #fef3c7;
          color: #92400e;
        }
        .product-actions {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 8px;
        }
        .btn-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: rgba(255,255,255,0.95);
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: all 0.2s ease;
        }
        .btn-icon:hover {
          transform: scale(1.1);
        }
        .btn-edit:hover {
          background: #dbeafe;
        }
        .btn-delete:hover {
          background: #fee2e2;
        }
        .no-data {
          text-align: center;
          color: #6b7280;
          padding: 40px;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }
        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #f3f4f6;
          cursor: pointer;
          font-size: 24px;
          line-height: 1;
          color: #6b7280;
          transition: all 0.2s ease;
        }
        .modal-close:hover {
          background: #e5e7eb;
          color: #1f2937;
        }
        .modal-form {
          padding: 24px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          outline: none;
          font-family: inherit;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #D4AF37;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          cursor: pointer;
        }
        .checkbox-label input {
          width: auto;
        }
        .image-preview {
          margin-top: 12px;
          border-radius: 10px;
          overflow: hidden;
          max-width: 200px;
        }
        .image-preview img {
          width: 100%;
          height: auto;
          display: block;
        }
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }
        @media (max-width: 768px) {
          .products-grid {
            grid-template-columns: 1fr;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .modal-overlay { padding: 0; }
          .modal-content {
            width: 100vw;
            height: 100vh;
            max-width: none;
            max-height: none;
            border-radius: 0;
            display: flex;
            flex-direction: column;
          }
          .modal-header {
            position: sticky;
            top: 0;
            background: #fff;
            z-index: 2;
            padding: 16px;
          }
          .modal-form { 
            padding: 16px; 
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            flex: 1;
          }
          .modal-actions {
            position: sticky;
            bottom: 0;
            background: linear-gradient(180deg, rgba(255,255,255,0.85) 0%, #fff 40%);
            padding: 12px 16px;
            margin-top: 0;
            border-top: 1px solid #f0f0f0;
          }
          .image-preview { max-width: 100%; }
        }
      `}</style>
    </>
  );
}
