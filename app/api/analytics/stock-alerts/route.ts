import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


interface StockAlert {
  productId: string;
  productName: string;
  sku: string;
  batchId: string;
  boxesRemaining: number;
  avgDailySales: number;
  daysUntilStockout: number;
  severity: "critical" | "warning" | "info";
  supplier: string;
  recommendation: string;
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

    // Get active batches with products
    const { data: batches, error: batchError } = await supabase
      .from("stock_batches")
      .select(
        `
        id,
        product_id,
        boxes_remaining,
        boxes_purchased,
        cost_per_box,
        supplier_name,
        created_at,
        product_id(id, name, sku)
      `
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("boxes_remaining", 0);

    if (batchError) throw batchError;

    // Get last 30 days average sales by product
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sales, error: salesError } = await supabase
      .from("daily_sales")
      .select("product_id, boxes_sold, created_at")
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (salesError) throw salesError;

    // Calculate average daily sales per product
    const avgSalesMap = new Map<string, number>();
    sales.forEach((sale: any) => {
      const productId = sale.product_id;
      const existing = avgSalesMap.get(productId) || 0;
      avgSalesMap.set(productId, existing + (sale.boxes_sold || 0));
    });

    // Convert total to average (30 days)
    avgSalesMap.forEach((total, productId) => {
      avgSalesMap.set(productId, total / 30);
    });

    // Calculate alerts
    const alerts: StockAlert[] = batches
      .map((batch: any) => {
        const avgDaily = avgSalesMap.get(batch.product_id?.id) || 2; // Default to 2 if no sales history
        const daysUntilStockout = avgDaily > 0 ? batch.boxes_remaining / avgDaily : 999;

        let severity: "critical" | "warning" | "info";
        if (daysUntilStockout <= 3) severity = "critical";
        else if (daysUntilStockout <= 7) severity = "warning";
        else severity = "info";

        let recommendation = "";
        if (severity === "critical") {
          const recommendedOrder = Math.ceil(avgDaily * 30); // 30-day supply
          recommendation = `URGENT: Order ${recommendedOrder} boxes immediately. Will stockout in ${daysUntilStockout.toFixed(1)} days.`;
        } else if (severity === "warning") {
          const recommendedOrder = Math.ceil(avgDaily * 30);
          recommendation = `Order ${recommendedOrder} boxes soon. Current stock will last ${daysUntilStockout.toFixed(1)} days.`;
        } else {
          recommendation = "Stock levels healthy. Monitor regularly.";
        }

        return {
          productId: batch.product_id?.id,
          productName: batch.product_id?.name,
          sku: batch.product_id?.sku,
          batchId: batch.id,
          boxesRemaining: batch.boxes_remaining,
          avgDailySales: Math.round(avgDaily * 100) / 100,
          daysUntilStockout: Math.round(daysUntilStockout * 10) / 10,
          severity,
          supplier: batch.supplier_name || "Unknown",
          recommendation,
        };
      })
      .filter((alert) => alert.severity !== "info") // Only show critical and warning
      .sort((a, b) => {
        // Sort by severity first, then by days until stockout
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return a.daysUntilStockout - b.daysUntilStockout;
      });

    return NextResponse.json({
      totalAlerts: alerts.length,
      criticalCount: alerts.filter((a) => a.severity === "critical").length,
      warningCount: alerts.filter((a) => a.severity === "warning").length,
      alerts,
    });
  } catch (error) {
    console.error("Stock Alerts Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
