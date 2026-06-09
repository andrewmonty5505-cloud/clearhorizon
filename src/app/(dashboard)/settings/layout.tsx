import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const settingsNav = [
  { href: "/settings", label: "Pricing Rules" },
  { href: "/settings/users", label: "Users" },
  { href: "/settings/profile", label: "My Profile" },
];

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Settings nav tabs */}
      <div className="flex gap-1 border-b">
        {settingsNav
          .filter((item) => isAdmin || item.href === "/settings/profile")
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-border transition-colors -mb-px"
            >
              {item.label}
            </Link>
          ))}
      </div>
      {children}
    </div>
  );
}
