"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";

import WalletSummary from "@/components/dashboard/wallet-summary";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import QuickActions from "@/components/dashboard/quick-actions";
import PaymentSuccessHandler from "@/components/PaymentSuccessHandler";

export default function DashboardPage() {
  // Retrieve user and the global loading state from the AuthContext
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Wait until the AuthContext finishes checking the session state
    if (authLoading) return;

    // If Auth is loaded and no user is found, redirect to login
    if (!user) {
      router.replace("/login");
      return;
    }

    // If Auth is loaded and user is found, fetch user data
    async function fetchUserData() {
      try {
        const ref = doc(firestore, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          setUserData({ name: user.displayName || "User", walletBalance: 0 });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setDataLoading(false);
      }
    }

    fetchUserData();
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="p-8 text-center text-xl text-primary font-semibold">
        Authenticating session...
      </div>
    );
  }

  if (dataLoading) {
    return <p className="text-muted-foreground">Loading dashboard data...</p>;
  }

  if (!userData) {
    return <p className="text-muted-foreground">No account data found.</p>;
  }

  return (
    <>
      <PaymentSuccessHandler />
      <div className="space-y-8">
        <div className="mt-4">
          <h1 className="text-3xl font-bold font-headline">
            Welcome back, {userData.name.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            Here's a summary of your account today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <WalletSummary walletBalance={userData.walletBalance ?? 0} />
            <RecentTransactions userId={user.uid} />
          </div>

          <div className="space-y-8">
            <QuickActions />
          </div>
        </div>
      </div>
    </>
  );
}
