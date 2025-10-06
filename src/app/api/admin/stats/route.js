import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin, unauthorized } from '../_auth';

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return unauthorized(auth.status, auth.error);
  
  try {
    // Get counts
    const [productsRes, ordersRes, pendingRes, categoriesRes] = await Promise.all([
      supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('orders').select('id, total_cents, status', { count: 'exact' }),
      supabaseAdmin.from('bank_transfers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('categories').select('slug', { count: 'exact', head: true }),
    ]);

    const totalProducts = productsRes.count || 0;
    const totalOrders = ordersRes.count || 0;
    const pendingTransfers = pendingRes.count || 0;
    const totalCategories = categoriesRes.count || 0;

    // Calculate revenue
    const orders = ordersRes.data || [];
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_cents || 0), 0) / 100;
    const paidOrders = orders.filter(o => o.status === 'paid').length;

    // Recent orders
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select('id, created_at, total_cents, status')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      ok: true,
      stats: {
        totalProducts,
        totalOrders,
        paidOrders,
        pendingTransfers,
        totalCategories,
        totalRevenue,
      },
      recentOrders: recentOrders || [],
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
