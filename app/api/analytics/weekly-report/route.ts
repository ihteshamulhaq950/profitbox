import { NextRequest, NextResponse } from "next/server";
import Decimal from "decimal.js";
import { createClient } from "@/lib/supabase/server";

interface WeeklyReportData {
  period: string;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  totalBoxesSold: number;
  previousWeekRevenue: number;
  revenueChange: number;
  topProducts: Array<{ name: string; revenue: number; profit: number }>;
  lowStockProducts: string[];
  narrative: string; // Changed from aiNarrative to narrative
}

/**
 * Generate insights narrative from data (no API calls)
 */
function generateNarrative(data: {
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  totalBoxesSold: number;
  revenueChange: number;
  topProducts: Array<{ name: string; revenue: number; profit: number }>;
  lowStockProducts: string[];
}): string {
  const narratives: string[] = [];

  // Revenue insight
  if (data.revenueChange > 0) {
    narratives.push(
      `Strong week! Revenue grew by ${data.revenueChange.toFixed(1)}% compared to last week, reaching PKR ${data.totalRevenue.toLocaleString()}.`
    );
  } else if (data.revenueChange < 0) {
    narratives.push(
      `Revenue declined by ${Math.abs(data.revenueChange).toFixed(1)}% this week. Consider reviewing your pricing or marketing strategy.`
    );
  } else {
    narratives.push(`Revenue remained stable at PKR ${data.totalRevenue.toLocaleString()} this week.`);
  }

  // Profit insight
  narratives.push(
    `Profit margin stands at ${data.profitMargin.toFixed(1)}%, with total profit of PKR ${data.totalProfit.toLocaleString()}.`
  );

  // Top product insight
  if (data.topProducts.length > 0) {
    const topProduct = data.topProducts[0];
    narratives.push(
      `Your top performing product is "${topProduct.name}" with PKR ${topProduct.revenue.toLocaleString()} in revenue.`
    );
  }

  // Sales volume insight
  if (data.totalBoxesSold > 0) {
    narratives.push(`You sold ${data.totalBoxesSold.toLocaleString()} boxes this week.`);
  }

  // Low stock warning
  if (data.lowStockProducts.length > 0) {
    narratives.push(
      `⚠️ Low stock alert: ${data.lowStockProducts.slice(0, 3).join(", ")} are running low. Consider reordering soon.`
    );
  }

  return narratives.join(" ");
}

export async function GET(request: NextRequest) {
    const supabase = await createClient();
  try {
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Current week (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Previous week
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - 7);

    // Get current week sales
    const { data: currentWeekSales, error: error1 } = await supabase
      .from("daily_sales")
      .select(
        `
        boxes_sold,
        selling_price_per_box,
        product_id,
        batch_id,
        product_id(id, name),
        batch_id(cost_per_box)
      `
      )
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error1) throw error1;

    // Get previous week sales
    const { data: prevWeekSales, error: error2 } = await supabase
      .from("daily_sales")
      .select("boxes_sold, selling_price_per_box, batch_id(cost_per_box)")
      .eq("user_id", user.id)
      .gte("created_at", prevStartDate.toISOString())
      .lt("created_at", startDate.toISOString());

    if (error2) throw error2;

    // Calculate current week metrics
    let totalRevenue = new Decimal(0);
    let totalCost = new Decimal(0);
    let totalBoxesSold = 0;
    const productMap = new Map<string, { name: string; revenue: Decimal; cost: Decimal }>();

    currentWeekSales.forEach((sale: any) => {
      const revenue = new Decimal(sale.selling_price_per_box || 0).times(sale.boxes_sold || 0);
      const cost = new Decimal(sale.batch_id?.cost_per_box || 0).times(sale.boxes_sold || 0);

      totalRevenue = totalRevenue.plus(revenue);
      totalCost = totalCost.plus(cost);
      totalBoxesSold += sale.boxes_sold || 0;

      const productId = sale.product_id?.id || "unknown";
      const existing = productMap.get(productId);
      if (existing) {
        existing.revenue = existing.revenue.plus(revenue);
        existing.cost = existing.cost.plus(cost);
      } else {
        productMap.set(productId, {
          name: sale.product_id?.name || "Unknown",
          revenue,
          cost,
        });
      }
    });

    // Calculate previous week revenue
    let prevWeekRevenue = new Decimal(0);
    prevWeekSales.forEach((sale: any) => {
      const revenue = new Decimal(sale.selling_price_per_box || 0).times(sale.boxes_sold || 0);
      prevWeekRevenue = prevWeekRevenue.plus(revenue);
    });

    const totalProfit = totalRevenue.minus(totalCost);
    const profitMargin =
      totalRevenue.toNumber() > 0
        ? totalProfit.dividedBy(totalRevenue).times(100).toNumber()
        : 0;

    const revenueChange =
      prevWeekRevenue.toNumber() > 0
        ? totalRevenue
            .minus(prevWeekRevenue)
            .dividedBy(prevWeekRevenue)
            .times(100)
            .toNumber()
        : 0;

    // Get top 3 products
    const topProducts = Array.from(productMap.values())
      .map((p) => ({
        name: p.name,
        revenue: parseFloat(p.revenue.toString()),
        profit: parseFloat(p.revenue.minus(p.cost).toString()),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    // Get low stock products
    const { data: lowStockBatches } = await supabase
      .from("stock_batches")
      .select("product_id(name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .lt("boxes_remaining", 5);

    const lowStockProducts = lowStockBatches
      ? Array.from(new Set(lowStockBatches.map((b: any) => b.product_id?.name).filter(Boolean)))
      : [];

    // Generate narrative from data (no API calls)
    const narrative = generateNarrative({
      totalRevenue: parseFloat(totalRevenue.toString()),
      totalProfit: parseFloat(totalProfit.toString()),
      profitMargin,
      totalBoxesSold,
      revenueChange,
      topProducts,
      lowStockProducts: lowStockProducts as string[],
    });

    const data: WeeklyReportData = {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      totalRevenue: parseFloat(totalRevenue.toString()),
      totalProfit: parseFloat(totalProfit.toString()),
      profitMargin: Math.round(profitMargin * 100) / 100,
      totalBoxesSold,
      previousWeekRevenue: parseFloat(prevWeekRevenue.toString()),
      revenueChange: Math.round(revenueChange * 100) / 100,
      topProducts,
      lowStockProducts: lowStockProducts as string[],
      narrative,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Weekly Report Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
