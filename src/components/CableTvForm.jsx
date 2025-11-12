"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";
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
import { CheckCircle, Loader, AlertTriangle, Wallet, Tv } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function CableTVForm({ user, router }) {
  const [provider, setProvider] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [plan, setPlan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cardVerified, setCardVerified] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [tvProviders, setTvProviders] = useState([]);
  const [tvPlans, setTvPlans] = useState([]);
  const [isFetchingPlans, setIsFetchingPlans] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const { toast } = useToast();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchProviders();
    }
  }, [user]);

  useEffect(() => {
    if (provider) {
      fetchTVPlans(provider);
    }
  }, [provider]);

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

  const fetchProviders = async () => {
    try {
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
      console.error("Error fetching TV providers:", error);
      toast({
        title: "Error",
        description: "Failed to load TV providers",
        variant: "destructive",
      });
    }
  };

  const fetchTVPlans = async (tvProvider) => {
    try {
      setIsFetchingPlans(true);
      const ratesDoc = await getDoc(doc(firestore, "settings", "tvRates"));
      if (!ratesDoc.exists()) {
        throw new Error("TV rates not found in Firestore");
      }

      const rates = ratesDoc.data()?.rates || {};
      const plans = Object.keys(rates[tvProvider]?.plans || {}).map(
        (planId) => ({
          id: planId,
          name: rates[tvProvider].plans[planId].name,
          price: rates[tvProvider].plans[planId].finalPrice || 0,
        })
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

  const verifyCardNumber = async () => {
    if (!provider || !cardNumber) return;
    setIsVerifying(true);
    try {
      const response = await fetch(
        `https://higestdata-proxy.onrender.com/api/tv/verify?provider=${provider}&customerId=${cardNumber}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const result = await response.json();
      if (result.success && result.data) {
        setCardVerified(true);
        toast({
          title: "Smart Card Verified",
          description: `Smart card number verified for ${provider}.`,
        });
      } else {
        setCardVerified(false);
        toast({
          title: "Verification Failed",
          description: result.message || "Invalid smart card number.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setCardVerified(false);
      toast({
        title: "Verification Error",
        description: "Unable to verify smart card number. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getTransactionAmount = () => {
    const selectedPlan = tvPlans.find((p) => p.id === plan);
    return selectedPlan ? selectedPlan.price : 0;
  };

  const isSubmitDisabled = () => {
    const amount = getTransactionAmount();
    return (
      !isAuthenticated ||
      !provider ||
      !cardNumber ||
      !plan ||
      !cardVerified ||
      amount <= 0 ||
      walletBalance < amount ||
      isSubmitting ||
      isVerifying
    );
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

    const amount = getTransactionAmount();

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Plan",
        description: "Please select a valid subscription plan.",
        variant: "destructive",
      });
      return;
    }

    if (walletBalance < amount) {
      setShowInsufficientModal(true);
      return;
    }

    if (!cardVerified) {
      toast({
        title: "Smart Card Not Verified",
        description: "Please verify your smart card number before proceeding.",
        variant: "destructive",
      });
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
        serviceType: "cable",
        amount,
        finalPrice: amount,
        network: provider,
        variationId: plan,
        customerId: cardNumber,
      };

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

      const isCompleted = result.status === "success";

      toast({
        title: isCompleted ? "Success!" : "Processing",
        description: isCompleted
          ? "Cable TV subscription activated successfully!"
          : "Your cable subscription is being processed. You'll be notified when complete.",
      });

      // Reset form
      setProvider("");
      setCardNumber("");
      setPlan("");
      setCardVerified(false);
      setCustomerDetails(null);

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
      {/* Wallet Balance Display */}
      <div className="bg-primary/5 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-4 w-4" />
          <span className="text-sm font-medium">Wallet Balance</span>
        </div>
        <p className="text-2xl font-bold">₦{walletBalance.toLocaleString()}</p>
      </div>

      {/* Insufficient Balance Warning */}
      {getTransactionAmount() > walletBalance && getTransactionAmount() > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Insufficient Balance</AlertTitle>
          <AlertDescription>
            Your wallet balance (₦{walletBalance.toLocaleString()}) is less than
            the required amount (₦{getTransactionAmount().toLocaleString()}).
            Please fund your wallet to proceed.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="provider">Cable Provider *</Label>
          <Select value={provider} onValueChange={setProvider} required>
            <SelectTrigger id="provider">
              <SelectValue placeholder="Select cable provider" />
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
          <Label htmlFor="cardNumber">Smart Card Number *</Label>
          <div className="flex gap-2">
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => {
                setCardNumber(e.target.value);
                setCardVerified(false);
              }}
              placeholder="Enter smart card number"
              required
            />
            <Button
              type="button"
              onClick={verifyCardNumber}
              disabled={!provider || !cardNumber || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : cardVerified ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Verified
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your cable provider smart card number or account ID. Verify before
            subscribing.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan">Subscription Plan *</Label>
          <Select value={plan} onValueChange={setPlan} required>
            <SelectTrigger id="plan">
              <SelectValue placeholder="Select subscription plan" />
            </SelectTrigger>
            <SelectContent>
              {isFetchingPlans ? (
                <div className="flex justify-center p-4">
                  <Loader className="h-4 w-4 animate-spin" />
                </div>
              ) : tvPlans.length > 0 ? (
                tvPlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - ₦{p.price.toLocaleString()}
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No plans available
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Preview */}
        {getTransactionAmount() > 0 && (
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subscription Amount:</span>
              <span className="font-medium">
                ₦{getTransactionAmount().toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              This amount will be deducted from your wallet.
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitDisabled()}>
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Subscribe to Cable TV"
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

export default function CableTVPage() {
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
          Cable TV Subscription
        </h1>
        <p className="text-muted-foreground">
          Pay for your cable TV subscriptions instantly. Fast, secure, and
          reliable.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <CardHeader className="px-0">
              <CardTitle>Cable TV Subscription</CardTitle>
              <CardDescription>
                Select your provider and enter your smart card details.
              </CardDescription>
            </CardHeader>
            <CableTVForm user={user} router={router} />
          </div>

          <div className="bg-muted/50 p-8 md:p-12 flex flex-col justify-center">
            <div className="relative aspect-video mb-8 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-center text-white">
                <Tv className="h-16 w-16 mx-auto mb-4 opacity-80" />
                <h3 className="text-xl font-semibold mb-2">Stay Entertained</h3>
                <p className="text-sm opacity-90">
                  Subscribe to all major providers
                </p>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-secondary-foreground">
              Supported Providers
            </h3>
            <p className="text-muted-foreground mb-4">
              Pay for DStv, GOtv, Startimes, Showmax, and more.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Instant subscription activation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Secure wallet integration</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Support for all major cable providers</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
