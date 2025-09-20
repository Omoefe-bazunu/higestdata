"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";

import WalletSummary from "@/components/dashboard/wallet-summary";
// import CryptoRates from "@/components/dashboard/crypto-rates"; // <-- removed
import RecentTransactions from "@/components/dashboard/recent-transactions";
import QuickActions from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  const { user } = useAuth(); // current Firebase user
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return; // auth not ready yet

    if (!user) {
      router.replace("/login");
      return;
    }

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
        setLoading(false);
      }
    }

    fetchUserData();
    setCheckingAuth(false);
  }, [user, router]);

  // ⛔ Block rendering until auth check finishes
  if (checkingAuth) {
    return null; // or a full-screen loader if you want
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading dashboard...</p>;
  }

  if (!userData) {
    return <p className="text-muted-foreground">No account data found.</p>;
  }

  return (
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
  );
}
