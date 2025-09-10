"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/login?next=/profile");
      setUser(user);
    });
  }, [router]);

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Profile</h2>
        <div className="card" style={{ padding: 20 }}>
          {user ? (
            <>
              <p><strong>Email:</strong> {user.email}</p>
              {user.user_metadata?.full_name && (
                <p><strong>Name:</strong> {user.user_metadata.full_name}</p>
              )}
            </>
          ) : (
            <p className="muted">Loading...</p>
          )}
        </div>
      </div>
    </section>
  );
}
