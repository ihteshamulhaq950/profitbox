import { createClient } from '@/lib/supabase/server'
import { Product } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

// Get products with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,category.ilike.%${search}%`)
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      data: data || [],
      meta: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > page * limit
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/products?page=1&limit=5&search=sugar&category=groceries
 * Fetch products with pagination and filters
 * Default: page 1, limit 5, recent products first
 */
// export async function GET(request: NextRequest) {
//   const supabase = await createClient()

//   const {
//     data: { user },
//   } = await supabase.auth.getUser()

//   if (!user) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//   }

//   // Extract query parameters
//   const { searchParams } = new URL(request.url)
//   const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
//   const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '5')))
//   const search = searchParams.get('search')?.trim().toLowerCase()
//   const category = searchParams.get('category')
//   const isActive = searchParams.get('is_active') !== 'false'

//   const offset = (page - 1) * limit

//   // Build query
//   let query = supabase
//     .from('products')
//     .select('*', { count: 'exact' })
//     .eq('user_id', user.id)
//     // .eq('is_active', isActive)
//     .order('created_at', { ascending: false })

//   if (category) {
//     query = query.eq('category', category)
//   }

//   if (search) {
//     query = query.or(
//       `name.ilike.%${search}%,sku.ilike.%${search}%,category.ilike.%${search}%`
//     )
//   }

//   const { data: products, error, count } = await query.range(offset, offset + limit - 1)

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 })
//   }

//   const total = count || 0
//   const meta = {
//     page,
//     limit,
//     total,
//     hasMore: offset + limit < total,
//   }

//   return NextResponse.json({
//     data: products as Product[],
//     meta,
//   })
// }

/**
 * POST /api/products
 * Create a new product
 * Required: sku, name, unit_type, base_unit
 * Optional: category, description, image_url, default_supplier
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Validation
  if (!body.sku || body.sku.trim() === '') {
    return NextResponse.json({ error: 'sku is required' }, { status: 400 })
  }

  if (!body.name || body.name.trim() === '') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  if (!['weight', 'count'].includes(body.unit_type)) {
    return NextResponse.json(
      { error: "unit_type must be 'weight' or 'count'" },
      { status: 400 }
    )
  }

  if (!body.base_unit || body.base_unit.trim() === '') {
    return NextResponse.json({ error: 'base_unit is required' }, { status: 400 })
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      user_id: user.id,
      sku: body.sku.trim().toUpperCase(),
      name: body.name.trim(),
      category: body.category || null,
      description: body.description || null,
      image_url: body.image_url || null,
      unit_type: body.unit_type,
      base_unit: body.base_unit.trim().toLowerCase(),
      default_supplier: body.default_supplier || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    // Handle unique constraint violation (SKU must be unique per user)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'SKU already exists for this user' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(product as Product, { status: 201 })
}
