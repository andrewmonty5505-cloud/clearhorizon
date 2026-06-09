import { EstimatesListClient } from "@/components/estimates/estimates-list-client";

export default function EstimatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estimates</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all cleaning estimates</p>
        </div>
      </div>
      <EstimatesListClient />
    </div>
  );
}
