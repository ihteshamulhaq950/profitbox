"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import Decimal from "decimal.js";

interface ProfitAnalyticsData {
  totalRevenue: Decimal | number;
  totalCost: Decimal | number;
  totalProfit: Decimal | number;
  profitMarginPercent: number;
  productCount: number;
  averageProfitPerProduct: Decimal | number;
  byProduct: Array<{
    productId: string;
    productName: string;
    sku: string;
    revenue: Decimal | number;
    cost: Decimal | number;
    profit: Decimal | number;
    profitMargin: number;
    boxesSold: number;
  }>;
}

export function ProfitAnalytics() {
  const [data, setData] = useState<ProfitAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/profit?days=${days}`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("supabase.auth.token")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch analytics");
        const json = await response.json();

        // Convert Decimal strings to numbers
        const parsed = {
          ...json,
          totalRevenue: parseFloat(json.totalRevenue) || 0,
          totalCost: parseFloat(json.totalCost) || 0,
          totalProfit: parseFloat(json.totalProfit) || 0,
          averageProfitPerProduct: parseFloat(json.averageProfitPerProduct) || 0,
          byProduct: json.byProduct.map((p: any) => ({
            ...p,
            revenue: parseFloat(p.revenue) || 0,
            cost: parseFloat(p.cost) || 0,
            profit: parseFloat(p.profit) || 0,
          })),
        };
        setData(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days]);

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Time Filter */}
      <div className="flex gap-2">
        {[7, 30, 90, 365].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              days === d
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {d === 7 ? "7d" : d === 30 ? "30d" : d === 90 ? "90d" : "1y"}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-600">Total Revenue</div>
          <div className="text-2xl font-bold mt-2">{formatCurrency(data.totalRevenue as number)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600">Total Cost</div>
          <div className="text-2xl font-bold mt-2">{formatCurrency(data.totalCost as number)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600">Total Profit</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(data.totalProfit as number)}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600">Profit Margin</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{data.profitMarginPercent}%</div>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Average Profit per Product</div>
            <div className="text-xl font-bold">
              {formatCurrency(data.averageProfitPerProduct as number)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Products Sold</div>
            <div className="text-xl font-bold">{data.productCount}</div>
          </div>
        </div>
      </Card>

      {/* Product Breakdown */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Profit by Product</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Product</th>
                <th className="text-right py-2 font-medium">Boxes Sold</th>
                <th className="text-right py-2 font-medium">Revenue</th>
                <th className="text-right py-2 font-medium">Cost</th>
                <th className="text-right py-2 font-medium">Profit</th>
                <th className="text-right py-2 font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {data.byProduct.map((product) => (
                <tr key={product.productId} className="border-b hover:bg-gray-50">
                  <td className="py-3">
                    <div>
                      <div className="font-medium">{product.productName}</div>
                      <div className="text-xs text-gray-500">{product.sku}</div>
                    </div>
                  </td>
                  <td className="text-right">{product.boxesSold}</td>
                  <td className="text-right">{formatCurrency(product.revenue as number)}</td>
                  <td className="text-right">{formatCurrency(product.cost as number)}</td>
                  <td className="text-right font-medium text-green-600">
                    {formatCurrency(product.profit as number)}
                  </td>
                  <td className="text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        product.profitMargin >= 25
                          ? "bg-green-100 text-green-700"
                          : product.profitMargin >= 15
                          ? "bg-blue-100 text-blue-700"
                          : product.profitMargin > 0
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.profitMargin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
