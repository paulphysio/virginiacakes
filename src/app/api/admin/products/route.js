import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin, unauthorized } from '../_auth';

// GET all products with pagination and search
export async function GET(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return unauthorized(auth.status, auth.error);
  
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, data: data || [], total: count || 0 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return unauthorized(auth.status, auth.error);
  
  try {
    const body = await req.json();
    const { name, description, price_naira, category_slug, category, rating, is_active, is_show, image_url } = body;

    if (!name || !price_naira || !category_slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        description: description || null,
        price_naira: parseInt(price_naira, 10),
        category_slug,
        category: category || category_slug,
        type: category || category_slug,
        rating: rating ? parseFloat(rating) : null,
        is_active: is_active !== false,
        is_show: is_show !== false,
        image_url: image_url || null,
        views: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

// PATCH - Update product
export async function PATCH(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return unauthorized(auth.status, auth.error);
  
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Clean up updates
    const cleanUpdates = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.description !== undefined) cleanUpdates.description = updates.description;
    if (updates.price_naira !== undefined) cleanUpdates.price_naira = parseInt(updates.price_naira, 10);
    if (updates.category_slug !== undefined) cleanUpdates.category_slug = updates.category_slug;
    if (updates.category !== undefined) cleanUpdates.category = updates.category;
    if (updates.type !== undefined) cleanUpdates.type = updates.type;
    if (updates.rating !== undefined) cleanUpdates.rating = updates.rating ? parseFloat(updates.rating) : null;
    if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active;
    if (updates.is_show !== undefined) cleanUpdates.is_show = updates.is_show;
    if (updates.image_url !== undefined) cleanUpdates.image_url = updates.image_url;

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return unauthorized(auth.status, auth.error);
  
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
