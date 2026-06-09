"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, FileText, User, MapPin, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, formatPhone } from "@/lib/utils";
import { FREQUENCY_LABELS, STATUS_LABELS, MARKET_LABELS } from "@/lib/pricing-engine";
import type { ServiceFrequency, EstimateStatus, MarketArea } from "@prisma/client";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "secondary",
  SENT: "info",
  APPROVED: "success",
  CONVERTED: "default",
  EXPIRED: "destructive",
};

interface EstimateDetail {
  id: string;
  estimateNumber: string;
  status: EstimateStatus;
  frequency: ServiceFrequency;
  marketArea: MarketArea;
  roundedPrice: number;
  basePrice: number;
  travelFee: number;
  addOnTotal: number;
  finalPrice: number;
  baseHours: number;
  productionHours: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  propertyType: string | null;
  occupancy: string;
  flooringType: string;
  condition: string;
  petLevel: string;
  firstTimeType: string;
  hasStairs: boolean;
  hasElevator: boolean;
  hasHomeOffice: boolean;
  hasGym: boolean;
  hasTheaterRoom: boolean;
  hasLanai: boolean;
  hasPoolBath: boolean;
  distanceMiles: number | null;
  notes: string | null;
  convertedToJob: boolean;
  expiresAt: string | null;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    city: string | null;
  };
  createdBy: { name: string | null };
  addOns: Array<{ key: string; name: string; quantity: number; unitPrice: number; totalPrice: number }>;
}

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: "Excellent", AVERAGE: "Average", DIRTY: "Dirty", VERY_DIRTY: "Very Dirty",
};
const OCCUPANCY_LABELS: Record<string, string> = {
  SEASONAL_EMPTY: "Seasonal/Empty", COUPLE: "Couple", FAMILY: "Family",
  LARGE_FAMILY: "Large Family", VACATION_RENTAL: "Vacation Rental",
};
const FLOORING_LABELS: Record<string, string> = {
  MOSTLY_TILE: "Mostly Tile", MOSTLY_HARDWOOD: "Mostly Hardwood",
  MOSTLY_CARPET: "Mostly Carpet", LUXURY_MIXED: "Luxury Mixed",
};
const FIRST_TIME_LABELS: Record<string, string> = {
  EXISTING_CLIENT: "Existing Client", FIRST_VISIT: "First Visit", INITIAL_DEEP_CLEAN: "Initial Deep Clean",
};
const PET_LABELS: Record<string, string> = {
  NO_PETS: "No Pets", ONE_PET: "1 Pet", TWO_PLUS_PETS: "2+ Pets", HEAVY_SHEDDING: "Heavy Shedding",
};

export function EstimateDetailClient({ estimateId }: { estimateId: string }) {
  const [estimate, setEstimate] = useState<EstimateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/estimates/${estimateId}`)
      .then(r => r.json())
      .then(d => setEstimate(d.data))
      .finally(() => setLoading(false));
  }, [estimateId]);

  const handleConvert = async () => {
    if (!estimate) return;
    await fetch(`/api/estimates/${estimate.id}/convert`, { method: "POST" });
    setEstimate(e => e ? { ...e, status: "CONVERTED", convertedToJob: true } : e);
    toast({ title: "Converted to job!", description: "This estimate has been converted." });
  };

  const handleSendStatus = async (status: string) => {
    if (!estimate) return;
    await fetch(`/api/estimates/${estimate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setEstimate(e => e ? { ...e, status: status as EstimateStatus } : e);
    toast({ title: `Status updated to ${STATUS_LABELS[status]}` });
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-64" /></div>;
  }

  if (!estimate) return <div className="text-center py-12 text-muted-foreground">Estimate not found</div>;

  const features = [
    estimate.hasStairs && "Stairs",
    estimate.hasElevator && "Elevator",
    estimate.hasHomeOffice && "Home Office",
    estimate.hasGym && "Gym",
    estimate.hasTheaterRoom && "Theater Room",
    estimate.hasLanai && "Lanai",
    estimate.hasPoolBath && "Pool Bath",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/estimates"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{estimate.estimateNumber}</h1>
            <Badge variant={STATUS_COLORS[estimate.status] as never}>{STATUS_LABELS[estimate.status]}</Badge>
            <Badge variant="outline">{FREQUENCY_LABELS[estimate.frequency]}</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Created {formatDate(estimate.createdAt)} by {estimate.createdBy.name}
            {estimate.expiresAt && ` · Expires ${formatDate(estimate.expiresAt)}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {estimate.status === "DRAFT" && (
            <Button variant="outline" size="sm" onClick={() => handleSendStatus("SENT")}>
              <FileText className="mr-2 h-4 w-4" />Mark Sent
            </Button>
          )}
          {estimate.status === "SENT" && (
            <Button variant="outline" size="sm" onClick={() => handleSendStatus("APPROVED")}>
              <CheckCircle className="mr-2 h-4 w-4" />Mark Approved
            </Button>
          )}
          {!estimate.convertedToJob && (
            <Button size="sm" onClick={handleConvert} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle className="mr-2 h-4 w-4" />Convert to Job
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price summary */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Final Quote</p>
                  <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(estimate.roundedPrice)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{MARKET_LABELS[estimate.marketArea]} · {FREQUENCY_LABELS[estimate.frequency]}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Labor hrs</p>
                    <p className="text-lg font-bold">{estimate.baseHours.toFixed(1)}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Prod hrs</p>
                    <p className="text-lg font-bold">{estimate.productionHours.toFixed(1)}</p>
                  </div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Base Price</p>
                  <p className="font-semibold">{formatCurrency(estimate.basePrice)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Travel Fee</p>
                  <p className="font-semibold">{formatCurrency(estimate.travelFee)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Add-ons</p>
                  <p className="font-semibold">{formatCurrency(estimate.addOnTotal)}</p>
                </div>
              </div>
              {estimate.addOns.length > 0 && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-1.5">
                    {estimate.addOns.map(a => (
                      <div key={a.key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{a.name} ×{a.quantity}</span>
                        <span>{formatCurrency(a.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Property details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm">Property Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                <div><p className="text-muted-foreground">Size</p><p className="font-semibold">{estimate.squareFootage.toLocaleString()} sqft</p></div>
                <div><p className="text-muted-foreground">Bedrooms</p><p className="font-semibold">{estimate.bedrooms}</p></div>
                <div><p className="text-muted-foreground">Bathrooms</p><p className="font-semibold">{estimate.bathrooms}</p></div>
                <div><p className="text-muted-foreground">City</p><p className="font-semibold">{estimate.city}</p></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><p className="text-muted-foreground">Condition</p><p className="font-semibold">{CONDITION_LABELS[estimate.condition]}</p></div>
                <div><p className="text-muted-foreground">Occupancy</p><p className="font-semibold">{OCCUPANCY_LABELS[estimate.occupancy]}</p></div>
                <div><p className="text-muted-foreground">Flooring</p><p className="font-semibold">{FLOORING_LABELS[estimate.flooringType]}</p></div>
                <div><p className="text-muted-foreground">Pets</p><p className="font-semibold">{PET_LABELS[estimate.petLevel]}</p></div>
              </div>
              {features.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Special Features</p>
                  <div className="flex flex-wrap gap-1.5">
                    {features.map(f => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer + service sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm">Customer</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Link href={`/customers/${estimate.customer.id}`} className="font-semibold hover:text-blue-600">
                {estimate.customer.firstName} {estimate.customer.lastName}
              </Link>
              {estimate.customer.phone && <p className="text-muted-foreground">{formatPhone(estimate.customer.phone)}</p>}
              {estimate.customer.email && <p className="text-muted-foreground">{estimate.customer.email}</p>}
              {estimate.customer.city && <p className="text-muted-foreground">{estimate.customer.city}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm">Service Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequency</span>
                <span className="font-medium">{FREQUENCY_LABELS[estimate.frequency]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">First Visit</span>
                <span className="font-medium">{FIRST_TIME_LABELS[estimate.firstTimeType]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market</span>
                <span className="font-medium">{MARKET_LABELS[estimate.marketArea]}</span>
              </div>
              {estimate.distanceMiles != null && estimate.distanceMiles > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-medium">{estimate.distanceMiles} mi</span>
                </div>
              )}
            </CardContent>
          </Card>

          {estimate.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{estimate.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
