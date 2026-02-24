import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Decimal from 'decimal.js'

/**
 * GET /api/sales/analytics?from_date=2024-01-01T00:00:00Z&to_date=2024-12-31T23:59:59Z
 * Fetch detailed sales analytics with comprehensive metrics
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
  const fromDate = searchParams.get('from_date')
  const toDate = searchParams.get('to_date')

  let query = supabase
    .from('daily_sales')
    .select(
      `
      id,
      created_at,
      boxes_sold,
      selling_price_per_box,
      batch_id,
      stock_batches(cost_per_box),
      products(name, category)
    `
    )
    .eq('user_id', user.id)

  // Use ISO 8601 timestamps for proper timestampz filtering
  if (fromDate) {
    query = query.gte('created_at', fromDate)
  }

  if (toDate) {
    query = query.lte('created_at', toDate)
  }

  const { data: sales, error } = await query.order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calculate detailed analytics
  const analyticsData: Record<
    string,
    {
      revenue: Decimal
      profit: Decimal
      cost: Decimal
      boxes: number
      transactions: number
      avgPrice: Decimal
    }
  > = {}

  let totalRevenue = new Decimal(0)
  let totalCost = new Decimal(0)
  let totalBoxes = 0
  let totalProfit = new Decimal(0)
  const topProducts: Record<string, { revenue: Decimal; boxes: number; profit: Decimal }> = {}
  const topCategories: Record<string, { revenue: Decimal; boxes: number; profit: Decimal }> = {}

  sales.forEach((sale: any) => {
    const dateKey = sale.created_at.split('T')[0]
    const sellingPrice = new Decimal(sale.selling_price_per_box)
    const costPrice = new Decimal(sale.stock_batches?.cost_per_box || 0)
    const boxes = sale.boxes_sold
    const dayRevenue = sellingPrice.times(boxes)
    const dayCost = costPrice.times(boxes)
    const dayProfit = dayRevenue.minus(dayCost)

    // Daily breakdown
    if (!analyticsData[dateKey]) {
      analyticsData[dateKey] = {
        revenue: new Decimal(0),
        cost: new Decimal(0),
        profit: new Decimal(0),
        boxes: 0,
        transactions: 0,
        avgPrice: new Decimal(0),
      }
    }
    analyticsData[dateKey].revenue = analyticsData[dateKey].revenue.plus(dayRevenue)
    analyticsData[dateKey].cost = analyticsData[dateKey].cost.plus(dayCost)
    analyticsData[dateKey].profit = analyticsData[dateKey].profit.plus(dayProfit)
    analyticsData[dateKey].boxes += boxes
    analyticsData[dateKey].transactions += 1

    // Totals
    totalRevenue = totalRevenue.plus(dayRevenue)
    totalCost = totalCost.plus(dayCost)
    totalProfit = totalProfit.plus(dayProfit)
    totalBoxes += boxes

    // Top products
    const productName = sale.products?.name || 'Unknown'
    if (!topProducts[productName]) {
      topProducts[productName] = {
        revenue: new Decimal(0),
        boxes: 0,
        profit: new Decimal(0),
      }
    }
    topProducts[productName].revenue = topProducts[productName].revenue.plus(dayRevenue)
    topProducts[productName].boxes += boxes
    topProducts[productName].profit = topProducts[productName].profit.plus(dayProfit)

    // Top categories
    const category = sale.products?.category || 'Uncategorized'
    if (!topCategories[category]) {
      topCategories[category] = {
        revenue: new Decimal(0),
        boxes: 0,
        profit: new Decimal(0),
      }
    }
    topCategories[category].revenue = topCategories[category].revenue.plus(dayRevenue)
    topCategories[category].boxes += boxes
    topCategories[category].profit = topCategories[category].profit.plus(dayProfit)
  })

  // Calculate averages
  const avgPrice = totalBoxes > 0 ? totalRevenue.dividedBy(totalBoxes) : new Decimal(0)
  const profitMargin = totalRevenue.greaterThan(0) ? totalProfit.dividedBy(totalRevenue).times(100) : new Decimal(0)

  // Convert daily data for charting
  const dailyData = Object.entries(analyticsData).map(([date, data]) => ({
    date,
    revenue: data.revenue.toNumber(),
    cost: data.cost.toNumber(),
    profit: data.profit.toNumber(),
    boxes: data.boxes,
    transactions: data.transactions,
    avgPrice: data.boxes > 0 ? data.revenue.dividedBy(data.boxes).toNumber() : 0,
  }))

  // Top products sorted by revenue
  const topProductsList = Object.entries(topProducts)
    .sort(([, a], [, b]) => b.revenue.minus(a.revenue).toNumber())
    .slice(0, 10)
    .map(([name, data]) => ({
      name,
      revenue: data.revenue.toNumber(),
      boxes: data.boxes,
      profit: data.profit.toNumber(),
      avgPrice: data.boxes > 0 ? data.revenue.dividedBy(data.boxes).toNumber() : 0,
    }))

  // Top categories sorted by revenue
  const topCategoriesList = Object.entries(topCategories)
    .sort(([, a], [, b]) => b.revenue.minus(a.revenue).toNumber())
    .slice(0, 10)
    .map(([name, data]) => ({
      name,
      revenue: data.revenue.toNumber(),
      boxes: data.boxes,
      profit: data.profit.toNumber(),
      avgPrice: data.boxes > 0 ? data.revenue.dividedBy(data.boxes).toNumber() : 0,
    }))

  return NextResponse.json({
    summary: {
      totalRevenue: totalRevenue.toNumber(),
      totalCost: totalCost.toNumber(),
      totalProfit: totalProfit.toNumber(),
      profitMargin: profitMargin.toNumber(),
      totalBoxes,
      avgPrice: avgPrice.toNumber(),
      totalTransactions: sales.length,
    },
    dailyData,
    topProducts: topProductsList,
    topCategories: topCategoriesList,
  })
}
