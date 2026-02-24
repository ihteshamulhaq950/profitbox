import { createClient } from '@/lib/supabase/server'
import { DailySale } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'
import Decimal from 'decimal.js'
import { getDateStringDaysAgo, getTodayDateString } from '@/lib/date-utils'

/**
 * GET /api/sales?page=1&limit=10&product_id=xxx&from_date=2024-01-01T00:00:00Z&to_date=2024-12-31T23:59:59Z
 * Fetch sales with pagination and filters
 * Default: page 1, limit 10, recent sales first
 * Dates should be ISO 8601 timestamp strings for proper timestampz filtering
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
  const fromDate = searchParams.get('from_date')
  const toDate = searchParams.get('to_date')

  const offset = (page - 1) * limit

  let query = supabase
    .from('daily_sales')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (productId) {
    query = query.eq('product_id', productId)
  }

  // Use ISO 8601 timestamps for proper timestampz filtering
  if (fromDate) {
    query = query.gte('created_at', fromDate)
  }

  if (toDate) {
    query = query.lte('created_at', toDate)
  }

  const { data: sales, error, count } = await query.range(offset, offset + limit - 1)

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
    data: sales as DailySale[],
    meta,
  })
}

/**
 * POST /api/sales
 * Record a new sale
 * Required: product_id, batch_id, boxes_sold, selling_price_per_box
 * Note: Cost is fetched from batch automatically
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

  if (!body.batch_id) {
    return NextResponse.json({ error: 'batch_id is required' }, { status: 400 })
  }

  if (!body.boxes_sold || body.boxes_sold <= 0) {
    return NextResponse.json(
      { error: 'boxes_sold must be greater than 0' },
      { status: 400 }
    )
  }

  if (!body.selling_price_per_box || body.selling_price_per_box <= 0) {
    return NextResponse.json(
      { error: 'selling_price_per_box must be greater than 0' },
      { status: 400 }
    )
  }

  // Fetch batch to get cost and alert thresholds
  const { data: batch, error: batchError } = await supabase
    .from('stock_batches')
    .select('cost_per_box, boxes_remaining, reorder_level, critical_level')
    .eq('id', body.batch_id)
    .single()

  if (batchError || !batch) {
    return NextResponse.json(
      { error: 'Batch not found' },
      { status: 404 }
    )
  }

  if (batch.boxes_remaining < body.boxes_sold) {
    return NextResponse.json(
      { error: `Insufficient stock. Available: ${batch.boxes_remaining}, Requested: ${body.boxes_sold}` },
      { status: 400 }
    )
  }

  // Calculate financials using Decimal for precision
  const boxesDecimal = new Decimal(body.boxes_sold)
  const sellingPriceDecimal = new Decimal(body.selling_price_per_box)
  const costDecimal = new Decimal(batch.cost_per_box)

  const totalRevenue = boxesDecimal.times(sellingPriceDecimal).toFixed(2)
  const totalCost = boxesDecimal.times(costDecimal).toFixed(2)

  const { data: sale, error } = await supabase
    .from('daily_sales')
    .insert({
      user_id: user.id,
      product_id: body.product_id,
      batch_id: body.batch_id,
      boxes_sold: body.boxes_sold,
      selling_price_per_box: body.selling_price_per_box.toString(),
      customer_name: body.customer_name || null,
      notes: body.notes || null,
    })
    .select()
    .single()

  if (error) {
    // Foreign key violations
    if (error.code === '23503') {
      return NextResponse.json(
        { error: 'Product or batch not found, or does not belong to user' },
        { status: 404 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update batch stock and alert status
  const newBoxesRemaining = batch.boxes_remaining - body.boxes_sold
  
  // Calculate alert status based on stock levels
  let alertStatus = 'healthy'
  if (newBoxesRemaining <= batch.critical_level) {
    alertStatus = 'critical'
  } else if (newBoxesRemaining <= batch.reorder_level) {
    alertStatus = 'warning'
  }

  const { error: updateError } = await supabase
    .from('stock_batches')
    .update({
      boxes_remaining: newBoxesRemaining,
      status: newBoxesRemaining === 0 ? 'depleted' : 'active',
      alert_status: alertStatus,
    })
    .eq('id', body.batch_id)

  if (updateError) {
    // Rollback the sale if batch update fails
    await supabase.from('daily_sales').delete().eq('id', sale.id)
    return NextResponse.json(
      { error: `Failed to update batch stock: ${updateError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json(sale as DailySale, { status: 201 })
}
