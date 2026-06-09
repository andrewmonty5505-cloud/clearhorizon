import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersClient } from "@/components/settings/users-client";

export default async function UsersPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create and manage staff accounts
        </p>
      </div>
      <UsersClient />
    </div>
  );
}
