import { createClient } from '@/lib/supabase/server'
import { StockBatch } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/inventory?page=1&limit=10&product_id=xxx&status=active
 * Fetch stock batches with pagination and filters
 * Default: page 1, limit 10, recent batches first, active status
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')))
  const productId = searchParams.get('product_id')
  const status = searchParams.get('status') || 'active'

  const offset = (page - 1) * limit

  let query = supabase
    .from('stock_batches')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (productId) {
    query = query.eq('product_id', productId)
  }

  if (status && ['active', 'depleted'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data: batches, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = count || 0
  const meta = {
    page,
    limit,
    total,
    hasMore: offset + limit < total,
  }

  return NextResponse.json({
    data: batches as StockBatch[],
    meta,
  })
}

/**
 * POST /api/inventory
 * Create a new stock batch
 * Required: product_id, boxes_purchased, quantity_per_box, unit_per_box, cost_per_box
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
  if (!body.product_id) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
  }

  if (!body.boxes_purchased || body.boxes_purchased <= 0) {
    return NextResponse.json(
      { error: 'boxes_purchased must be greater than 0' },
      { status: 400 }
    )
  }

  if (!body.quantity_per_box || body.quantity_per_box <= 0) {
    return NextResponse.json(
      { error: 'quantity_per_box must be greater than 0' },
      { status: 400 }
    )
  }

  if (!body.unit_per_box || body.unit_per_box.trim() === '') {
    return NextResponse.json({ error: 'unit_per_box is required' }, { status: 400 })
  }

  if (!body.cost_per_box || body.cost_per_box <= 0) {
    return NextResponse.json(
      { error: 'cost_per_box must be greater than 0' },
      { status: 400 }
    )
  }

  // Alert thresholds (optional, default to 0 if not provided)
  const reorderLevel = parseInt(body.reorder_level) || 0
  const criticalLevel = parseInt(body.critical_level) || 0

  // Validate threshold constraints
  if (reorderLevel < 0) {
    return NextResponse.json(
      { error: 'reorder_level must be >= 0' },
      { status: 400 }
    )
  }

  if (criticalLevel < 0) {
    return NextResponse.json(
      { error: 'critical_level must be >= 0' },
      { status: 400 }
    )
  }

  if (criticalLevel > reorderLevel) {
    return NextResponse.json(
      { error: 'critical_level must be <= reorder_level' },
      { status: 400 }
    )
  }

  // Calculate initial alert status
  let alertStatus = 'healthy'
  if (body.boxes_purchased <= criticalLevel) {
    alertStatus = 'critical'
  } else if (body.boxes_purchased <= reorderLevel) {
    alertStatus = 'warning'
  }

  const { data: batch, error } = await supabase
    .from('stock_batches')
    .insert({
      user_id: user.id,
      product_id: body.product_id,
      boxes_purchased: body.boxes_purchased,
      boxes_remaining: body.boxes_purchased, // Start with all boxes remaining
      quantity_per_box: body.quantity_per_box.toString(),
      unit_per_box: body.unit_per_box.trim().toLowerCase(),
      cost_per_box: body.cost_per_box.toString(),
      supplier_name: body.supplier_name || null,
      batch_number: body.batch_number || null,
      status: 'active',
      reorder_level: reorderLevel,
      critical_level: criticalLevel,
      alert_status: alertStatus,
    })
    .select()
    .single()

  if (error) {
    // Foreign key violation (product doesn't exist or doesn't belong to user)
    if (error.code === '23503') {
      return NextResponse.json(
        { error: 'Product not found or does not belong to user' },
        { status: 404 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(batch as StockBatch, { status: 201 })
}
