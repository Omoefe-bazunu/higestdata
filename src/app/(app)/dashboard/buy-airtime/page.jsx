// components/VTUPurchaseForm.js
// Updated VTU form with wallet integration

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { CheckCircle, Loader, AlertTriangle, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Reusable VTU Purchase Form
function PurchaseForm({ type, user, router }) {
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [dataPlan, setDataPlan] = useState("");
  const [provider, setProvider] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [dataPlans, setDataPlans] = useState([]);
  const [tvPlans, setTvPlans] = useState([]);
  const { toast } = useToast();

  const isAuthenticated = !!user;

  // Fetch user wallet balance
  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  // Fetch data plans when network changes
  useEffect(() => {
    if (network && type === "Data") {
      fetchDataPlans(network);
    }
  }, [network, type]);

  // Fetch TV plans when provider changes
  useEffect(() => {
    if (provider && type === "Cable") {
      fetchTVPlans(provider);
    }
  }, [provider, type]);

  const fetchWalletBalance = async () => {
    try {
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (userDoc.exists()) {
        setWalletBalance(userDoc.data().walletBalance || 0);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  };

  // Fetch available data plans from rates
  const fetchDataPlans = async (networkProvider) => {
    try {
      const ratesDoc = await getDoc(doc(firestore, "settings", "dataRates"));
      if (ratesDoc.exists()) {
        const rates = ratesDoc.data()?.rates || {};
        const networkPlans = rates[networkProvider] || {};

        const plans = Object.keys(networkPlans).map((planId) => ({
          id: planId,
          name: networkPlans[planId].name || planId,
          price: networkPlans[planId].price || 0,
        }));

        setDataPlans(plans);
      }
    } catch (error) {
      console.error("Error fetching data plans:", error);
    }
  };

  // Fetch available TV plans from rates
  const fetchTVPlans = async (tvProvider) => {
    try {
      const ratesDoc = await getDoc(doc(firestore, "settings", "tvRates"));
      if (ratesDoc.exists()) {
        const rates = ratesDoc.data()?.rates || {};
        const providerPlans = rates[tvProvider] || {};

        const plans = Object.keys(providerPlans).map((planId) => ({
          id: planId,
          name: providerPlans[planId].name || planId,
          price: providerPlans[planId].price || 0,
        }));

        setTvPlans(plans);
      }
    } catch (error) {
      console.error("Error fetching TV plans:", error);
    }
  };

  // Get transaction amount based on service type
  const getTransactionAmount = () => {
    if (type === "Airtime") {
      return parseFloat(amount || 0);
    } else if (type === "Data") {
      const selectedPlan = dataPlans.find((plan) => plan.id === dataPlan);
      return selectedPlan ? selectedPlan.price : 0;
    } else if (type === "Cable") {
      const selectedPlan = tvPlans.find((plan) => plan.id === dataPlan);
      return selectedPlan ? selectedPlan.price : parseFloat(amount || 0);
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue.",
        variant: "destructive",
      });
      return;
    }

    const transactionAmount = getTransactionAmount();

    // Validate transaction amount
    if (!transactionAmount || transactionAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount or select a plan.",
        variant: "destructive",
      });
      return;
    }

    // Check wallet balance
    if (walletBalance < transactionAmount) {
      setShowInsufficientModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare transaction data
      const transactionData = {
        userId: user.uid,
        serviceType: type.toLowerCase(),
        amount: transactionAmount,
        phone: phone,
        network: network,
        variationId: dataPlan,
        customerId: cardNumber,
      };

      // Call VTU transaction API
      const response = await fetch("/api/vtu/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Transaction Successful",
          description: `${type} purchase completed successfully.`,
        });

        // Reset form
        setNetwork("");
        setPhone("");
        setAmount("");
        setDataPlan("");
        setProvider("");
        setCardNumber("");

        // Refresh wallet balance
        fetchWalletBalance();
      } else {
        toast({
          title: "Transaction Failed",
          description: result.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Transaction error:", error);
      toast({
        title: "Transaction Failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Wallet Balance Display */}
      <div className="bg-primary/5 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-4 w-4" />
          <span className="text-sm font-medium">Wallet Balance</span>
        </div>
        <p className="text-2xl font-bold">₦{walletBalance.toLocaleString()}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {type !== "Cable" && (
          <div className="space-y-2">
            <Label htmlFor="network">Network Provider</Label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger id="network">
                <SelectValue placeholder="Select Network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mtn">MTN</SelectItem>
                <SelectItem value="glo">Glo</SelectItem>
                <SelectItem value="airtel">Airtel</SelectItem>
                <SelectItem value="9mobile">9mobile</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {type === "Cable" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="provider">Cable Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dstv">DSTV</SelectItem>
                  <SelectItem value="gotv">GoTV</SelectItem>
                  <SelectItem value="startimes">Startimes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Smart Card Number</Label>
              <Input
                id="cardNumber"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="e.g., 1234567890"
                required
              />
            </div>
          </>
        )}

        {type !== "Cable" && (
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08012345678"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="amount">
            {type === "Airtime"
              ? "Amount"
              : type === "Cable"
              ? "Subscription Plan"
              : "Data Plan"}
          </Label>

          {type === "Airtime" && (
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 1000"
              min="50"
              required
            />
          )}

          {type === "Data" && (
            <Select value={dataPlan} onValueChange={setDataPlan} required>
              <SelectTrigger id="data-plan">
                <SelectValue placeholder="Select Data Plan" />
              </SelectTrigger>
              <SelectContent>
                {dataPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - ₦{plan.price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {type === "Cable" && (
            <Select value={dataPlan} onValueChange={setDataPlan} required>
              <SelectTrigger id="tv-plan">
                <SelectValue placeholder="Select Subscription Plan" />
              </SelectTrigger>
              <SelectContent>
                {tvPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - ₦{plan.price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Amount Preview */}
        {getTransactionAmount() > 0 && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Amount to be charged:</span> ₦
              {getTransactionAmount().toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This will be deducted from your wallet balance.
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !isAuthenticated}
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            `Purchase ${type}`
          )}
        </Button>
      </form>

      {/* Insufficient Balance Modal */}
      <Dialog
        open={showInsufficientModal}
        onOpenChange={setShowInsufficientModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Insufficient Balance
            </DialogTitle>
            <DialogDescription>
              Your wallet balance is insufficient for this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Required Amount:</span> ₦
                {getTransactionAmount().toLocaleString()}
              </p>
              <p className="text-sm">
                <span className="font-medium">Current Balance:</span> ₦
                {walletBalance.toLocaleString()}
              </p>
              <p className="text-sm text-red-600">
                <span className="font-medium">Shortfall:</span> ₦
                {(getTransactionAmount() - walletBalance).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowInsufficientModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowInsufficientModal(false);
                  // Redirect to funding page
                  window.location.href = "/dashboard/wallet";
                }}
                className="flex-1"
              >
                Fund Wallet
              </Button>
              <Button asChild variant="outline">
                <DialogClose>Cancel</DialogClose>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function BuyAirtimePage() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((usr) => {
      if (usr) {
        setUser(usr);
        setAuthChecked(true); // only mark as checked if authenticated
      } else {
        router.replace("/login"); // ensure redirect happens without flash
      }
    });
    return () => unsub();
  }, [router]);
  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-4">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Buy Airtime, Data & Cable
        </h1>
        <p className="text-muted-foreground">
          Instantly top up or pay subscriptions. Fast, easy, and reliable.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <Tabs defaultValue="airtime" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="airtime">Airtime</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="cable">Cable TV</TabsTrigger>
              </TabsList>

              <TabsContent value="airtime">
                <CardHeader className="px-0">
                  <CardTitle>Buy Airtime</CardTitle>
                  <CardDescription>
                    Enter details to top up airtime.
                  </CardDescription>
                </CardHeader>
                <PurchaseForm type="Airtime" user={user} router={router} />
              </TabsContent>

              <TabsContent value="data">
                <CardHeader className="px-0">
                  <CardTitle>Buy Data</CardTitle>
                  <CardDescription>
                    Choose a data plan that suits you.
                  </CardDescription>
                </CardHeader>
                <PurchaseForm type="Data" user={user} router={router} />
              </TabsContent>

              <TabsContent value="cable">
                <CardHeader className="px-0">
                  <CardTitle>Cable TV Subscription</CardTitle>
                  <CardDescription>
                    Pay for your cable subscription.
                  </CardDescription>
                </CardHeader>
                <PurchaseForm type="Cable" user={user} router={router} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="bg-muted/50 p-8 md:p-12 flex flex-col justify-center">
            <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
              <Image
                src="/vtu.png"
                alt="Mobile services illustration"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-secondary-foreground">
              Seamlessly Connected
            </h3>
            <p className="text-muted-foreground mb-4">
              Stay online and entertained. Recharge anytime, anywhere.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Instant delivery on all services</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Secure payments from your wallet</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Competitive rates and reliable plans</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
