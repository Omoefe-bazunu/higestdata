import AppSidebar from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { UserNav } from '@/components/user-nav';
import { getSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <AppSidebar session={session} />
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <div className="w-full flex-1">
                {/* Future: Add mobile nav toggle or breadcrumbs here */}
            </div>
            <UserNav session={session} />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
