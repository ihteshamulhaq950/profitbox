// app/api/products/analytics/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/products/analytics?from_date=2024-01-01T00:00:00Z&to_date=2024-01-31T23:59:59Z
 * Get product analytics with optional date filtering
 * Returns: { total, active, inactive }
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

    console.log("\n=== ANALYTICS API CALLED ===")
    console.log("User ID:", user.id)
    console.log("Params - from_date:", from_date, "to_date:", to_date)

    // First, let's see ALL products for this user with their created_at dates
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('id, name, sku, is_active, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    console.log("\n--- ALL USER PRODUCTS ---")
    console.log("Total products in DB:", allProducts?.length || 0)
    allProducts?.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (${p.sku}) - Created: ${p.created_at} - Active: ${p.is_active}`)
    })

    // Base query - fetch products with is_active field
    let query = supabase
      .from('products')
      .select('is_active, created_at', { count: 'exact' })
      .eq('user_id', user.id)

    // Apply date filters if provided (use ISO 8601 timestamps)
    if (from_date && to_date) {
      console.log("\n--- DATE FILTERING ---")
      console.log("Input dates:", from_date, "to", to_date)
      
      query = query
        .gte('created_at', from_date)
        .lte('created_at', to_date)
      
      console.log("Filtering created_at >= ", from_date)
      console.log("Filtering created_at <= ", to_date)
    } else if (from_date) {
      console.log("\n--- DATE FILTERING (from only) ---")
      console.log("Start date:", from_date)
      query = query.gte('created_at', from_date)
    } else if (to_date) {
      console.log("\n--- DATE FILTERING (to only) ---") 
      console.log("End date:", to_date)
      query = query.lte('created_at', to_date)
    } else {
      console.log("\n--- NO DATE FILTERING (ALL TIME) ---")
    }

    const { data: products, error, count } = await query

    if (error) {
      console.error("\n!!! DATABASE ERROR !!!", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("\n--- FILTERED RESULTS ---")
    console.log("Filtered count:", count)
    console.log("Filtered products returned:", products?.length)
    products?.forEach((p, i) => {
      console.log(`${i + 1}. Created: ${p.created_at} - Active: ${p.is_active}`)
    })

    // Calculate active/inactive counts
    const total = count || 0
    const active = products?.filter(p => p.is_active).length || 0
    const inactive = total - active

    const result = {
      total,
      active,
      inactive
    }

    console.log("\n--- FINAL RESULT ---")
    console.log("Total:", result.total)
    console.log("Active:", result.active)
    console.log("Inactive:", result.inactive)
    console.log("=== END ANALYTICS API ===\n")

    return NextResponse.json(result)
  } catch (error) {
    console.error('\n!!! CATCH ERROR !!!', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}