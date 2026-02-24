import { TopPerformers } from "@/components/analytics/top-performers";

export default function TopPerformersPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Top Performers</h2>
        <p className="text-gray-600 mt-2">
          Your best-selling products ranked by revenue, profit, margin, and volume
        </p>
      </div>

      <TopPerformers />
    </div>
  );
}
