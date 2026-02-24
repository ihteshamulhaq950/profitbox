import { WeeklyReport } from "@/components/analytics/weekly-report";

export default function WeeklyReportPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Weekly Report</h2>
        <p className="text-gray-600 mt-2">
          AI-powered insights and analysis of your business performance this week
        </p>
      </div>

      <WeeklyReport />
    </div>
  );
}
