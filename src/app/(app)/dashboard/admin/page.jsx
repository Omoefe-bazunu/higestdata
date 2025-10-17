"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import AllTransactionsTab from "@/components/admin/all-transactions-tab";
import ElectricityRatesForm from "@/components/admin/electricity-bill-rates-tab";
// import CryptoSettingsTab from "@/components/admin/crypto-settings-tab";
import GiftCardRatesTab from "@/components/admin/gift-card-rates-tab";
import AirtimeDataRatesTab from "@/components/admin/airtime-data-rates-tab";
import PendingRequestsTab from "@/components/admin/pending-requests-tab";
import BettingRatesTab from "@/components/admin/betting-rates-tab";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Check if user is authenticated first
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        setCheckingAuth(false);
      }
    }
  }, [user, authLoading, router]);

  // Always show admin modal on page visit (never persist admin auth)
  // Remove any sessionStorage persistence for admin access

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Invalid Input",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const adminDoc = await getDoc(doc(firestore, "admin", "adminAccess"));
      if (!adminDoc.exists()) {
        toast({
          title: "Error",
          description: "Admin credentials not found.",
          variant: "destructive",
        });
        return;
      }

      const adminData = adminDoc.data();
      if (adminData.email === email && adminData.password === password) {
        setIsAdminAuthenticated(true);
        toast({
          title: "Success",
          description: "Admin authentication successful.",
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error authenticating admin:", err);
      toast({
        title: "Error",
        description: "Failed to authenticate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking user authentication
  if (authLoading || checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // User must be authenticated to see anything
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Admin authentication modal - always shown until authenticated */}
      <Dialog open={!isAdminAuthenticated} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[425px]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Admin Authentication</DialogTitle>
            <DialogDescription>
              Enter your admin credentials to access the admin panel.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Authenticating..." : "Login"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Admin panel content - only shown after admin authentication */}
      {isAdminAuthenticated && (
        <div className="space-y-8 p-4 md:p-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage system settings, review transactions, and set rates.
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
            className="w-full"
          >
            {/* Mobile Tab Selector */}
            <div className="block md:hidden">
              <Select
                value={activeTab}
                onValueChange={(value) => setActiveTab(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a tab" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactions">All Transactions</SelectItem>
                  {/* <SelectItem value="crypto">Crypto Rates</SelectItem> */}
                  <SelectItem value="gift-cards">Gift Card Rates</SelectItem>
                  <SelectItem value="airtime-data">
                    Airtime/Data Rates
                  </SelectItem>
                  <SelectItem value="electricity">Electricity Rates</SelectItem>
                  <SelectItem value="betting">Betting Rates</SelectItem>
                  <SelectItem value="pending-requests">
                    Pending Requests
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:block">
              <TabsList className="flex flex-wrap justify-start gap-2 md:gap-4 p-1">
                <TabsTrigger value="transactions">All Transactions</TabsTrigger>
                {/* <TabsTrigger value="crypto">Crypto Rates</TabsTrigger> */}
                <TabsTrigger value="gift-cards">Gift Card Rates</TabsTrigger>
                <TabsTrigger value="airtime-data">
                  Airtime/Data Rates
                </TabsTrigger>
                <TabsTrigger value="electricity">Electricity Rates</TabsTrigger>
                <TabsTrigger value="betting">Betting Rates</TabsTrigger>
                <TabsTrigger value="pending-requests">
                  Pending Requests
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="transactions" className="mt-8">
              <AllTransactionsTab />
            </TabsContent>
            {/* <TabsContent value="crypto" className="mt-8">
              <CryptoSettingsTab />
            </TabsContent> */}
            <TabsContent value="gift-cards" className="mt-8">
              <GiftCardRatesTab />
            </TabsContent>
            <TabsContent value="airtime-data" className="mt-8">
              <AirtimeDataRatesTab />
            </TabsContent>
            <TabsContent value="electricity" className="mt-8">
              <ElectricityRatesForm />
            </TabsContent>
            <TabsContent value="betting" className="mt-8">
              <BettingRatesTab />
            </TabsContent>
            <TabsContent value="pending-requests" className="mt-8">
              <PendingRequestsTab />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
}
