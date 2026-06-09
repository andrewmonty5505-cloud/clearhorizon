"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  Wind,
  PlusCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UserRole } from "@prisma/client";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
  children?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Estimates",
    href: "/estimates",
    icon: FileText,
    children: [
      { title: "All Estimates", href: "/estimates" },
      { title: "New Estimate", href: "/estimates/new" },
    ],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    adminOnly: true,
  },
];

interface SidebarProps {
  userRole: UserRole;
  userName: string;
  userEmail: string;
}

export function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || userRole === "ADMIN"
  );

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-500/20 border border-blue-500/30 shrink-0">
          <Wind className="h-5 w-5 text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sidebar-foreground truncate">
            SWFL Cleaning
          </p>
          <p className="text-xs text-blue-400 truncate">Estimator Pro</p>
        </div>
      </div>

      {/* Quick action */}
      <div className="px-4 pt-4 pb-2">
        <Link href="/estimates/new">
          <div className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer">
            <PlusCircle className="h-4 w-4 shrink-0" />
            New Estimate
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-1">
          {visibleItems.map((item) => (
            <div key={item.href}>
              <Link href={item.href}>
                <div
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                    isActive(item.href)
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive(item.href)
                        ? "text-sidebar-primary"
                        : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                    )}
                  />
                  <span className="flex-1">{item.title}</span>
                  {item.children && (
                    <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                  )}
                </div>
              </Link>

              {item.children && isActive(item.href) && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href}>
                      <div
                        className={cn(
                          "block rounded-md px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                          pathname === child.href
                            ? "bg-sidebar-accent text-sidebar-foreground"
                            : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        {child.title}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User info */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-400">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {userName}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {userRole === "ADMIN" ? "Administrator" : "Office Staff"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
