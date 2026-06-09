"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface PricingConfig {
  id: string;
  key: string;
  value: string;
  category: string;
  label: string;
  description: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  hourly_rate: "Hourly Rates",
  minimum_charge: "Minimum Charges",
  frequency: "Frequency Multipliers",
  travel: "Travel Fees",
  addon: "Add-on Pricing",
  seasonal: "Seasonal Multipliers",
};

export function SettingsClient() {
  const [configs, setConfigs] = useState<PricingConfig[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/settings/pricing")
      .then(r => r.json())
      .then(d => {
        setConfigs(d.data || []);
        const initial: Record<string, string> = {};
        (d.data || []).forEach((c: PricingConfig) => { initial[c.key] = c.value; });
        setEdits(initial);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (category: string) => {
    setSaving(true);
    const categoryConfigs = configs.filter(c => c.category === category);
    const updates = categoryConfigs.map(c => ({ key: c.key, value: edits[c.key] ?? c.value }));
    try {
      const res = await fetch("/api/settings/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Saved!", description: `${CATEGORY_LABELS[category] || category} updated successfully.` });
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const updates = configs.map(c => ({ key: c.key, value: edits[c.key] ?? c.value }));
    try {
      const res = await fetch("/api/settings/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "All settings saved!" });
    } catch {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const categories = [...new Set(configs.map(c => c.category))];

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue={categories[0] || "hourly_rate"}>
        <TabsList className="flex-wrap h-auto gap-1 mb-4">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs">
              {CATEGORY_LABELS[cat] || cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(cat => {
          const catConfigs = configs.filter(c => c.category === cat);
          return (
            <TabsContent key={cat} value={cat}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{CATEGORY_LABELS[cat] || cat}</CardTitle>
                    <CardDescription>
                      {cat === "hourly_rate" && "Base hourly rates by service market area"}
                      {cat === "minimum_charge" && "Minimum service charges per market"}
                      {cat === "frequency" && "Price multipliers based on service frequency"}
                      {cat === "travel" && "Travel fees by distance range"}
                      {cat === "addon" && "Pricing for optional add-on services"}
                      {cat === "seasonal" && "Seasonal pricing adjustments"}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleSave(cat)} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />Save
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {catConfigs.map(config => (
                      <div key={config.key} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">{config.label}</label>
                          {cat === "hourly_rate" || cat === "minimum_charge" || cat === "travel" || cat === "addon"
                            ? <span className="text-xs text-muted-foreground">$</span>
                            : <span className="text-xs text-muted-foreground">×</span>
                          }
                        </div>
                        <Input
                          type="number"
                          step={cat === "frequency" || cat === "seasonal" ? "0.01" : "1"}
                          value={edits[config.key] ?? config.value}
                          onChange={e => setEdits(p => ({ ...p, [config.key]: e.target.value }))}
                          className="font-mono"
                        />
                        {config.description && (
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
