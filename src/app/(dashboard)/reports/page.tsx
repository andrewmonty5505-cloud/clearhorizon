import { ReportsClient } from "@/components/reports/reports-client";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Analyze estimates, revenue projections, and conversions</p>
      </div>
      <ReportsClient />
    </div>
  );
}
