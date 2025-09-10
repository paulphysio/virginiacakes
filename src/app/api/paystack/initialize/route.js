import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { amount_naira, email, reference, callback_url } = await req.json();
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "PAYSTACK_SECRET_KEY is not set" }, { status: 500 });
    }
    if (!amount_naira || !email) {
      return NextResponse.json({ error: "amount_naira and email are required" }, { status: 400 });
    }

    const body = {
      email,
      amount: Math.max(1, Math.round(amount_naira * 100)), // Kobo
      reference: reference || undefined,
      currency: "NGN",
      callback_url: callback_url || undefined,
    };

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || "Failed to initialize payment" }, { status: 500 });
    }

    return NextResponse.json({ data: data?.data });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
