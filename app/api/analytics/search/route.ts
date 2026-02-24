import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "decimal.js";

interface TopPerformer {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  boxesSold: number;
  avgPricePerBox: number;
  trend: "up" | "down" | "flat";
  trendPercent: number;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const days = parseInt(searchParams.get("days") || "30");
  const sortBy = searchParams.get("sortBy") || "revenue";
  const limit = parseInt(searchParams.get("limit") || "100");

  // Validate date parameter
  if (isNaN(days) || days <= 0) {
    return NextResponse.json({ error: "Invalid days parameter" }, { status: 400 });
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Validate dates before formatting
    if (isNaN(endDate.getTime()) || isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }

    // Fetch daily sales data
    const { data: dailySales, error: salesError } = await supabase
      .from("daily_sales")
      .select(
        `
        *,
        product_id (
          id,
          name,
          sku,
          category
        ),
        batch_id (
          cost_per_box
        )
      `
      )
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (salesError) throw salesError;

    // Group by product and calculate metrics
    const productMetrics: Record<string, any> = {};

    dailySales?.forEach((sale: any) => {
      const productId = sale.product_id?.id;
      const productName = sale.product_id?.name || "Unknown";
      const sku = sale.product_id?.sku || "";
      const category = sale.product_id?.category || "";

      if (!productId) return;

      if (!productMetrics[productId]) {
        productMetrics[productId] = {
          productId,
          productName,
          sku,
          category,
          totalRevenue: new Decimal(0),
          totalCost: new Decimal(0),
          boxesSold: 0,
          salesCount: 0,
        };
      }

      const quantity = sale.boxes_sold || 0;
      const pricePerUnit = new Decimal(sale.selling_price_per_box || 0);
      const costPerUnit = new Decimal(sale.batch_id?.cost_per_box || 0);

      const revenue = pricePerUnit.times(quantity);
      const cost = costPerUnit.times(quantity);

      productMetrics[productId].totalRevenue = productMetrics[productId].totalRevenue.plus(
        revenue
      );
      productMetrics[productId].totalCost = productMetrics[productId].totalCost.plus(cost);
      productMetrics[productId].boxesSold += quantity;
      productMetrics[productId].salesCount += 1;
    });

    // Convert to array and calculate final metrics
    let performers: TopPerformer[] = Object.values(productMetrics)
      .map((metric: any) => {
        const revenue = parseFloat(metric.totalRevenue.toString());
        const cost = parseFloat(metric.totalCost.toString());
        const profit = revenue - cost;
        const avgPricePerBox =
          metric.boxesSold > 0
            ? parseFloat((metric.totalRevenue.dividedBy(metric.boxesSold)).toString())
            : 0;
        const profitMargin =
          revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(2)) : 0;

        return {
          productId: metric.productId,
          productName: metric.productName,
          sku: metric.sku,
          category: metric.category,
          revenue,
          cost,
          profit,
          profitMargin,
          boxesSold: metric.boxesSold,
          avgPricePerBox,
          trend: "flat" as const,
          trendPercent: 0,
        };
      })
      .filter((p) => p.productName || p.sku || p.category);

    // Filter by search query
    if (query.trim() !== "") {
      const lowerQuery = query.toLowerCase();
      performers = performers.filter(
        (p) =>
          p.productName.toLowerCase().includes(lowerQuery) ||
          p.sku.toLowerCase().includes(lowerQuery) ||
          p.category.toLowerCase().includes(lowerQuery)
      );
    }

    // Sort by specified field
    performers.sort((a, b) => {
      switch (sortBy) {
        case "profit":
          return b.profit - a.profit;
        case "margin":
          return b.profitMargin - a.profitMargin;
        case "volume":
          return b.boxesSold - a.boxesSold;
        case "revenue":
        default:
          return b.revenue - a.revenue;
      }
    });

    // Apply limit
    const limitedPerformers = performers.slice(0, limit);

    return NextResponse.json(limitedPerformers);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search performers" },
      { status: 500 }
    );
  }
}
