"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/shared/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading, router]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Show loading state while checking authentication
  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen w-full pt-20">
        <div className="hidden md:block w-64 border-r">
          <div className="p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Only render dashboard if user is authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full pt-20">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          style={{ top: "88px" }}
          onClick={closeSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`
          fixed left-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ top: "88px", height: "calc(100vh - 88px)" }}
      >
        <div className="h-full w-64 bg-card border-r">
          <AppSidebar onLinkClick={closeSidebar} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col w-full min-w-0">
        {/* Mobile Header with Toggle */}
        <div className="flex items-center justify-between p-4 bg-card border-b md:hidden">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        <main className="flex-1 p-4 md:p-8 lg:p-10 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
