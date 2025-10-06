"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/admin");
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || "";
      if (!token) {
        router.replace("/login?next=/admin");
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
      await loadStats(token);
      setLoading(false);
    })();
  }, [router]);

  async function loadStats(token) {
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok) {
        setStats(json.stats);
        setRecentOrders(json.recentOrders || []);
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading dashboard...</div>;
  }

  const statCards = [
    { label: "Total Products", value: stats?.totalProducts || 0, icon: "🎂", color: "#D4AF37" },
    { label: "Total Orders", value: stats?.totalOrders || 0, icon: "📦", color: "#4F46E5" },
    { label: "Paid Orders", value: stats?.paidOrders || 0, icon: "✅", color: "#10B981" },
    { label: "Pending Transfers", value: stats?.pendingTransfers || 0, icon: "⏳", color: "#F59E0B" },
    { label: "Total Revenue", value: `₦${(stats?.totalRevenue || 0).toLocaleString("en-NG")}`, icon: "💰", color: "#8B5CF6" },
    { label: "Categories", value: stats?.totalCategories || 0, icon: "📂", color: "#EC4899" },
  ];

  return (
    <>
      <div className="admin-header">
        <h1>Dashboard</h1>
        <p>Welcome to your admin panel</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card" style={{ borderLeftColor: card.color }}>
            <div className="stat-icon" style={{ background: `${card.color}15` }}>{card.icon}</div>
            <div className="stat-content">
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-actions">
          <Link href="/admin/products" className="action-card">
            <span className="action-icon">🎂</span>
            <span className="action-label">Manage Products</span>
          </Link>
          <Link href="/admin/transfers" className="action-card">
            <span className="action-icon">💳</span>
            <span className="action-label">Approve Transfers</span>
          </Link>
          <Link href="/admin/all-orders" className="action-card">
            <span className="action-icon">📦</span>
            <span className="action-label">View Orders</span>
          </Link>
        </div>
      </div>

      {recentOrders.length > 0 && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <Link href="/admin/all-orders" className="btn btn-outline btn-sm">View All</Link>
          </div>
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td><code>{String(order.id).slice(0, 8)}</code></td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>₦{((order.total_cents || 0) / 100).toLocaleString("en-NG")}</td>
                    <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        .stat-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-left: 4px solid;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .stat-content {
          flex: 1;
        }
        .stat-label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }
        .admin-section {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .section-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        .action-card:hover {
          background: linear-gradient(135deg, #D4AF37 0%, #F4E5C3 100%);
          border-color: #D4AF37;
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(212, 175, 55, 0.3);
        }
        .action-icon {
          font-size: 36px;
        }
        .action-label {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .orders-table {
          overflow-x: auto;
        }
        .orders-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .orders-table th {
          text-align: left;
          padding: 12px;
          background: #f8f9fa;
          font-weight: 600;
          color: #6b7280;
          font-size: 14px;
          border-bottom: 2px solid #e5e7eb;
        }
        .orders-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
        }
        .orders-table tr:hover {
          background: #f8f9fa;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
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
        .btn-sm {
          padding: 8px 16px;
          font-size: 14px;
        }
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .quick-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
