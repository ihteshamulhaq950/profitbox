// app/api/inventory/analytics/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/inventory/analytics?from_date=2024-01-01T00:00:00Z&to_date=2024-01-31T23:59:59Z
 * Get inventory analytics with optional date filtering
 * Returns: { totalValue, totalBoxes, totalBatches }
 * Dates should be ISO 8601 timestamp strings for proper timestampz filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')

    console.log("\n=== INVENTORY ANALYTICS API ===")
    console.log("User ID:", user.id)
    console.log("Date range:", from_date, "to", to_date)

    // Base query - fetch active batches with created_at
    let query = supabase
      .from('stock_batches')
      .select('boxes_remaining, cost_per_box, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'active')

    // Apply date filters if provided (use ISO 8601 timestamps)
    if (from_date && to_date) {
      console.log("Filtering by date range")
      query = query
        .gte('created_at', from_date)
        .lte('created_at', to_date)
    } else if (from_date) {
      query = query.gte('created_at', from_date)
    } else if (to_date) {
      query = query.lte('created_at', to_date)
    }

    const { data: batches, error, count } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("Batches found:", count)

    // Calculate totals
    let totalValue = 0
    let totalBoxes = 0

    batches?.forEach((batch) => {
      const boxes = batch.boxes_remaining
      const cost = parseFloat(batch.cost_per_box.toString())
      totalBoxes += boxes
      totalValue += boxes * cost
    })

    const result = {
      totalValue: Math.round(totalValue * 100) / 100, // Round to 2 decimals
      totalBoxes,
      totalBatches: count || 0
    }

    console.log("Result:", result)
    console.log("=== END INVENTORY ANALYTICS ===\n")

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching inventory analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}