"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatPhone } from "@/lib/utils";
import { FREQUENCY_LABELS, STATUS_LABELS } from "@/lib/pricing-engine";
import type { ServiceFrequency, EstimateStatus } from "@prisma/client";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "secondary",
  SENT: "info",
  APPROVED: "success",
  CONVERTED: "default",
  EXPIRED: "destructive",
};

interface CustomerDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  notes: string | null;
  _count: { estimates: number };
  estimates: Array<{
    id: string;
    estimateNumber: string;
    status: EstimateStatus;
    frequency: ServiceFrequency;
    roundedPrice: number;
    city: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export function CustomerDetailClient({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${customerId}`)
      .then(r => r.json())
      .then(d => setCustomer(d.data))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="lg:col-span-2 h-64" />
        </div>
      </div>
    );
  }

  if (!customer) return <div className="text-center py-12 text-muted-foreground">Customer not found</div>;

  const totalRevenue = customer.estimates?.reduce((s, e) => s + e.roundedPrice, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/customers"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{customer.firstName} {customer.lastName}</h1>
          <p className="text-muted-foreground text-sm">Customer since {formatDate(customer.createdAt)}</p>
        </div>
        <Button asChild>
          <Link href={`/estimates/new?customerId=${customer.id}`}>
            <Plus className="mr-2 h-4 w-4" />New Estimate
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Card */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-lg font-bold text-blue-700 dark:text-blue-300">
                  {customer.firstName[0]}{customer.lastName[0]}
                </div>
                <div>
                  <CardTitle className="text-base">{customer.firstName} {customer.lastName}</CardTitle>
                  <p className="text-xs text-muted-foreground">{customer._count.estimates} estimates</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${customer.phone}`} className="hover:text-blue-600">{formatPhone(customer.phone)}</a>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${customer.email}`} className="hover:text-blue-600 truncate">{customer.email}</a>
                </div>
              )}
              {(customer.address || customer.city) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    {[customer.address, customer.city, customer.zip].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {customer.notes && (
                <div className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  {customer.notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Estimates</span>
                <span className="font-semibold">{customer._count.estimates}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Pipeline</span>
                <span className="font-semibold text-blue-600">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Ticket</span>
                <span className="font-semibold">
                  {customer.estimates?.length ? formatCurrency(totalRevenue / customer.estimates.length) : "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estimates */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Estimate History</CardTitle>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/estimates/new?customerId=${customer.id}`}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />New
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!customer.estimates?.length ? (
                <div className="flex flex-col items-center gap-2 py-12">
                  <FileText className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No estimates yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {customer.estimates.map((e) => (
                    <Link key={e.id} href={`/estimates/${e.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{e.estimateNumber}</span>
                          <Badge variant={STATUS_COLORS[e.status] as never} className="text-xs">{STATUS_LABELS[e.status]}</Badge>
                          <Badge variant="outline" className="text-xs">{FREQUENCY_LABELS[e.frequency]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{e.city} · {formatDate(e.createdAt)}</p>
                      </div>
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-300 shrink-0">
                        {formatCurrency(e.roundedPrice)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
