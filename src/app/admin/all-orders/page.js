"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function AdminAllOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/admin/all-orders");
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";
      if (!token) {
        router.replace("/login?next=/admin/all-orders");
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
      await loadOrders(token, "");
      setLoading(false);
    })();
  }, [router]);

  async function loadOrders(token, status) {
    try {
      const url = `/api/admin/orders?status=${status}&limit=100`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok) {
        setOrders(json.data || []);
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    if (!confirm(`Change order status to "${newStatus}"?`)) return;
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      alert("Order status updated!");
      await loadOrders(accessToken, statusFilter);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to update order status.");
    }
  }

  function handleFilterChange(status) {
    setStatusFilter(status);
    loadOrders(accessToken, status);
  }

  function toggleExpand(orderId) {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading orders...</div>;
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Orders</h1>
          <p>Manage all customer orders</p>
        </div>
      </div>

      <div className="admin-section">
        <div className="filter-bar">
          <button
            className={`filter-btn ${statusFilter === "" ? "active" : ""}`}
            onClick={() => handleFilterChange("")}
          >
            All Orders
          </button>
          <button
            className={`filter-btn ${statusFilter === "paid" ? "active" : ""}`}
            onClick={() => handleFilterChange("paid")}
          >
            Paid
          </button>
          <button
            className={`filter-btn ${statusFilter === "pending" ? "active" : ""}`}
            onClick={() => handleFilterChange("pending")}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${statusFilter === "processing" ? "active" : ""}`}
            onClick={() => handleFilterChange("processing")}
          >
            Processing
          </button>
          <button
            className={`filter-btn ${statusFilter === "shipped" ? "active" : ""}`}
            onClick={() => handleFilterChange("shipped")}
          >
            Shipped
          </button>
          <button
            className={`filter-btn ${statusFilter === "delivered" ? "active" : ""}`}
            onClick={() => handleFilterChange("delivered")}
          >
            Delivered
          </button>
        </div>

        {orders.length === 0 ? (
          <p className="no-data">No orders found.</p>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const items = order.order_items || [];
              const totalNaira = (order.total_cents || 0) / 100;
              return (
                <div key={order.id} className="order-card">
                  <div className="order-header" onClick={() => toggleExpand(order.id)}>
                    <div className="order-id">
                      <strong>Order #{String(order.id).slice(0, 8)}</strong>
                      <span className="order-date">{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    <div className="order-summary">
                      <span className="order-total">₦{totalNaira.toLocaleString("en-NG")}</span>
                      <span className={`status-badge status-${order.status}`}>{order.status}</span>
                    </div>
                    <button className="expand-btn">{isExpanded ? "▲" : "▼"}</button>
                  </div>

                  {isExpanded && (
                    <div className="order-details">
                      <div className="order-items">
                        <h4>Items ({items.length})</h4>
                        <div className="items-grid">
                          {items.map((item, idx) => (
                            <div key={idx} className="item-row">
                              {item.product?.image_url && (
                                <div className="item-image">
                                  <img src={item.product.image_url} alt={item.product.name} />
                                </div>
                              )}
                              <div className="item-info">
                                <div className="item-name">{item.product?.name || "Unknown Product"}</div>
                                <div className="item-meta">
                                  Qty: {item.quantity} × ₦{((item.unit_price_cents || 0) / 100).toLocaleString("en-NG")}
                                </div>
                              </div>
                              <div className="item-subtotal">
                                ₦{(((item.unit_price_cents || 0) * item.quantity) / 100).toLocaleString("en-NG")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="order-actions">
                        <h4>Change Status</h4>
                        <div className="status-buttons">
                          <button className="btn-status btn-pending" onClick={() => updateOrderStatus(order.id, "pending")}>Pending</button>
                          <button className="btn-status btn-processing" onClick={() => updateOrderStatus(order.id, "processing")}>Processing</button>
                          <button className="btn-status btn-shipped" onClick={() => updateOrderStatus(order.id, "shipped")}>Shipped</button>
                          <button className="btn-status btn-delivered" onClick={() => updateOrderStatus(order.id, "delivered")}>Delivered</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-header {
          margin-bottom: 32px;
        }
        .admin-header h1 {
          margin: 0 0 4px 0;
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
        }
        .admin-header p {
          margin: 0;
          color: #6b7280;
          font-size: 16px;
        }
        .admin-section {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .filter-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .filter-btn {
          padding: 10px 20px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
          color: #6b7280;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-btn:hover {
          background: #f3f4f6;
          color: #1f2937;
        }
        .filter-btn.active {
          background: linear-gradient(135deg, #D4AF37 0%, #F4E5C3 100%);
          color: #fff;
          border-color: #D4AF37;
        }
        .no-data {
          text-align: center;
          color: #6b7280;
          padding: 40px;
        }
        .orders-list {
          display: grid;
          gap: 16px;
        }
        .order-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
        }
        .order-header {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 16px;
          padding: 20px;
          cursor: pointer;
          transition: background 0.2s ease;
          align-items: center;
        }
        .order-header:hover {
          background: #f8f9fa;
        }
        .order-id {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .order-id strong {
          font-size: 16px;
          color: #1f2937;
        }
        .order-date {
          font-size: 13px;
          color: #6b7280;
        }
        .order-summary {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .order-total {
          font-size: 18px;
          font-weight: 700;
          color: #D4AF37;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .status-paid {
          background: #d1fae5;
          color: #065f46;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-processing {
          background: #dbeafe;
          color: #1e40af;
        }
        .status-shipped {
          background: #e0e7ff;
          color: #4338ca;
        }
        .status-delivered {
          background: #d1fae5;
          color: #065f46;
        }
        .expand-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #fff;
          cursor: pointer;
          font-size: 14px;
          color: #6b7280;
          transition: all 0.2s ease;
        }
        .expand-btn:hover {
          background: #f3f4f6;
        }
        .order-details {
          padding: 0 20px 20px 20px;
          border-top: 1px solid #e5e7eb;
        }
        .order-items {
          margin-top: 20px;
        }
        .order-items h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .items-grid {
          display: grid;
          gap: 12px;
        }
        .item-row {
          display: grid;
          grid-template-columns: 60px 1fr auto;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 10px;
          align-items: center;
        }
        .item-image {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
        }
        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .item-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .item-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 15px;
        }
        .item-meta {
          font-size: 13px;
          color: #6b7280;
        }
        .item-subtotal {
          font-weight: 700;
          color: #D4AF37;
          font-size: 16px;
        }
        .order-actions {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .order-actions h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .status-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .btn-status {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-status:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .btn-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .btn-processing {
          background: #dbeafe;
          color: #1e40af;
        }
        .btn-shipped {
          background: #e0e7ff;
          color: #4338ca;
        }
        .btn-delivered {
          background: #d1fae5;
          color: #065f46;
        }
        @media (max-width: 768px) {
          .order-header {
            grid-template-columns: 1fr;
          }
          .order-summary {
            justify-content: space-between;
          }
          .item-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
