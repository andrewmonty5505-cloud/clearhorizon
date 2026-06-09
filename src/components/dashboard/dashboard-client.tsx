"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  DollarSign,
  Target,
  CalendarDays,
  CheckCircle,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { FREQUENCY_LABELS } from "@/lib/pricing-engine";
import type { ServiceFrequency } from "@prisma/client";

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
];

interface DashboardData {
  kpi: {
    estimatesToday: number;
    estimatesThisMonth: number;
    totalEstimatedRevenue: number;
    conversionRate: number;
    averageTicketValue: number;
    estimatesMonthChange: number;
  };
  monthlyRevenue: Array<{ month: string; revenue: number; count: number }>;
  estimatesByFrequency: Array<{ frequency: string; count: number }>;
  estimatesByCity: Array<{ city: string; count: number; revenue: number }>;
  activity: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
    user?: string;
  }>;
}

interface DashboardClientProps {
  userName: string;
  userRole: string;
}

function KpiCard({
  title,
  value,
  icon: Icon,
  change,
  format = "number",
  color = "blue",
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  change?: number;
  format?: "number" | "currency" | "percent";
  color?: string;
}) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
      ? `${value.toFixed(1)}%`
      : value.toLocaleString();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{formattedValue}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {change >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    change >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {Math.abs(change).toFixed(1)}% vs last month
                </span>
              </div>
            )}
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${color}-100 dark:bg-${color}-900/30`}
          >
            <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardClient({ userName, userRole }: DashboardClientProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const freqData =
    data?.estimatesByFrequency.map((d) => ({
      ...d,
      name: FREQUENCY_LABELS[d.frequency as ServiceFrequency] || d.frequency,
    })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting()}, {userName.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Here&apos;s what&apos;s happening with your estimates today
          </p>
        </div>
        <Button asChild>
          <Link href="/estimates/new">
            <FileText className="mr-2 h-4 w-4" />
            New Estimate
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Estimates Today"
          value={data?.kpi.estimatesToday ?? 0}
          icon={CalendarDays}
          color="blue"
        />
        <KpiCard
          title="This Month"
          value={data?.kpi.estimatesThisMonth ?? 0}
          icon={FileText}
          change={data?.kpi.estimatesMonthChange}
          color="indigo"
        />
        <KpiCard
          title="Total Pipeline"
          value={data?.kpi.totalEstimatedRevenue ?? 0}
          icon={DollarSign}
          format="currency"
          color="emerald"
        />
        <KpiCard
          title="Conversion Rate"
          value={data?.kpi.conversionRate ?? 0}
          icon={Target}
          format="percent"
          color="amber"
        />
        <KpiCard
          title="Avg Ticket"
          value={data?.kpi.averageTicketValue ?? 0}
          icon={TrendingUp}
          format="currency"
          color="purple"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue Projection</CardTitle>
            <CardDescription>Estimated revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data?.monthlyRevenue ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Frequency */}
        <Card>
          <CardHeader>
            <CardTitle>By Service Frequency</CardTitle>
            <CardDescription>Distribution of estimate types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={freqData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="count"
                  nameKey="name"
                >
                  {freqData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-2">
              {freqData.map((d, i) => (
                <div key={d.frequency} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-medium">{d.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By City */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Estimates by City</CardTitle>
            <CardDescription>Top service areas by volume and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={data?.estimatesByCity ?? []}
                layout="vertical"
                margin={{ left: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="city"
                  tick={{ fontSize: 12 }}
                  width={90}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === "revenue" ? formatCurrency(value) : value,
                    name === "revenue" ? "Revenue" : "Count",
                  ]}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest estimates and customers</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/estimates">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.activity ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activity yet
                </p>
              )}
              {(data?.activity ?? []).map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-medium ${
                      item.type === "estimate"
                        ? "bg-blue-500"
                        : item.type === "customer"
                        ? "bg-emerald-500"
                        : "bg-purple-500"
                    }`}
                  >
                    {item.type === "estimate" ? (
                      <FileText className="h-4 w-4" />
                    ) : item.type === "customer" ? (
                      <UserPlus className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-snug">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateTime(item.createdAt)}
                      {item.user && ` · ${item.user}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
