"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({ children }) {
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

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex space-x-2">
          <span className="h-3 w-3 bg-blue-900 rounded-full animate-pulse"></span>
          <span className="h-3 w-3 bg-blue-900 rounded-full animate-pulse"></span>
          <span className="h-3 w-3 bg-blue-900 rounded-full animate-pulse"></span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="relative min-h-screen pt-28 w-full bg-background overflow-hidden">
      {/* Faded Background Image Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none " />

      {/* Page Content */}
      <div className="relative z-10">{children}</div>
    </main>
  );
}
