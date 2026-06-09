"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Home, Layers, Star, Settings, Plus, BarChart3,
  ChevronRight, ChevronLeft, Loader2, Check, Search,
  DollarSign, Clock, MapPin, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, cn } from "@/lib/utils";
import { FREQUENCY_LABELS, MARKET_LABELS, SWFL_CITIES } from "@/lib/pricing-engine";
import type { PricingBreakdown } from "@/types";

const steps = [
  { id: 1, title: "Customer", icon: User, description: "Customer information" },
  { id: 2, title: "Property", icon: Home, description: "Property details" },
  { id: 3, title: "Conditions", icon: Layers, description: "Home conditions" },
  { id: 4, title: "Features", icon: Star, description: "Special features" },
  { id: 5, title: "Service", icon: Settings, description: "Service type" },
  { id: 6, title: "Add-ons", icon: Plus, description: "Extra services" },
  { id: 7, title: "Quote", icon: BarChart3, description: "Final estimate" },
];

const ADD_ONS = [
  { key: "oven", label: "Oven Cleaning", unitLabel: "ea", basePrice: 50 },
  { key: "refrigerator", label: "Refrigerator Cleaning", unitLabel: "ea", basePrice: 50 },
  { key: "interiorWindows", label: "Interior Windows", unitLabel: "per window", basePrice: 8 },
  { key: "baseboards", label: "Baseboards", unitLabel: "flat", basePrice: 75 },
  { key: "ceilingFans", label: "Ceiling Fans", unitLabel: "per fan", basePrice: 5 },
  { key: "insideCabinets", label: "Inside Cabinets", unitLabel: "flat", basePrice: 100 },
  { key: "laundry", label: "Laundry", unitLabel: "flat", basePrice: 50 },
  { key: "linens", label: "Linen Change", unitLabel: "flat", basePrice: 25 },
];

const schema = z.object({
  // Step 1
  customerId: z.string().optional(),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  customerCity: z.string().optional(),
  zip: z.string().optional(),
  // Step 2
  squareFootage: z.coerce.number().min(100, "Min 100 sqft").max(20000, "Max 20,000 sqft"),
  bedrooms: z.coerce.number().min(1).max(20),
  bathrooms: z.coerce.number().min(0.5).max(20),
  city: z.string().min(1, "Required"),
  propertyType: z.string().optional(),
  // Step 3
  occupancy: z.string(),
  flooringType: z.string(),
  condition: z.string(),
  petLevel: z.string(),
  // Step 4
  hasStairs: z.boolean().default(false),
  hasElevator: z.boolean().default(false),
  hasHomeOffice: z.boolean().default(false),
  hasGym: z.boolean().default(false),
  hasTheaterRoom: z.boolean().default(false),
  hasLanai: z.boolean().default(false),
  hasPoolBath: z.boolean().default(false),
  // Step 5
  frequency: z.string(),
  firstTimeType: z.string(),
  marketArea: z.string(),
  distanceMiles: z.coerce.number().min(0).default(0),
  seasonalOverride: z.number().nullable().optional(),
  // Step 6
  addOns: z.array(z.object({ key: z.string(), quantity: z.number() })).default([]),
  // Meta
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Option card component ────────────────────────────────────────────────────

function OptionCard({
  label,
  description,
  selected,
  onClick,
  badge,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all hover:bg-accent",
        selected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
          : "border-border bg-background"
      )}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
      {badge && (
        <Badge variant="secondary" className="mb-1 text-xs">
          {badge}
        </Badge>
      )}
      <span className="text-sm font-semibold">{label}</span>
      {description && (
        <span className="text-xs text-muted-foreground">{description}</span>
      )}
    </button>
  );
}

// ─── Feature toggle ───────────────────────────────────────────────────────────

function FeatureToggle({
  label,
  hours,
  selected,
  onClick,
}: {
  label: string;
  hours: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg border-2 p-3.5 transition-all w-full text-left",
        selected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
          : "border-border hover:border-blue-300"
      )}
    >
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded border-2 shrink-0",
          selected
            ? "border-blue-500 bg-blue-500"
            : "border-muted-foreground/40"
        )}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </div>
      <div className="flex-1">
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Badge variant="secondary" className="text-xs">
        +{hours}h
      </Badge>
    </button>
  );
}

export function EstimateWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null);
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({});
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; firstName: string; lastName: string; email: string | null; phone: string | null }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedEstimateId, setSavedEstimateId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      squareFootage: 2000,
      bedrooms: 3,
      bathrooms: 2,
      occupancy: "FAMILY",
      flooringType: "MOSTLY_TILE",
      condition: "AVERAGE",
      petLevel: "NO_PETS",
      frequency: "BIWEEKLY",
      firstTimeType: "FIRST_VISIT",
      marketArea: "FORT_MYERS",
      distanceMiles: 0,
      hasStairs: false,
      hasElevator: false,
      hasHomeOffice: false,
      hasGym: false,
      hasTheaterRoom: false,
      hasLanai: false,
      hasPoolBath: false,
      addOns: [],
    },
  });

  const searchCustomers = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}&pageSize=5`);
      const json = await res.json();
      setSearchResults(json.data || []);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectCustomer = (customer: typeof searchResults[0]) => {
    setValue("customerId", customer.id);
    setValue("firstName", customer.firstName);
    setValue("lastName", customer.lastName);
    setValue("email", customer.email || "");
    setValue("phone", customer.phone || "");
    setCustomerSearch(`${customer.firstName} ${customer.lastName}`);
    setSearchResults([]);
  };

  const calculatePrice = async () => {
    const values = getValues();
    const addOnsList = Object.entries(addOnQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([key, quantity]) => ({ key, quantity }));

    try {
      const res = await fetch("/api/estimates/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, addOns: addOnsList }),
      });
      const json = await res.json();
      setBreakdown(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onNextStep = async () => {
    if (step === 6) {
      await calculatePrice();
    }
    setStep((s) => s + 1);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const addOnsList = Object.entries(addOnQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([key, quantity]) => ({ key, quantity }));

      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, addOns: addOnsList }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save estimate");
      }

      const json = await res.json();
      setSavedEstimateId(json.data.id);
      setBreakdown(json.breakdown);
      toast({ title: "Estimate saved!", description: `Estimate ${json.data.estimateNumber} created successfully.` });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedValues = watch();
  const features = [
    { key: "hasStairs", label: "Stairs", hours: "0.50" },
    { key: "hasElevator", label: "Elevator", hours: "0.25" },
    { key: "hasHomeOffice", label: "Home Office", hours: "0.25" },
    { key: "hasGym", label: "Gym / Exercise Room", hours: "0.25" },
    { key: "hasTheaterRoom", label: "Theater Room", hours: "0.25" },
    { key: "hasLanai", label: "Lanai / Screened Porch", hours: "0.50" },
    { key: "hasPoolBath", label: "Pool Bath", hours: "0.25" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Step progress */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => step > s.id && setStep(s.id)}
              disabled={step < s.id}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                step === s.id
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : step > s.id
                  ? "text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-muted"
                  : "text-muted-foreground/50 cursor-default"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0",
                  step === s.id
                    ? "bg-blue-500 text-white"
                    : step > s.id
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s.id ? <Check className="h-3 w-3" /> : s.id}
              </div>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-1",
                  step > s.id ? "bg-emerald-400" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = steps[step - 1].icon;
                return (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                );
              })()}
              <div>
                <CardTitle>{steps[step - 1].title}</CardTitle>
                <p className="text-sm text-muted-foreground">{steps[step - 1].description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* ── Step 1: Customer ── */}
            {step === 1 && (
              <div className="space-y-5">
                {/* Search existing */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Search Existing Customer</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Type name, email, or phone..."
                      className="pl-9"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        searchCustomers(e.target.value);
                      }}
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="rounded-lg border bg-popover shadow-lg">
                      {searchResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="flex w-full items-center gap-3 p-3 text-left hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg"
                          onClick={() => selectCustomer(c)}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-semibold text-blue-700 dark:text-blue-300 shrink-0">
                            {c.firstName[0]}{c.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                            <p className="text-xs text-muted-foreground">{c.email || c.phone || "No contact info"}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">— Or enter new customer —</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>First Name *</Label>
                    <Input {...register("firstName")} placeholder="Margaret" />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last Name *</Label>
                    <Input {...register("lastName")} placeholder="Williams" />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input {...register("phone")} placeholder="(239) 555-0100" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input {...register("email")} type="email" placeholder="margaret@email.com" />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input {...register("address")} placeholder="1250 Gulf Shore Blvd N" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label>City</Label>
                    <Input {...register("customerCity")} placeholder="Naples" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ZIP</Label>
                    <Input {...register("zip")} placeholder="34102" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Property ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 space-y-1.5">
                    <Label>Square Footage *</Label>
                    <Input {...register("squareFootage")} type="number" placeholder="2,200" />
                    {errors.squareFootage && <p className="text-xs text-destructive">{errors.squareFootage.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bedrooms *</Label>
                    <Input {...register("bedrooms")} type="number" placeholder="3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bathrooms *</Label>
                    <Input {...register("bathrooms")} type="number" step="0.5" placeholder="2.5" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Property Type</Label>
                    <Controller
                      name="propertyType"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Type..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single_family">Single Family</SelectItem>
                            <SelectItem value="condo">Condo</SelectItem>
                            <SelectItem value="townhome">Townhome</SelectItem>
                            <SelectItem value="villa">Villa</SelectItem>
                            <SelectItem value="estate">Estate</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Service City *</Label>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={(val) => {
                        field.onChange(val);
                        // Auto-set market area
                        if (val === "Naples" || val === "Marco Island") {
                          setValue("marketArea", "NAPLES");
                        } else {
                          setValue("marketArea", "FORT_MYERS");
                        }
                      }} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select city..." /></SelectTrigger>
                        <SelectContent>
                          {SWFL_CITIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                </div>
              </div>
            )}

            {/* ── Step 3: Conditions ── */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold">Occupancy Type</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { value: "SEASONAL_EMPTY", label: "Seasonal / Empty", description: "×0.90", badge: "Discount" },
                      { value: "COUPLE", label: "Couple", description: "×1.00" },
                      { value: "FAMILY", label: "Family", description: "×1.10" },
                      { value: "LARGE_FAMILY", label: "Large Family", description: "×1.20" },
                      { value: "VACATION_RENTAL", label: "Vacation Rental", description: "×1.15" },
                    ].map((opt) => (
                      <OptionCard
                        key={opt.value}
                        label={opt.label}
                        description={opt.description}
                        selected={watchedValues.occupancy === opt.value}
                        onClick={() => setValue("occupancy", opt.value)}
                        badge={opt.badge}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold">Flooring Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "MOSTLY_TILE", label: "Mostly Tile", description: "×1.00 — standard" },
                      { value: "MOSTLY_HARDWOOD", label: "Mostly Hardwood", description: "×1.05" },
                      { value: "MOSTLY_CARPET", label: "Mostly Carpet", description: "×1.10" },
                      { value: "LUXURY_MIXED", label: "Luxury Mixed", description: "×1.15" },
                    ].map((opt) => (
                      <OptionCard
                        key={opt.value}
                        label={opt.label}
                        description={opt.description}
                        selected={watchedValues.flooringType === opt.value}
                        onClick={() => setValue("flooringType", opt.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold">Home Condition</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: "EXCELLENT", label: "Excellent", description: "×0.90", badge: "Discount" },
                      { value: "AVERAGE", label: "Average", description: "×1.00" },
                      { value: "DIRTY", label: "Dirty", description: "×1.20" },
                      { value: "VERY_DIRTY", label: "Very Dirty", description: "×1.50" },
                    ].map((opt) => (
                      <OptionCard
                        key={opt.value}
                        label={opt.label}
                        description={opt.description}
                        selected={watchedValues.condition === opt.value}
                        onClick={() => setValue("condition", opt.value)}
                        badge={opt.badge}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold">Pets</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: "NO_PETS", label: "No Pets", description: "+0h" },
                      { value: "ONE_PET", label: "1 Pet", description: "+0.5h" },
                      { value: "TWO_PLUS_PETS", label: "2+ Pets", description: "+1.0h" },
                      { value: "HEAVY_SHEDDING", label: "Heavy Shedding", description: "+1.5h" },
                    ].map((opt) => (
                      <OptionCard
                        key={opt.value}
                        label={opt.label}
                        description={opt.description}
                        selected={watchedValues.petLevel === opt.value}
                        onClick={() => setValue("petLevel", opt.value)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Features ── */}
            {step === 4 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Select all special features that apply. Each adds extra time to the estimate.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((f) => (
                    <FeatureToggle
                      key={f.key}
                      label={f.label}
                      hours={f.hours}
                      selected={!!watchedValues[f.key]}
                      onClick={() => setValue(f.key, !watchedValues[f.key])}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 5: Service Type ── */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold">Service Frequency</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(FREQUENCY_LABELS).map(([value, label]) => {
                      const multipliers: Record<string, string> = {
                        WEEKLY: "×0.90 — best value",
                        BIWEEKLY: "×1.00 — most popular",
                        MONTHLY: "×1.20",
                        ONE_TIME: "×1.35",
                        DEEP_CLEAN: "×1.75 — thorough",
                      };
                      return (
                        <OptionCard
                          key={value}
                          label={label}
                          description={multipliers[value]}
                          selected={watchedValues.frequency === value}
                          onClick={() => setValue("frequency", value)}
                          badge={value === "BIWEEKLY" ? "Popular" : undefined}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold">First Visit?</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: "EXISTING_CLIENT", label: "Existing Client", description: "×1.00" },
                      { value: "FIRST_VISIT", label: "First Visit", description: "×1.25" },
                      { value: "INITIAL_DEEP_CLEAN", label: "Initial Deep Clean", description: "×1.50" },
                    ].map((opt) => (
                      <OptionCard
                        key={opt.value}
                        label={opt.label}
                        description={opt.description}
                        selected={watchedValues.firstTimeType === opt.value}
                        onClick={() => setValue("firstTimeType", opt.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Market Area</Label>
                    <Controller
                      name="marketArea"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(MARKET_LABELS).map(([v, l]) => (
                              <SelectItem key={v} value={v}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Distance (miles)</Label>
                    <Input {...register("distanceMiles")} type="number" placeholder="0" />
                    <p className="text-xs text-muted-foreground">0–10: free · 10–20: $25 · 20–30: $50</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Notes (optional)</Label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    placeholder="Special instructions, access codes, or customer notes..."
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            )}

            {/* ── Step 6: Add-ons ── */}
            {step === 6 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select optional add-on services to include in the quote.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ADD_ONS.map((addon) => {
                    const qty = addOnQuantities[addon.key] || 0;
                    return (
                      <div
                        key={addon.key}
                        className={cn(
                          "rounded-xl border-2 p-4 transition-all",
                          qty > 0 ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-border"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{addon.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(addon.basePrice)} / {addon.unitLabel}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-border hover:bg-muted text-sm font-bold"
                              onClick={() => setAddOnQuantities((p) => ({ ...p, [addon.key]: Math.max(0, (p[addon.key] || 0) - 1) }))}
                            >−</button>
                            <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-border hover:bg-muted text-sm font-bold"
                              onClick={() => setAddOnQuantities((p) => ({ ...p, [addon.key]: (p[addon.key] || 0) + 1 }))}
                            >+</button>
                          </div>
                        </div>
                        {qty > 0 && (
                          <div className="mt-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                            Subtotal: {formatCurrency(addon.basePrice * qty)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {Object.values(addOnQuantities).some((q) => q > 0) && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <span className="font-medium">Add-on total: </span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {formatCurrency(
                        ADD_ONS.reduce((sum, a) => sum + (addOnQuantities[a.key] || 0) * a.basePrice, 0)
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 7: Results ── */}
            {step === 7 && breakdown && (
              <div className="space-y-6">
                {/* Hero price card */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-blue-200 text-sm font-medium">Estimated Price</p>
                      <p className="text-5xl font-bold mt-1">
                        {formatCurrency(breakdown.roundedPrice)}
                      </p>
                      <p className="text-blue-200 text-sm mt-2">
                        {FREQUENCY_LABELS[watchedValues.frequency as keyof typeof FREQUENCY_LABELS]} · {watchedValues.city}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/20 p-3">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-white/10 p-2.5 text-center">
                      <p className="text-xs text-blue-200">Labor Hours</p>
                      <p className="text-lg font-bold">{breakdown.totalLaborHours.toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg bg-white/10 p-2.5 text-center">
                      <p className="text-xs text-blue-200">Prod. Hours</p>
                      <p className="text-lg font-bold">{breakdown.productionHours.toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg bg-white/10 p-2.5 text-center">
                      <p className="text-xs text-blue-200">Rate/hr</p>
                      <p className="text-lg font-bold">{formatCurrency(breakdown.hourlyRate)}</p>
                    </div>
                  </div>
                </div>

                {/* Breakdown details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Labor hours breakdown */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <CardTitle className="text-sm">Hours Breakdown</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {[
                        { label: "Base Hours (sqft)", value: breakdown.baseHours },
                        { label: "Bathroom Adj.", value: breakdown.bathroomHours },
                        { label: "Bedroom Adj.", value: breakdown.bedroomHours },
                        { label: "Pet Adj.", value: breakdown.petHours },
                        { label: "Features Adj.", value: breakdown.featureHours },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between">
                          <span className="text-muted-foreground">{row.label}</span>
                          <span className="font-medium tabular-nums">+{row.value.toFixed(2)}h</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total Labor</span>
                        <span>{breakdown.totalLaborHours.toFixed(2)}h</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground text-xs">
                        <span>After multipliers</span>
                        <span>{breakdown.productionHours.toFixed(2)}h</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Price breakdown */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <CardTitle className="text-sm">Price Breakdown</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Price</span>
                        <span className="font-medium">{formatCurrency(breakdown.basePrice)}</span>
                      </div>
                      {breakdown.travelFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            Travel Fee
                          </span>
                          <span className="font-medium">{formatCurrency(breakdown.travelFee)}</span>
                        </div>
                      )}
                      {breakdown.addOnTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Add-ons</span>
                          <span className="font-medium">{formatCurrency(breakdown.addOnTotal)}</span>
                        </div>
                      )}
                      {breakdown.addOnBreakdown.map((a) => (
                        <div key={a.key} className="flex justify-between text-xs pl-3">
                          <span className="text-muted-foreground">{a.name} ×{a.quantity}</span>
                          <span>{formatCurrency(a.totalPrice)}</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Raw Total</span>
                        <span>{formatCurrency(breakdown.rawFinalPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min. Charge</span>
                        <span>{formatCurrency(breakdown.minimumCharge)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base font-bold">
                        <span>Final (Rounded)</span>
                        <span className="text-blue-600 dark:text-blue-400">{formatCurrency(breakdown.roundedPrice)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Multiplier summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Applied Multipliers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Occupancy", value: `×${breakdown.occupancyMultiplier}` },
                        { label: "Flooring", value: `×${breakdown.flooringMultiplier}` },
                        { label: "Condition", value: `×${breakdown.conditionMultiplier}` },
                        { label: "First-Time", value: `×${breakdown.firstTimeMultiplier}` },
                        { label: "Frequency", value: `×${breakdown.frequencyMultiplier}` },
                        { label: "Seasonal", value: `×${breakdown.seasonalMultiplier}` },
                      ].map((m) => (
                        <Badge key={m.label} variant="secondary" className="gap-1">
                          <span className="text-muted-foreground">{m.label}</span>
                          <span className="font-semibold">{m.value}</span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 7 && !breakdown && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex gap-2">
            {step < 6 && (
              <Button type="button" onClick={onNextStep}>
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {step === 6 && (
              <Button type="button" onClick={onNextStep}>
                Calculate Estimate
                <BarChart3 className="ml-2 h-4 w-4" />
              </Button>
            )}
            {step === 7 && !savedEstimateId && (
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Estimate
                  </>
                )}
              </Button>
            )}
            {step === 7 && savedEstimateId && (
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => router.push(`/estimates/${savedEstimateId}`)}
              >
                View Estimate
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
