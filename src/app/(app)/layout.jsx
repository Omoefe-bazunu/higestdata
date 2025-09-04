import AppHeader from "@/components/shared/app-header";
import AppSidebar from "@/components/shared/app-sidebar";

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <div className="flex flex-col w-full min-w-0">
        <AppHeader />
        <main className="flex-1 p-4 md:p-8 lg:p-10 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
