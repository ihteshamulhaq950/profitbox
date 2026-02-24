"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

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

interface StockAlertsData {
  totalAlerts: number;
  criticalCount: number;
  warningCount: number;
  alerts: StockAlert[];
}

export function StockAlerts() {
  const [data, setData] = useState<StockAlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/stock-alerts`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("supabase.auth.token")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch stock alerts");
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading stock alerts...</div>;
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-600">Total Alerts</div>
          <div className="text-3xl font-bold mt-2">{data.totalAlerts}</div>
        </Card>
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="text-sm text-red-700 font-medium">Critical</div>
          <div className="text-3xl font-bold text-red-600 mt-2">{data.criticalCount}</div>
        </Card>
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <div className="text-sm text-yellow-700 font-medium">Warning</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">{data.warningCount}</div>
        </Card>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {data.alerts.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No stock alerts at this time. Your inventory is healthy.
          </Card>
        ) : (
          data.alerts.map((alert) => (
            <Card
              key={alert.batchId}
              className={`p-5 border-l-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex gap-4">
                <div className="shrink-0 mt-1">{getSeverityIcon(alert.severity)}</div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{alert.productName}</h3>
                      <p className="text-sm text-gray-600">{alert.sku}</p>
                    </div>
                    <div
                      className={`text-right text-xs font-medium px-2 py-1 rounded ${
                        alert.severity === "critical"
                          ? "bg-red-200 text-red-700"
                          : alert.severity === "warning"
                          ? "bg-yellow-200 text-yellow-700"
                          : "bg-blue-200 text-blue-700"
                      }`}
                    >
                      {alert.severity.toUpperCase()}
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                    <div>
                      <div className="text-xs text-gray-600">Boxes Remaining</div>
                      <div className="font-semibold text-lg">{alert.boxesRemaining}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Daily Average Sales</div>
                      <div className="font-semibold text-lg">{alert.avgDailySales.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Days Until Stockout</div>
                      <div className={`font-semibold text-lg ${
                        alert.daysUntilStockout <= 3
                          ? "text-red-600"
                          : alert.daysUntilStockout <= 7
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}>
                        {alert.daysUntilStockout.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Supplier & Recommendation */}
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Supplier:</span> {alert.supplier}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {alert.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
