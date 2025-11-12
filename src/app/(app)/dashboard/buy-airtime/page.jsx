"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function PurchaseForm({ type, user, router }) {
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [dataPlan, setDataPlan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPlans, setIsFetchingPlans] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [dataPlans, setDataPlans] = useState([]);
  const [airtimeRates, setAirtimeRates] = useState({});
  const [dataProviders, setDataProviders] = useState([]);
  const { toast } = useToast();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchProviders();
      fetchAirtimeRates();
    }
  }, [user]);

  useEffect(() => {
    if (network && type === "Data") {
      fetchDataPlans(network);
    }
  }, [network, type]);

  //TRANSACTION NOTICE

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      collection(firestore, "users", user.uid, "transactions"),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified") {
            const txn = change.doc.data();
            if (txn.status === "success" && txn.pending === false) {
              toast({
                title: "Transaction Completed!",
                description: `Your ${txn.serviceType} transaction was successful.`,
              });
              fetchWalletBalance(); // Refresh balance
            }
          }
        });
      }
    );

    return () => unsubscribe();
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (userDoc.exists()) {
        setWalletBalance(userDoc.data().walletBalance || 0);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      toast({
        title: "Error",
        description: "Failed to load wallet balance",
        variant: "destructive",
      });
    }
  };

  const fetchAirtimeRates = async () => {
    try {
      const ratesDoc = await getDoc(doc(firestore, "settings", "airtimeRates"));
      if (ratesDoc.exists()) {
        const rates = ratesDoc.data()?.rates || {};
        setAirtimeRates(rates);
      }
    } catch (error) {
      console.error("Error fetching airtime rates:", error);
    }
  };

  const fetchProviders = async () => {
    try {
      const dataDoc = await getDoc(doc(firestore, "settings", "dataRates"));
      if (dataDoc.exists()) {
        const rates = dataDoc.data()?.rates || {};
        setDataProviders(
          Object.keys(rates)
            .filter((key) =>
              ["mtn", "airtel", "glo", "9mobile", "smile"].includes(key)
            )
            .map((key) => ({
              id: key,
              name: rates[key].name || key.toUpperCase(),
            }))
        );
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast({
        title: "Error",
        description: "Failed to load providers",
        variant: "destructive",
      });
    }
  };

  const fetchDataPlans = async (networkProvider) => {
    try {
      setIsFetchingPlans(true);
      const ratesDoc = await getDoc(doc(firestore, "settings", "dataRates"));
      if (!ratesDoc.exists()) {
        throw new Error("Data rates not found in Firestore");
      }

      const rates = ratesDoc.data()?.rates || {};
      const plans = Object.keys(rates[networkProvider]?.plans || {}).map(
        (planId) => ({
          id: planId,
          name: rates[networkProvider].plans[planId].name,
          price: rates[networkProvider].plans[planId].finalPrice || 0,
        })
      );

      setDataPlans(plans);
    } catch (error) {
      console.error("Error fetching data plans:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load data plans",
        variant: "destructive",
      });
    } finally {
      setIsFetchingPlans(false);
    }
  };

  // Calculate the amount to be deducted from user's wallet
  const getWalletDeductionAmount = () => {
    if (type === "Airtime") {
      const airtimeValue = parseFloat(amount || "0");
      const discountPercentage = airtimeRates[network]?.discountPercentage || 0;
      // User pays less than the airtime value (discounted price)
      return airtimeValue * (1 - discountPercentage / 100);
    } else if (type === "Data") {
      const selectedPlan = dataPlans.find((plan) => plan.id === dataPlan);
      return selectedPlan ? selectedPlan.price : 0;
    }
    return 0;
  };

  // Get the actual airtime value to be sent to eBills (for airtime only)
  const getEBillsAmount = () => {
    if (type === "Airtime") {
      return parseFloat(amount || "0");
    } else if (type === "Data") {
      const selectedPlan = dataPlans.find((plan) => plan.id === dataPlan);
      return selectedPlan ? selectedPlan.price : 0;
    }
    return 0;
  };

  const isSubmitDisabled = () => {
    const deductionAmount = getWalletDeductionAmount();
    return (
      !isAuthenticated ||
      !network ||
      !phone ||
      (type === "Airtime" && (!amount || parseFloat(amount) <= 0)) ||
      (type === "Data" && !dataPlan) ||
      walletBalance < deductionAmount ||
      isSubmitting ||
      isFetchingPlans
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue.",
        variant: "destructive",
      });
      return;
    }

    const walletDeduction = getWalletDeductionAmount();
    const eBillsAmount = getEBillsAmount();

    if (!walletDeduction || walletDeduction <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount or select a plan.",
        variant: "destructive",
      });
      return;
    }

    if (walletBalance < walletDeduction) {
      setShowInsufficientModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");

      const token = await currentUser.getIdToken(true);

      const transactionData = {
        userId: currentUser.uid,
        serviceType: type.toLowerCase(),
        amount: eBillsAmount, // Amount sent to eBills
        finalPrice: walletDeduction, // Amount deducted from wallet
        phone,
        network,
        variationId: dataPlan || undefined,
      };

      // CALL RENDER BACKEND
      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/vtu/transaction",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transactionData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Transaction failed");
      }

      // NO WALLET DEDUCTION HERE
      // NO TRANSACTION SAVE HERE
      // → Backend + Webhook handles it

      toast({
        title: result.status === "success" ? "Success!" : "Processing",
        description:
          result.status === "success"
            ? `${type} purchased successfully!`
            : "Transaction is being processed. You'll be notified when complete.",
        variant: result.status === "success" ? "default" : "default",
      });

      // Reset form
      setNetwork("");
      setPhone("");
      setAmount("");
      setDataPlan("");
      fetchWalletBalance(); // Refresh balance (will update via Firestore listener later)
    } catch (error) {
      console.error("Transaction error:", error);
      toast({
        title: "Transaction Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-primary/5 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-4 w-4" />
          <span className="text-sm font-medium">Wallet Balance</span>
        </div>
        <p className="text-2xl font-bold">₦{walletBalance.toLocaleString()}</p>
      </div>

      {getWalletDeductionAmount() > walletBalance &&
        getWalletDeductionAmount() > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Insufficient Balance</AlertTitle>
            <AlertDescription>
              Your wallet balance (₦{walletBalance.toLocaleString()}) is less
              than the required amount (₦
              {getWalletDeductionAmount().toLocaleString()}). Please fund your
              wallet to proceed.
            </AlertDescription>
          </Alert>
        )}

      <div onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="network">Network Provider *</Label>
          <Select value={network} onValueChange={setNetwork} required>
            <SelectTrigger id="network" className="text-foreground">
              <SelectValue placeholder="Select Network" />
            </SelectTrigger>
            <SelectContent>
              {type === "Airtime" ? (
                Object.keys(airtimeRates).length > 0 ? (
                  Object.keys(airtimeRates).map((networkId) => (
                    <SelectItem key={networkId} value={networkId}>
                      {airtimeRates[networkId].name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    No airtime networks available
                  </div>
                )
              ) : dataProviders.length > 0 ? (
                dataProviders.map((prov) => (
                  <SelectItem key={prov.id} value={prov.id}>
                    {prov.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  No data providers available
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08012345678"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">
            {type === "Airtime" ? "Airtime Value (₦)" : "Data Plan"} *
          </Label>
          {type === "Airtime" && (
            <>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 1000"
                min="50"
                required
              />
              {network && amount && parseFloat(amount) > 0 && (
                <p className="text-xs text-muted-foreground">
                  You'll receive ₦{parseFloat(amount).toLocaleString()} airtime
                  with a {airtimeRates[network]?.discountPercentage || 0}%
                  discount
                </p>
              )}
            </>
          )}
          {type === "Data" && (
            <Select value={dataPlan} onValueChange={setDataPlan} required>
              <SelectTrigger id="data-plan" className="text-foreground">
                <SelectValue placeholder="Select Data Plan" />
              </SelectTrigger>
              <SelectContent>
                {isFetchingPlans ? (
                  <div className="flex justify-center p-4">
                    <Loader className="h-4 w-4 animate-spin" />
                  </div>
                ) : dataPlans.length > 0 ? (
                  dataPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ₦{plan.price.toLocaleString()}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No plans available
                  </div>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {getWalletDeductionAmount() > 0 && (
          <div className="bg-muted p-3 rounded-lg space-y-2">
            {type === "Airtime" && (
              <>
                <p className="text-sm">
                  <span className="font-medium">Airtime Value:</span> ₦
                  {getEBillsAmount().toLocaleString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">
                    Discount ({airtimeRates[network]?.discountPercentage || 0}
                    %):
                  </span>{" "}
                  -₦
                  {(getEBillsAmount() - getWalletDeductionAmount()).toFixed(2)}
                </p>
              </>
            )}
            <p className="text-sm font-semibold">
              <span className="font-medium">Amount to be charged:</span> ₦
              {getWalletDeductionAmount().toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              This will be deducted from your wallet balance.
            </p>
          </div>
        )}

        <Button
          type="button"
          onClick={handleSubmit}
          className="w-full"
          disabled={isSubmitDisabled()}
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            `Purchase ${type}`
          )}
        </Button>
      </div>

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
                {getWalletDeductionAmount().toLocaleString()}
              </p>
              <p className="text-sm">
                <span className="font-medium">Current Balance:</span> ₦
                {walletBalance.toLocaleString()}
              </p>
              <p className="text-sm text-red-600">
                <span className="font-medium">Shortfall:</span> ₦
                {(getWalletDeductionAmount() - walletBalance).toLocaleString()}
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
                  router.push("/dashboard/wallet");
                }}
                className="flex-1"
              >
                Fund Wallet
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
        setAuthChecked(true);
      } else {
        router.replace("/login");
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
        <h1 className="text-3xl font-bold font-headline">Buy Airtime & Data</h1>
        <p className="text-muted-foreground">
          Instantly top up airtime or data plans. Fast, easy, and reliable.
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <Tabs defaultValue="airtime" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="airtime">Airtime</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>
              <TabsContent value="airtime" className="space-y-4">
                <CardHeader className="px-0">
                  <CardTitle>Buy Airtime</CardTitle>
                  <CardDescription>
                    Enter details to top up airtime.
                  </CardDescription>
                </CardHeader>
                <PurchaseForm type="Airtime" user={user} router={router} />
              </TabsContent>
              <TabsContent value="data" className="space-y-4">
                <CardHeader className="px-0">
                  <CardTitle>Buy Data</CardTitle>
                  <CardDescription>
                    Choose a data plan that suits you.
                  </CardDescription>
                </CardHeader>
                <PurchaseForm type="Data" user={user} router={router} />
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
              Stay online with instant airtime and data recharges.
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
