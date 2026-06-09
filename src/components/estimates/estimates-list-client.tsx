"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Filter, FileText, MoreHorizontal, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FREQUENCY_LABELS, STATUS_LABELS } from "@/lib/pricing-engine";
import type { ServiceFrequency, EstimateStatus } from "@prisma/client";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "secondary",
  SENT: "info",
  APPROVED: "success",
  CONVERTED: "default",
  EXPIRED: "destructive",
};

interface Estimate {
  id: string;
  estimateNumber: string;
  status: EstimateStatus;
  frequency: ServiceFrequency;
  roundedPrice: number;
  city: string;
  squareFootage: number;
  bedrooms: number;
  createdAt: string;
  customer: { id: string; firstName: string; lastName: string; email: string | null };
  createdBy: { name: string | null };
}

export function EstimatesListClient() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchEstimates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
      q: search,
      ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
    });
    try {
      const res = await fetch(`/api/estimates?${params}`);
      const json = await res.json();
      setEstimates(json.data || []);
      setTotal(json.total || 0);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchEstimates(); }, [fetchEstimates]);

  const handleConvert = async (id: string) => {
    await fetch(`/api/estimates/${id}/convert`, { method: "POST" });
    fetchEstimates();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search estimates, customers..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button asChild>
                <Link href="/estimates/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : estimates.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium">No estimates found</p>
                <p className="text-xs text-muted-foreground mt-0.5">Create your first estimate to get started</p>
              </div>
              <Button asChild size="sm">
                <Link href="/estimates/new"><Plus className="mr-2 h-3.5 w-3.5" />New Estimate</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {estimates.map((est) => (
                <div key={est.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/estimates/${est.id}`} className="text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400">
                        {est.estimateNumber}
                      </Link>
                      <Badge variant={STATUS_COLORS[est.status] as never} className="text-xs">
                        {STATUS_LABELS[est.status] || est.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {FREQUENCY_LABELS[est.frequency]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {est.customer.firstName} {est.customer.lastName} · {est.city} · {est.squareFootage.toLocaleString()} sqft
                    </p>
                    <p className="text-xs text-muted-foreground/70">{formatDate(est.createdAt)} · {est.createdBy.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(est.roundedPrice)}</p>
                    <p className="text-xs text-muted-foreground">{est.bedrooms}bd / {est.squareFootage.toLocaleString()} sqft</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/estimates/${est.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />View Details
                        </Link>
                      </DropdownMenuItem>
                      {est.status !== "CONVERTED" && (
                        <DropdownMenuItem onClick={() => handleConvert(est.id)}>
                          <FileText className="mr-2 h-4 w-4" />Convert to Job
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {Math.min(20 * (page - 1) + 1, total)}–{Math.min(20 * page, total)} of {total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={20 * page >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
