"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/products", label: "Products", icon: "🎂" },
    { href: "/admin/transfers", label: "Transfers", icon: "💳" },
    { href: "/admin/all-orders", label: "Orders", icon: "📦" },
  ];

  return (
    <>
      <section className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <h2>Admin Panel</h2>
          </div>
          <nav className="admin-nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${pathname === item.href ? "active" : ""}`}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span className="admin-nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="admin-main">
          {children}
        </main>
      </section>

      <style jsx>{`
        .admin-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          min-height: calc(100vh - 80px);
          gap: 0;
          background: #f8f9fa;
        }

        .admin-sidebar {
          background: #fff;
          border-right: 1px solid #e5e7eb;
          padding: 24px 0;
          position: sticky;
          top: 80px;
          height: calc(100vh - 80px);
          overflow-y: auto;
        }

        .admin-sidebar-header {
          padding: 0 24px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .admin-sidebar-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }

        .admin-nav {
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          font-weight: 600;
          color: #6b7280;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .admin-nav-item:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .admin-nav-item.active {
          background: linear-gradient(135deg, #D4AF37 0%, #F4E5C3 100%);
          color: #fff;
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.25);
        }

        .admin-nav-icon {
          font-size: 20px;
          line-height: 1;
        }

        .admin-nav-label {
          font-size: 15px;
        }

        .admin-main {
          padding: 32px;
          overflow-y: auto;
        }

        @media (max-width: 968px) {
          .admin-layout {
            grid-template-columns: 1fr;
          }

          .admin-sidebar {
            position: static;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
          }

          .admin-nav {
            flex-direction: row;
            overflow-x: auto;
            padding: 12px;
          }

          .admin-nav-item {
            flex-direction: column;
            gap: 4px;
            padding: 10px 16px;
            min-width: 80px;
            text-align: center;
          }

          .admin-nav-label {
            font-size: 13px;
          }

          .admin-main {
            padding: 20px 16px;
          }
        }
      `}</style>
    </>
  );
}
