import { NextRequest, NextResponse } from "next/server";
import Decimal from "decimal.js";
import { createClient } from "@/lib/supabase/server";


interface ProfitAnalytics {
  totalRevenue: Decimal;
  totalCost: Decimal;
  totalProfit: Decimal;
  profitMarginPercent: number;
  productCount: number;
  averageProfitPerProduct: Decimal;
  byProduct: Array<{
    productId: string;
    productName: string;
    sku: string;
    revenue: Decimal;
    cost: Decimal;
    profit: Decimal;
    profitMargin: number;
    boxesSold: number;
  }>;
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

    // Get date filter from query params
    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days") ? parseInt(searchParams.get("days")!) : 30;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all sales data for the period with product info
    const { data: salesData, error: salesError } = await supabase
      .from("daily_sales")
      .select(
        `
        id,
        boxes_sold,
        selling_price_per_box,
        product_id,
        batch_id,
        created_at,
        product_id(id, name, sku),
        batch_id(cost_per_box)
      `
      )
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (salesError) throw salesError;

    // Calculate analytics
    let totalRevenue = new Decimal(0);
    let totalCost = new Decimal(0);
    const productMap = new Map<
      string,
      {
        name: string;
        sku: string;
        revenue: Decimal;
        cost: Decimal;
        boxesSold: number;
      }
    >();

    salesData.forEach((sale: any) => {
      const revenue = new Decimal(sale.selling_price_per_box || 0).times(sale.boxes_sold || 0);
      const cost = new Decimal(sale.batch_id?.cost_per_box || 0).times(sale.boxes_sold || 0);

      totalRevenue = totalRevenue.plus(revenue);
      totalCost = totalCost.plus(cost);

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
          revenue,
          cost,
          boxesSold: sale.boxes_sold || 0,
        });
      }
    });

    const totalProfit = totalRevenue.minus(totalCost);
    const profitMargin =
      totalRevenue.toNumber() > 0
        ? totalProfit.dividedBy(totalRevenue).times(100).toNumber()
        : 0;

    const byProduct = Array.from(productMap.entries())
      .map(([productId, data]) => {
        const profit = data.revenue.minus(data.cost);
        const margin =
          data.revenue.toNumber() > 0
            ? profit.dividedBy(data.revenue).times(100).toNumber()
            : 0;

        return {
          productId,
          productName: data.name,
          sku: data.sku,
          revenue: data.revenue,
          cost: data.cost,
          profit,
          profitMargin: Math.round(margin * 100) / 100,
          boxesSold: data.boxesSold,
        };
      })
      .sort((a, b) => b.profit.toNumber() - a.profit.toNumber());

    const analytics: ProfitAnalytics = {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMarginPercent: Math.round(profitMargin * 100) / 100,
      productCount: productMap.size,
      averageProfitPerProduct:
        productMap.size > 0 ? totalProfit.dividedBy(productMap.size) : new Decimal(0),
      byProduct,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Profit Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
