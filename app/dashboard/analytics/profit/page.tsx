import { ProfitAnalytics } from "@/components/analytics/profit-analytics";

export default function ProfitAnalyticsPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profit Analytics</h2>
        <p className="text-gray-600 mt-2">
          Detailed analysis of your revenue, costs, and profit margins by product
        </p>
      </div>

      <ProfitAnalytics />
    </div>
  );
}
