import { StockAlerts } from "@/components/analytics/stock-alerts";

export default function StockAlertsPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Stock Alerts</h2>
        <p className="text-gray-600 mt-2">
          Real-time inventory monitoring with intelligent reorder recommendations
        </p>
      </div>

      <StockAlerts />
    </div>
  );
}
