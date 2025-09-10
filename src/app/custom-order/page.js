"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function CustomOrderPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Form state
  const [cakeType, setCakeType] = useState("Birthday");
  const [shape, setShape] = useState("Round");
  const [tiers, setTiers] = useState(1);
  const [servings, setServings] = useState(12);
  const [size, setSize] = useState("8-inch");
  const [flavor, setFlavor] = useState("Vanilla");
  const [filling, setFilling] = useState("Strawberry");
  const [frosting, setFrosting] = useState("Buttercream");
  const [colors, setColors] = useState("Ivory, Gold");
  const [dietary, setDietary] = useState("");
  const [messageOnCake, setMessageOnCake] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [budget, setBudget] = useState(0);
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [refs, setRefs] = useState([""]); // reference image URLs

  // Inspiration gallery
  const [inspirations, setInspirations] = useState([]);
  const [inspoLoading, setInspoLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return router.replace("/login?next=/custom-order");
      setUser(user);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    // Load recent public custom orders with images (if tables exist)
    (async () => {
      setInspoLoading(true);
      try {
        const { data, error } = await supabase
          .from("custom_orders")
          .select("id, cake_type, colors, shape, tiers, size, flavor, frosting, created_at, images:custom_order_images(url)")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(12);
        if (!error && data) setInspirations(data);
      } finally {
        setInspoLoading(false);
      }
    })();
  }, []);

  function setRefsLen(n) {
    setRefs((prev) => {
      const copy = prev.slice();
      while (copy.length < n) copy.push("");
      if (copy.length > n) copy.length = n;
      return copy;
    });
  }

  function copyInspiration(item) {
    // Prefill key fields from an inspiration
    setCakeType(item.cake_type || cakeType);
    setShape(item.shape || shape);
    setTiers(item.tiers || tiers);
    setSize(item.size || size);
    setFlavor(item.flavor || flavor);
    setFrosting(item.frosting || frosting);
    setColors(item.colors || colors);
    const urls = (item.images || []).map((x) => x.url).filter(Boolean);
    if (urls.length) setRefs(urls.slice(0, 4));
  }

  const canSubmit = useMemo(() => {
    return (
      user && cakeType && shape && tiers > 0 && servings > 0 && size && flavor && frosting && deliveryDate && deliveryAddress
    );
  }, [user, cakeType, shape, tiers, servings, size, flavor, frosting, deliveryDate, deliveryAddress]);

  async function onSubmit(e) {
    e.preventDefault();
    // Validate inputs and surface actionable message
    if (!user) {
      return router.replace("/login?next=/custom-order");
    }
    if (!cakeType || !shape || tiers <= 0 || servings <= 0 || !size || !flavor || !frosting || !deliveryDate || !deliveryAddress) {
      setError("Please fill in all required fields (type, shape, tiers, servings, size, flavor, frosting, delivery date, delivery address).");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        user_id: user.id,
        cake_type: cakeType,
        shape,
        tiers,
        servings,
        size,
        flavor,
        filling,
        frosting,
        colors,
        dietary,
        message_on_cake: messageOnCake,
        delivery_date: deliveryDate,
        delivery_time: deliveryTime || null,
        delivery_address: deliveryAddress,
        budget_naira: budget ? Number(budget) : 0,
        notes,
        is_public: isPublic,
      };

      const { data: order, error: insErr } = await supabase
        .from("custom_orders")
        .insert(payload)
        .select("id")
        .single();
      if (insErr) throw insErr;

      const images = refs.map((url) => url.trim()).filter(Boolean).slice(0, 6).map((url) => ({
        order_id: order.id,
        url,
      }));
      if (images.length) {
        const { error: imgErr } = await supabase.from("custom_order_images").insert(images);
        if (imgErr) throw imgErr;
      }

      setMessage("Your custom order has been submitted. We will contact you shortly with a quote.");
      // Navigate to the detailed view
      router.replace(`/custom-order/${order.id}`);
    } catch (e) {
      setError(e?.message || "Unable to submit custom order");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <section className="section"><div className="container"><p className="muted">Loading...</p></div></section>
  );

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 1100 }}>
        <div className="section-head" style={{ marginBottom: 16 }}>
          <h2 className="section-title">Design Your Custom Cake</h2>
          <p className="muted">Choose your options and share inspiration. We’ll craft a bespoke quote just for you.</p>
        </div>

        <div className="custom-grid-2">
          {/* Builder */}
          <form className="card" onSubmit={onSubmit} style={{ padding: 16, display: "grid", gap: 12 }}>
            <div className="grid-2">
              <label className="field"><span>Cake Type</span>
                <select className="input" value={cakeType} onChange={(e) => setCakeType(e.target.value)}>
                  <option>Birthday</option>
                  <option>Wedding</option>
                  <option>Anniversary</option>
                  <option>Baby Shower</option>
                  <option>Corporate</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="field"><span>Shape</span>
                <select className="input" value={shape} onChange={(e) => setShape(e.target.value)}>
                  <option>Round</option>
                  <option>Square</option>
                  <option>Heart</option>
                  <option>Hexagon</option>
                </select>
              </label>
            </div>

            <div className="grid-3">
              <label className="field"><span>Tiers</span>
                <input className="input" type="number" min={1} max={8} value={tiers} onChange={(e) => setTiers(parseInt(e.target.value || "1", 10))} />
              </label>
              <label className="field"><span>Servings</span>
                <input className="input" type="number" min={1} max={500} value={servings} onChange={(e) => setServings(parseInt(e.target.value || "1", 10))} />
              </label>
              <label className="field"><span>Size</span>
                <input className="input" type="text" value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g., 8-inch" />
              </label>
            </div>

            <div className="grid-3">
              <label className="field"><span>Flavor</span>
                <input className="input" type="text" value={flavor} onChange={(e) => setFlavor(e.target.value)} placeholder="Vanilla, Chocolate..." />
              </label>
              <label className="field"><span>Filling</span>
                <input className="input" type="text" value={filling} onChange={(e) => setFilling(e.target.value)} placeholder="Strawberry, Caramel..." />
              </label>
              <label className="field"><span>Frosting</span>
                <input className="input" type="text" value={frosting} onChange={(e) => setFrosting(e.target.value)} placeholder="Buttercream, Fondant..." />
              </label>
            </div>

            <div className="grid-2">
              <label className="field"><span>Color Palette</span>
                <input className="input" type="text" value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Ivory, Gold" />
              </label>
              <label className="field"><span>Dietary Preferences</span>
                <input className="input" type="text" value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="Gluten-free, Nut-free, Vegan" />
              </label>
            </div>

            <div className="grid-2">
              <label className="field"><span>Delivery Date</span>
                <input className="input" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
              </label>
              <label className="field"><span>Delivery Time</span>
                <input className="input" type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
              </label>
            </div>

            <label className="field"><span>Delivery Address</span>
              <textarea className="input" rows={3} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Street, city, instructions" required />
            </label>

            <div className="grid-2">
              <label className="field"><span>Budget (₦)</span>
                <input className="input" type="number" min={0} value={budget} onChange={(e) => setBudget(parseInt(e.target.value || "0", 10))} />
              </label>
              <label className="field"><span>Message on Cake</span>
                <input className="input" type="text" value={messageOnCake} onChange={(e) => setMessageOnCake(e.target.value)} placeholder="Happy Birthday, ..." />
              </label>
            </div>

            <label className="field"><span>Additional Notes</span>
              <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions" />
            </label>

            <div className="field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>Reference Images (URLs)</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setRefsLen(refs.length + 1)}>Add another</button>
              </div>
              <div className="ref-grid">
                {refs.map((r, i) => (
                  <input key={i} className="input" type="url" placeholder="https://..." value={r} onChange={(e) => setRefs((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))} />
                ))}
              </div>
              <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                <span>Allow my design to inspire others</span>
              </label>
            </div>

            {error && <div style={{ color: "#b00020" }}>{error}</div>}
            {message && <div className="muted">{message}</div>}
            <button className="btn btn-gold" type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit Custom Order"}</button>
          </form>

          {/* Inspiration */}
          <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Inspiration Gallery</h3>
              <span className="muted" style={{ fontSize: 13 }}>{inspoLoading ? "Loading..." : `${inspirations.length} designs`}</span>
            </div>
            <div className="inspo-grid">
              {inspirations.map((item) => {
                const first = item.images?.[0]?.url;
                return (
                  <div key={item.id} className="inspo-card">
                    <div className="inspo-media">
                      <img src={first || "/custom_cake.jpg"} alt={item.cake_type || "Custom cake"} />
                    </div>
                    <div className="inspo-body">
                      <div className="muted" style={{ fontSize: 12 }}>{item.cake_type} • {item.shape} • {item.tiers} tiers</div>
                      <button className="btn btn-outline btn-sm" type="button" onClick={() => copyInspiration(item)}>Use this design</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-grid-2 {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 16px;
        }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .field { display: grid; gap: 6px; }
        .field > span { font-weight: 600; }
        .input { width: 100%; border: 1px solid #e5e5e5; border-radius: 10px; padding: 10px 12px; background: #fff; }
        .ref-grid { display: grid; gap: 8px; grid-template-columns: 1fr; }
        .inspo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .inspo-card { border: 1px solid #eee; border-radius: 12px; overflow: hidden; background: #fff; display: grid; }
        .inspo-media { aspect-ratio: 4 / 3; overflow: hidden; background: #fafafa; }
        .inspo-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .inspo-body { display: grid; gap: 6px; padding: 10px; }

        @media (max-width: 1000px) {
          .custom-grid-2 { grid-template-columns: 1fr; }
          .grid-3 { grid-template-columns: 1fr; }
          .grid-2 { grid-template-columns: 1fr; }
          .inspo-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
