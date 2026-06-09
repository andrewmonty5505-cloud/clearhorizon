import { CustomersListClient } from "@/components/customers/customers-list-client";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your customer database</p>
      </div>
      <CustomersListClient />
    </div>
  );
}
