import { NextRequest, NextResponse } from "next/server";
import Decimal from "decimal.js";
import { createClient } from "@/lib/supabase/server";


interface TopPerformer {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  revenue: Decimal;
  cost: Decimal;
  profit: Decimal;
  profitMargin: number;
  boxesSold: number;
  avgPricePerBox: Decimal;
  trend: "up" | "down" | "flat";
  trendPercent: number;
}

interface TopPerformersData {
  byRevenue: TopPerformer[];
  byProfit: TopPerformer[];
  byMargin: TopPerformer[];
  byVolume: TopPerformer[];
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    
    // Parse days with validation
    let days = 30;
    const daysParam = searchParams.get("days");
    if (daysParam) {
      const parsedDays = parseInt(daysParam);
      if (!isNaN(parsedDays) && parsedDays > 0) {
        days = parsedDays;
      }
    }
    
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10;

    // Current period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Validate dates
    if (isNaN(endDate.getTime()) || isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    // Previous period for trend
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    // Fetch current period sales
    const { data: currentSales, error: currentError } = await supabase
      .from("daily_sales")
      .select(
        `
        id,
        boxes_sold,
        selling_price_per_box,
        product_id,
        batch_id,
        created_at,
        product_id(id, name, sku, category),
        batch_id(cost_per_box)
      `
      )
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (currentError) throw currentError;

    // Fetch previous period sales for trend
    const { data: prevSales, error: prevError } = await supabase
      .from("daily_sales")
      .select(`
        product_id,
        boxes_sold,
        selling_price_per_box,
        batch_id(cost_per_box)
      `)
      .eq("user_id", user.id)
      .gte("created_at", prevStartDate.toISOString())
      .lt("created_at", startDate.toISOString());

    if (prevError) throw prevError;

    // Process current period
    const productMap = new Map<
      string,
      {
        name: string;
        sku: string;
        category: string;
        revenue: Decimal;
        cost: Decimal;
        boxesSold: number;
      }
    >();

    currentSales.forEach((sale: any) => {
      const revenue = new Decimal(sale.selling_price_per_box || 0).times(sale.boxes_sold || 0);
      const cost = new Decimal(sale.batch_id?.cost_per_box || 0).times(sale.boxes_sold || 0);

      const productId = sale.product_id?.id || "unknown";
      const existing = productMap.get(productId);

      if (existing) {
        existing.revenue = existing.revenue.plus(revenue);
        existing.cost = existing.cost.plus(cost);
        existing.boxesSold += sale.boxes_sold || 0;
      } else {
        productMap.set(productId, {
          name: sale.product_id?.name || "Unknown",
          sku: sale.product_id?.sku || "Unknown",
          category: sale.product_id?.category || "Uncategorized",
          revenue,
          cost,
          boxesSold: sale.boxes_sold || 0,
        });
      }
    });

    // Process previous period
    const prevProductMap = new Map<string, Decimal>();
    prevSales.forEach((sale: any) => {
      const revenue = new Decimal(sale.selling_price_per_box || 0).times(sale.boxes_sold || 0);
      const productId = sale.product_id || "unknown";
      const existing = prevProductMap.get(productId);
      prevProductMap.set(productId, existing ? existing.plus(revenue) : revenue);
    });

    // Calculate performers
    const performers: TopPerformer[] = Array.from(productMap.entries())
      .map(([productId, data]) => {
        const profit = data.revenue.minus(data.cost);
        const profitMargin =
          data.revenue.toNumber() > 0
            ? profit.dividedBy(data.revenue).times(100).toNumber()
            : 0;

        const avgPrice = new Decimal(data.boxesSold > 0 ? data.revenue.dividedBy(data.boxesSold) : 0);

        // Calculate trend
        const prevRevenue = prevProductMap.get(productId) || new Decimal(0);
        let trend: "up" | "down" | "flat" = "flat";
        let trendPercent = 0;

        if (prevRevenue.toNumber() > 0) {
          trendPercent =
            data.revenue
              .minus(prevRevenue)
              .dividedBy(prevRevenue)
              .times(100)
              .toNumber() || 0;
          trendPercent = Math.round(trendPercent * 10) / 10;
          if (trendPercent > 5) trend = "up";
          else if (trendPercent < -5) trend = "down";
        }

        return {
          productId,
          productName: data.name,
          sku: data.sku,
          category: data.category,
          revenue: data.revenue,
          cost: data.cost,
          profit,
          profitMargin: Math.round(profitMargin * 100) / 100,
          boxesSold: data.boxesSold,
          avgPricePerBox: avgPrice,
          trend,
          trendPercent,
        };
      });

    const response: TopPerformersData = {
      byRevenue: performers.sort((a, b) => b.revenue.toNumber() - a.revenue.toNumber()).slice(0, limit),
      byProfit: performers.sort((a, b) => b.profit.toNumber() - a.profit.toNumber()).slice(0, limit),
      byMargin: performers.sort((a, b) => b.profitMargin - a.profitMargin).slice(0, limit),
      byVolume: performers.sort((a, b) => b.boxesSold - a.boxesSold).slice(0, limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Top Performers Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
