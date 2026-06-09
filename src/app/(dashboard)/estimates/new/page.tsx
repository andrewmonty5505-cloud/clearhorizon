import { EstimateWizard } from "@/components/estimates/estimate-wizard";

export default function NewEstimatePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Estimate</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Follow the steps to generate an accurate cleaning estimate
        </p>
      </div>
      <EstimateWizard />
    </div>
  );
}
