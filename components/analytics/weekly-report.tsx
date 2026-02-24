"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

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
  narrative: string;
}

export function WeeklyReport() {
  const [data, setData] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/weekly-report`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("supabase.auth.token")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch weekly report");
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading weekly report...</div>;
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

  const isPositiveChange = data.revenueChange >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Weekly Report</h2>
        <p className="text-gray-600">{data.period}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-600">Weekly Revenue</div>
          <div className="text-3xl font-bold mt-2">{formatCurrency(data.totalRevenue)}</div>
          <div
            className={`text-sm mt-2 flex items-center gap-1 ${
              isPositiveChange ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositiveChange ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {Math.abs(data.revenueChange)}% vs last week
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600">Weekly Profit</div>
          <div className="text-3xl font-bold mt-2 text-green-600">
            {formatCurrency(data.totalProfit)}
          </div>
          <div className="text-sm mt-2 text-green-600">
            {data.profitMargin}% margin
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600">Boxes Sold</div>
          <div className="text-3xl font-bold mt-2">{data.totalBoxesSold}</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600">Total Products</div>
          <div className="text-3xl font-bold mt-2">{data.topProducts.length}</div>
        </Card>
      </div>

      {/* AI-Generated Narrative */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-3 text-blue-900">Weekly Summary</h3>
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {data.narrative}
        </p>
      </Card>

      {/* Top Products */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Top Products This Week</h3>
        <div className="space-y-3">
          {data.topProducts.map((product, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">{index + 1}. {product.name}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(product.revenue)}</div>
                <div className="text-sm text-green-600">{formatCurrency(product.profit)} profit</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Low Stock Alerts */}
      {data.lowStockProducts.length > 0 && (
        <Card className="p-6 border-l-4 border-yellow-400 bg-yellow-50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Low Stock Products
          </h3>
          <div className="space-y-2">
            {data.lowStockProducts.map((product, index) => (
              <div key={index} className="text-sm text-yellow-900">
                • {product}
              </div>
            ))}
          </div>
          <p className="text-xs text-yellow-700 mt-3">
            Remember to reorder these items to avoid stockouts.
          </p>
        </Card>
      )}
    </div>
  );
}
