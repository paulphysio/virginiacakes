"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function OrdersPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/login?next=/orders");
    });
  }, [router]);

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Your Orders</h2>
        <div className="card" style={{ padding: 20 }}>
          <p className="muted">You have no orders yet.</p>
        </div>
      </div>
    </section>
  );
}
