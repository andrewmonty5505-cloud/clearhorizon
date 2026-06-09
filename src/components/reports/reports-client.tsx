"use client";

import { useEffect, useState, useCallback } from "react";
import { format, startOfMonth } from "date-fns";
import { Download, BarChart3, TrendingUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FREQUENCY_LABELS, STATUS_LABELS } from "@/lib/pricing-engine";
import type { ServiceFrequency, EstimateStatus } from "@prisma/client";
import * as XLSX from "xlsx";

interface ReportRow {
  id: string;
  estimateNumber: string;
  customerName: string;
  customerEmail: string | null;
  city: string;
  frequency: ServiceFrequency;
  status: EstimateStatus;
  squareFootage: number;
  marketArea: string;
  roundedPrice: number;
  convertedToJob: boolean;
  createdBy: string | null;
  createdAt: string;
}

interface Summary {
  total: number;
  totalRevenue: number;
  avgTicket: number;
  converted: number;
  conversionRate: number;
}

export function ReportsClient() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [freqFilter, setFreqFilter] = useState<string>("all");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ startDate, endDate });
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (freqFilter && freqFilter !== "all") params.set("frequency", freqFilter);
    try {
      const res = await fetch(`/api/reports?${params}`);
      const json = await res.json();
      setRows(json.data || []);
      setSummary(json.summary || null);
    } finally { setLoading(false); }
  }, [startDate, endDate, statusFilter, freqFilter]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
      "Estimate #": r.estimateNumber,
      Customer: r.customerName,
      Email: r.customerEmail,
      City: r.city,
      Frequency: FREQUENCY_LABELS[r.frequency],
      Status: STATUS_LABELS[r.status],
      "Sq Ft": r.squareFootage,
      "Price": r.roundedPrice,
      "Converted": r.convertedToJob ? "Yes" : "No",
      "Created By": r.createdBy,
      Date: formatDate(r.createdAt),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estimates");
    XLSX.writeFile(wb, `estimates-report-${startDate}-${endDate}.xlsx`);
  };

  const exportCSV = () => {
    const headers = ["Estimate #", "Customer", "Email", "City", "Frequency", "Status", "Sq Ft", "Price", "Converted", "Date"];
    const csvData = [
      headers.join(","),
      ...rows.map(r =>
        [r.estimateNumber, r.customerName, r.customerEmail || "", r.city,
         FREQUENCY_LABELS[r.frequency], STATUS_LABELS[r.status],
         r.squareFootage, r.roundedPrice, r.convertedToJob ? "Yes" : "No", formatDate(r.createdAt)]
        .map(v => `"${v}"`).join(",")
      )
    ].join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `estimates-${startDate}-${endDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Frequency</Label>
              <Select value={freqFilter} onValueChange={setFreqFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(FREQUENCY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />CSV</Button>
              <Button variant="outline" size="sm" onClick={exportExcel}><Download className="mr-2 h-4 w-4" />Excel</Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Total Estimates", value: summary.total.toString(), icon: BarChart3 },
            { label: "Total Revenue", value: formatCurrency(summary.totalRevenue), icon: TrendingUp },
            { label: "Avg Ticket", value: formatCurrency(summary.avgTicket), icon: TrendingUp },
            { label: "Converted", value: summary.converted.toString(), icon: Filter },
            { label: "Conv. Rate", value: `${summary.conversionRate.toFixed(1)}%`, icon: TrendingUp },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold mt-0.5">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No data for selected period</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimate #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.estimateNumber}</TableCell>
                    <TableCell className="font-medium">{r.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.city}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{FREQUENCY_LABELS[r.frequency]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{STATUS_LABELS[r.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-700 dark:text-blue-300">
                      {formatCurrency(r.roundedPrice)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(r.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
