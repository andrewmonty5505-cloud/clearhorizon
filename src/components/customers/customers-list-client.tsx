"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, UserPlus, Phone, Mail, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatPhone } from "@/lib/utils";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  _count: { estimates: number };
  createdAt: string;
}

export function CustomersListClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", zip: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ q: search, page: String(page), pageSize: "20" });
    try {
      const res = await fetch(`/api/customers?${params}`);
      const json = await res.json();
      setCustomers(json.data || []);
      setTotal(json.total || 0);
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 409) {
        toast({ title: "Duplicate found", description: "A customer with this email already exists.", variant: "destructive" });
        return;
      }
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Customer added!" });
      setShowAdd(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", zip: "" });
      fetch_();
    } catch {
      toast({ title: "Error", description: "Failed to add customer", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, phone..." className="pl-9" value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Button onClick={() => setShowAdd(true)}>
              <UserPlus className="mr-2 h-4 w-4" />Add Customer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <UserPlus className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium">No customers found</p>
              <Button onClick={() => setShowAdd(true)} size="sm"><Plus className="mr-2 h-3.5 w-3.5" />Add Customer</Button>
            </div>
          ) : (
            <div className="divide-y">
              {customers.map((c) => (
                <Link key={c.id} href={`/customers/${c.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-sm font-bold text-blue-700 dark:text-blue-300">
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold group-hover:text-blue-600">{c.firstName} {c.lastName}</p>
                      <Badge variant="secondary" className="text-xs">{c._count.estimates} estimates</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {c.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{formatPhone(c.phone)}</span>}
                      {c.email && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</span>}
                      {c.city && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{c.city}</span>}
                    </div>
                  </div>
                  <FileText className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {Math.min(20 * (page - 1) + 1, total)}–{Math.min(20 * page, total)} of {total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={20 * page >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Margaret" />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Williams" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(239) 555-0100" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} type="email" placeholder="email@domain.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="1250 Gulf Shore Blvd N" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>City</Label>
                <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Naples" />
              </div>
              <div className="space-y-1.5">
                <Label>ZIP</Label>
                <Input value={form.zip} onChange={e => setForm(p => ({ ...p, zip: e.target.value }))} placeholder="34102" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !form.firstName || !form.lastName}>
              {saving ? "Saving..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
