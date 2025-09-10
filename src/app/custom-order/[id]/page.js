"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";

export default function CustomOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user || null);
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data, error } = await supabase
          .from("custom_orders")
          .select("*, images:custom_order_images(url)")
          .eq("id", id)
          .single();
        if (error) throw error;
        setOrder(data);
      } catch (e) {
        setError(e?.message || "Unable to load custom order");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const title = useMemo(() => {
    if (!order) return "Custom Order";
    return `${order.cake_type} • ${order.shape} • ${order.tiers} tier${order.tiers > 1 ? "s" : ""}`;
  }, [order]);

  if (loading) return (
    <section className="section"><div className="container"><p className="muted">Loading...</p></div></section>
  );

  if (error || !order) return (
    <section className="section"><div className="container"><div className="card" style={{ padding: 16 }}>
      <h2 className="section-title" style={{ marginTop: 0 }}>Custom Order</h2>
      <div style={{ color: "#b00020" }}>{error || "Order not found"}</div>
      <div style={{ marginTop: 10 }}>
        <Link href="/custom-order" className="btn btn-gold">Back to Custom Orders</Link>
      </div>
    </div></div></section>
  );

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 1000 }}>
        <div className="section-head" style={{ marginBottom: 16 }}>
          <h2 className="section-title">{title}</h2>
          <p className="muted">Submitted on {new Date(order.created_at).toLocaleString()}</p>
        </div>

        <div className="detail-grid">
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Specifications</h3>
            <div className="spec-grid">
              <Spec k="Cake Type" v={order.cake_type} />
              <Spec k="Shape" v={order.shape} />
              <Spec k="Tiers" v={order.tiers} />
              <Spec k="Servings" v={order.servings} />
              <Spec k="Size" v={order.size} />
              <Spec k="Flavor" v={order.flavor} />
              <Spec k="Filling" v={order.filling || "—"} />
              <Spec k="Frosting" v={order.frosting} />
              <Spec k="Colors" v={order.colors || "—"} />
              <Spec k="Dietary" v={order.dietary || "—"} />
              <Spec k="Message on Cake" v={order.message_on_cake || "—"} />
              <Spec k="Delivery Date" v={order.delivery_date} />
              <Spec k="Delivery Time" v={order.delivery_time || "—"} />
              <Spec k="Budget" v={formatNaira(order.budget_naira)} />
            </div>

            <div style={{ marginTop: 12 }}>
              <h4 style={{ margin: "14px 0 6px" }}>Delivery Address</h4>
              <div className="muted">{order.delivery_address}</div>

              {order.notes && (
                <>
                  <h4 style={{ margin: "14px 0 6px" }}>Notes</h4>
                  <div className="muted">{order.notes}</div>
                </>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Reference Images</h3>
            {order.images?.length ? (
              <div className="img-grid">
                {order.images.map((img, i) => (
                  <a key={i} href={img.url} target="_blank" rel="noreferrer">
                    <img src={img.url} alt={`Reference ${i + 1}`} />
                  </a>
                ))}
              </div>
            ) : (
              <p className="muted">No reference images provided.</p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .spec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
        .spec { display: grid; gap: 2px; }
        .spec .k { font-size: 12px; color: #777; }
        .img-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .img-grid img { width: 100%; height: 160px; object-fit: cover; border-radius: 10px; border: 1px solid #eee; }
        @media (max-width: 1000px) {
          .detail-grid { grid-template-columns: 1fr; }
          .spec-grid { grid-template-columns: 1fr; }
          .img-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </section>
  );
}

function Spec({ k, v }) {
  return (
    <div className="spec">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}

function formatNaira(amount) {
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount || 0);
  } catch {
    return `₦${amount?.toLocaleString?.() ?? amount ?? 0}`;
  }
}
