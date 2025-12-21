"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";

import WalletSummary from "@/components/dashboard/wallet-summary";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import QuickActions from "@/components/dashboard/quick-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";

// Helper function to get the greeting based on the time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 16) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const router = useRouter();

  // Call the greeting function
  const greeting = getGreeting();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    async function fetchUserData() {
      try {
        const ref = doc(firestore, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);

          if (!data.isVerified) {
            setShowVerificationModal(true);
          }
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

  const recheckVerification = async () => {
    if (!user) return;
    try {
      const ref = doc(firestore, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        if (data.isVerified) {
          setShowVerificationModal(false);
        }
      }
    } catch (err) {
      console.error("Error rechecking verification:", err);
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      if (showVerificationModal) {
        recheckVerification();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [showVerificationModal, user]);

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
      <Dialog open={showVerificationModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <DialogTitle className="text-center text-xl">
              Email Verification Required
            </DialogTitle>
            <DialogDescription className="text-center">
              Please verify your email address to access your dashboard and
              start using all features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-muted p-4 rounded-lg text-sm text-center">
              <p className="font-medium mb-1">Verification code sent to:</p>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>

            <Button
              onClick={() => router.push("/verify-account")}
              className="w-full"
              size="lg"
            >
              Verify Email Now
            </Button>

            <Button
              onClick={recheckVerification}
              variant="outline"
              className="w-full"
            >
              I've Already Verified
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div
        className={showVerificationModal ? "pointer-events-none blur-sm" : ""}
      >
        <div className="space-y-8">
          <div className="mt-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold font-headline">
                  {/* UPDATED GREETING HERE */}
                  {greeting}, {userData.name.split(" ")[0]}!
                </h1>
                <p className="text-muted-foreground">
                  {new Date().getHours() < 12
                    ? "Wish you the best experience with our services"
                    : "Here's a summary of your account today."}
                </p>
              </div>

              {userData.isVerified ? (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 h-8 px-3"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Email Verified
                </Badge>
              ) : (
                <Badge
                  variant="default"
                  className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 h-8 px-3"
                >
                  <AlertCircle className="w-4 h-4 mr-1.5" />
                  Unverified
                </Badge>
              )}
            </div>
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
      </div>
    </>
  );
}
