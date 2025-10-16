"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
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
  const [provider, setProvider] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPlans, setIsFetchingPlans] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [dataPlans, setDataPlans] = useState([]);
  const [tvPlans, setTvPlans] = useState([]);
  const [airtimeRates, setAirtimeRates] = useState({});
  const [dataProviders, setDataProviders] = useState([]);
  const [tvProviders, setTvProviders] = useState([]);
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
          Object.keys(rates).map((key) => ({
            id: key,
            name: rates[key].name || key.toUpperCase(),
          }))
        );
      }

      const tvDoc = await getDoc(doc(firestore, "settings", "tvRates"));
      if (tvDoc.exists()) {
        const rates = tvDoc.data()?.rates || {};
        setTvProviders(
          Object.keys(rates).map((key) => ({
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
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");

      const token = await currentUser.getIdToken();
      const response = await fetch("/api/vtu/fetch-rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: "data", provider: networkProvider }),
      });

      console.log("fetchDataPlans response status:", response.status);
      console.log("fetchDataPlans response headers:", [...response.headers]);

      if (!response.ok) {
        const text = await response.text();
        console.error("fetchDataPlans response text:", text);
        throw new Error(
          `HTTP ${response.status}: ${text || "Failed to fetch data plans"}`
        );
      }

      const result = await response.json();
      console.log("fetchDataPlans result:", result);

      const ratesDoc = await getDoc(doc(firestore, "settings", "dataRates"));
      const discount = ratesDoc.exists()
        ? ratesDoc.data()?.rates?.[networkProvider]?.finalDiscount || 0
        : 0;

      const plans = Object.keys(result.rates?.[networkProvider] || {}).map(
        (planId) => {
          const plan = result.rates[networkProvider][planId];
          const basePrice = parseFloat(plan.price) || 0;
          const finalPrice = basePrice * (1 - discount / 100);
          return {
            id: planId,
            name: plan.name || planId,
            price: finalPrice,
          };
        }
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

  const fetchTVPlans = async (tvProvider) => {
    try {
      setIsFetchingPlans(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");

      const token = await currentUser.getIdToken();
      const response = await fetch("/api/vtu/fetch-rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: "tv", provider: tvProvider }),
      });

      console.log("fetchTVPlans response status:", response.status);
      console.log("fetchTVPlans response headers:", [...response.headers]);

      if (!response.ok) {
        const text = await response.text();
        console.error("fetchTVPlans response text:", text);
        throw new Error(
          `HTTP ${response.status}: ${text || "Failed to fetch TV plans"}`
        );
      }

      const result = await response.json();
      console.log("fetchTVPlans result:", result);

      const ratesDoc = await getDoc(doc(firestore, "settings", "tvRates"));
      const discount = ratesDoc.exists()
        ? ratesDoc.data()?.rates?.[tvProvider]?.finalDiscount || 0
        : 0;
      const serviceFee = ratesDoc.exists()
        ? ratesDoc.data()?.rates?.[tvProvider]?.finalServiceFee || 0
        : 0;

      const plans = Object.keys(result.rates?.[tvProvider] || {}).map(
        (planId) => {
          const plan = result.rates[tvProvider][planId];
          const basePrice = parseFloat(plan.price) || 0;
          const finalPrice = basePrice * (1 - discount / 100) + serviceFee;
          return {
            id: planId,
            name: plan.name || planId,
            price: finalPrice,
          };
        }
      );

      setTvPlans(plans);
    } catch (error) {
      console.error("Error fetching TV plans:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load TV plans",
        variant: "destructive",
      });
    } finally {
      setIsFetchingPlans(false);
    }
  };

  const getTransactionAmount = () => {
    if (type === "Airtime") {
      const rate = airtimeRates[network]?.finalPrice || 100;
      const vendAmount = parseFloat(amount || "0");
      return vendAmount * (rate / 100);
    } else if (type === "Data") {
      const selectedPlan = dataPlans.find((plan) => plan.id === dataPlan);
      return selectedPlan ? selectedPlan.price : 0;
    } else if (type === "Cable") {
      const selectedPlan = tvPlans.find((plan) => plan.id === dataPlan);
      return selectedPlan ? selectedPlan.price : 0;
    }
    return 0;
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

    const chargeAmount = getTransactionAmount();

    if (!chargeAmount || chargeAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount or select a plan.",
        variant: "destructive",
      });
      return;
    }

    if (walletBalance < chargeAmount) {
      setShowInsufficientModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const token = await currentUser.getIdToken(true);
      const finalPrice =
        type === "Airtime"
          ? airtimeRates[network]?.finalPrice || 100
          : chargeAmount;

      const transactionData = {
        userId: currentUser.uid,
        serviceType: type.toLowerCase(),
        amount: chargeAmount,
        phone: phone || undefined,
        network: network || undefined,
        variationId: dataPlan || undefined,
        customerId: cardNumber || undefined,
        finalPrice,
      };

      const response = await fetch("/api/vtu/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      });

      const result = await response.json();

      if (response.status === 402) {
        toast({
          title: "Insufficient Balance",
          description:
            "Your wallet balance is not enough for this transaction.",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        if (result.transactionData) {
          const transactionId =
            result.transactionId ||
            `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          await setDoc(
            doc(
              firestore,
              "users",
              currentUser.uid,
              "transactions",
              transactionId
            ),
            {
              ...result.transactionData,
              createdAt: serverTimestamp(),
            }
          );
        }
        throw new Error(result.error || "Transaction failed");
      }

      await updateDoc(doc(firestore, "users", currentUser.uid), {
        walletBalance: walletBalance - result.transactionData.amount,
      });

      if (result.transactionData) {
        await setDoc(
          doc(
            firestore,
            "users",
            currentUser.uid,
            "transactions",
            result.transactionId
          ),
          {
            ...result.transactionData,
            createdAt: serverTimestamp(),
          }
        );
      }

      toast({
        title: "Transaction Successful",
        description: `${type} purchase completed successfully.`,
      });

      setNetwork("");
      setPhone("");
      setAmount("");
      setDataPlan("");
      setProvider("");
      setCardNumber("");
      fetchWalletBalance();
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {type !== "Cable" && (
          <div className="space-y-2">
            <Label htmlFor="network">Network Provider</Label>
            <Select value={network} onValueChange={setNetwork}>
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
        )}
        {type === "Cable" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="provider">Cable Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger id="provider" className="text-foreground">
                  <SelectValue placeholder="Select Provider" />
                </SelectTrigger>
                <SelectContent>
                  {tvProviders.length > 0 ? (
                    tvProviders.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id}>
                        {prov.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No TV providers available
                    </div>
                  )}
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
              ? "Amount (₦)"
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
          {type === "Cable" && (
            <Select value={dataPlan} onValueChange={setDataPlan} required>
              <SelectTrigger id="tv-plan" className="text-foreground">
                <SelectValue placeholder="Select Subscription Plan" />
              </SelectTrigger>
              <SelectContent>
                {isFetchingPlans ? (
                  <div className="flex justify-center p-4">
                    <Loader className="h-4 w-4 animate-spin" />
                  </div>
                ) : tvPlans.length > 0 ? (
                  tvPlans.map((plan) => (
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
              <TabsContent value="cable" className="space-y-4">
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
