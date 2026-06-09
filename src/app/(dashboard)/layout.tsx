import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:shrink-0">
        <Sidebar
          userRole={session.user.role}
          userName={session.user.name ?? "User"}
          userEmail={session.user.email}
        />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={session.user.name ?? "User"}
          userEmail={session.user.email}
          userRole={session.user.role}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="container max-w-7xl mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
