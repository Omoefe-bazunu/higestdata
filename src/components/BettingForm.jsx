"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
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
import {
  CheckCircle,
  Loader,
  AlertTriangle,
  Wallet,
  DollarSign,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BETTING_PROVIDERS = [
  { id: "1xBet", name: "1xBet" },
  { id: "BangBet", name: "BangBet" },
  { id: "Bet9ja", name: "Bet9ja" },
  { id: "BetKing", name: "BetKing" },
  { id: "BetLand", name: "BetLand" },
  { id: "BetLion", name: "BetLion" },
  { id: "BetWay", name: "BetWay" },
  { id: "CloudBet", name: "CloudBet" },
  { id: "LiveScoreBet", name: "LiveScoreBet" },
  { id: "MerryBet", name: "MerryBet" },
  { id: "NaijaBet", name: "NaijaBet" },
  { id: "NairaBet", name: "NairaBet" },
  { id: "SupaBet", name: "SupaBet" },
];

function BettingForm({ user, router }) {
  const [provider, setProvider] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [customerVerified, setCustomerVerified] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [bettingRates, setBettingRates] = useState({
    serviceCharge: 0,
    chargeType: "percentage",
  });
  const { toast } = useToast();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchBettingRates();
    }
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

  const fetchBettingRates = async () => {
    try {
      const ratesDoc = await getDoc(doc(firestore, "settings", "bettingRates"));
      if (ratesDoc.exists()) {
        const data = ratesDoc.data();
        setBettingRates({
          serviceCharge: data.serviceCharge || 0,
          chargeType: data.chargeType || "percentage",
        });
      }
    } catch (error) {
      console.error("Error fetching betting rates:", error);
    }
  };

  const verifyCustomerId = async () => {
    if (!provider || !customerId) return;
    setIsVerifying(true);
    try {
      const params = new URLSearchParams({
        provider,
        customerId,
      });
      const response = await fetch(`/api/betting/verify?${params}`, {
        method: "GET",
      });
      const result = await response.json();
      if (result.success && result.data) {
        setCustomerVerified(true);
        toast({
          title: "Customer Verified",
          description: `Customer ID verified for ${provider}.`,
        });
      } else {
        setCustomerVerified(false);
        toast({
          title: "Verification Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setCustomerVerified(false);
      toast({
        title: "Verification Error",
        description: "Try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getBettingAmount = () => {
    return parseFloat(amount || 0);
  };

  const getServiceCharge = () => {
    const bettingAmount = getBettingAmount();
    const serviceCharge = parseFloat(bettingRates.serviceCharge) || 0;
    return bettingRates.chargeType === "percentage"
      ? (bettingAmount * serviceCharge) / 100
      : serviceCharge;
  };

  const getTotalAmount = () => {
    return getBettingAmount() + getServiceCharge();
  };

  const isSubmitDisabled = () => {
    const bettingAmount = getBettingAmount();
    const totalAmount = getTotalAmount();
    return (
      !isAuthenticated ||
      !provider ||
      !customerId ||
      !customerVerified ||
      !bettingAmount ||
      bettingAmount < 100 ||
      bettingAmount > 100000 ||
      walletBalance < totalAmount ||
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

    const bettingAmount = getBettingAmount();
    const totalAmount = getTotalAmount();

    if (!bettingAmount || bettingAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount (₦100–₦100,000).",
        variant: "destructive",
      });
      return;
    }

    if (bettingAmount < 100) {
      toast({
        title: "Minimum Amount Required",
        description: "Minimum funding amount is ₦100.",
        variant: "destructive",
      });
      return;
    }

    if (bettingAmount > 100000) {
      toast({
        title: "Maximum Amount Exceeded",
        description: "Maximum funding amount is ₦100,000.",
        variant: "destructive",
      });
      return;
    }

    if (walletBalance < totalAmount) {
      setShowInsufficientModal(true);
      return;
    }

    if (!customerVerified) {
      toast({
        title: "Customer Not Verified",
        description: "Please verify your customer ID before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const transactionPayload = {
        userId: currentUser.uid,
        serviceType: "betting",
        amount: bettingAmount,
        serviceCharge: getServiceCharge(),
        totalAmount: totalAmount,
        provider,
        customerId,
      };

      // Call API first
      const response = await fetch("/api/betting/fund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await currentUser.getIdToken(true)}`,
        },
        body: JSON.stringify(transactionPayload),
      });

      const result = await response.json();

      if (result.success && result.transactionData) {
        // Use Firestore transaction to update wallet and save transaction atomically
        await runTransaction(firestore, async (transaction) => {
          const userDocRef = doc(firestore, "users", currentUser.uid);
          const userDoc = await transaction.get(userDocRef);

          if (!userDoc.exists()) {
            throw new Error("User document not found");
          }

          const currentBalance = userDoc.data().walletBalance || 0;
          const newBalance = currentBalance - totalAmount;

          // Update wallet balance
          transaction.update(userDocRef, {
            walletBalance: newBalance,
            updatedAt: serverTimestamp(),
          });

          // Save transaction
          const transactionRef = doc(
            firestore,
            "users",
            currentUser.uid,
            "transactions",
            result.transactionId
          );

          transaction.set(transactionRef, {
            ...result.transactionData,
            createdAt: serverTimestamp(),
          });
        });

        toast({
          title: "Funding Successful",
          description: `₦${bettingAmount.toLocaleString()} has been credited to your ${provider} account.`,
        });

        // Reset form
        setProvider("");
        setCustomerId("");
        setAmount("");
        setCustomerVerified(false);

        // Refresh wallet balance
        await fetchWalletBalance();
      } else {
        // Handle failed transaction - just save it without deducting wallet
        if (result.transactionData) {
          const transactionRef = doc(
            firestore,
            "users",
            currentUser.uid,
            "transactions",
            result.transactionId
          );

          await setDoc(transactionRef, {
            ...result.transactionData,
            createdAt: serverTimestamp(),
          });
        }

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
        description: error.message || "Network error. Please try again.",
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

      {getTotalAmount() > walletBalance && getBettingAmount() > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Insufficient Balance</AlertTitle>
          <AlertDescription>
            Your wallet balance (₦{walletBalance.toLocaleString()}) is less than
            the required amount (₦{getTotalAmount().toLocaleString()}). Please
            fund your wallet to proceed.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="provider">Betting Provider *</Label>
          <Select value={provider} onValueChange={setProvider} required>
            <SelectTrigger id="provider">
              <SelectValue placeholder="Choose betting provider" />
            </SelectTrigger>
            <SelectContent>
              {BETTING_PROVIDERS.map((betting) => (
                <SelectItem key={betting.id} value={betting.id}>
                  {betting.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerId">Customer ID *</Label>
          <div className="flex gap-2">
            <Input
              id="customerId"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setCustomerVerified(false);
              }}
              placeholder="Enter customer (account) ID"
              required
            />
            <Button
              type="button"
              onClick={verifyCustomerId}
              disabled={!provider || !customerId || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : customerVerified ? (
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
            Your betting account ID or username. Verify before funding.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₦) *</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="100"
            max="100000"
            required
          />
          <p className="text-xs text-muted-foreground">
            Minimum: ₦100, Maximum: ₦100,000
          </p>
        </div>

        {getBettingAmount() > 0 && (
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span>Betting Amount:</span>
              <span className="font-medium">
                ₦{getBettingAmount().toLocaleString()}
              </span>
            </div>
            {getServiceCharge() > 0 && (
              <div className="flex justify-between text-sm">
                <span>Service Charge:</span>
                <span className="font-medium">
                  ₦{getServiceCharge().toLocaleString()}
                </span>
              </div>
            )}
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total to be charged:</span>
                <span className="font-bold text-lg">
                  ₦{getTotalAmount().toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ₦{getBettingAmount().toLocaleString()} will be credited to your
              betting account.{" "}
              {getServiceCharge() > 0 &&
                "Service charge will be deducted from your wallet."}
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
            "Fund Betting Account"
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
                <span className="font-medium">Betting Amount:</span> ₦
                {getBettingAmount().toLocaleString()}
              </p>
              {getServiceCharge() > 0 && (
                <p className="text-sm">
                  <span className="font-medium">Service Charge:</span> ₦
                  {getServiceCharge().toLocaleString()}
                </p>
              )}
              <p className="text-sm">
                <span className="font-medium">Total Required:</span> ₦
                {getTotalAmount().toLocaleString()}
              </p>
              <p className="text-sm">
                <span className="font-medium">Current Balance:</span> ₦
                {walletBalance.toLocaleString()}
              </p>
              <p className="text-sm text-red-600">
                <span className="font-medium">Shortfall:</span> ₦
                {(getTotalAmount() - walletBalance).toLocaleString()}
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

export default function BettingPage() {
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
          Fund Your Betting Accounts
        </h1>
        <p className="text-muted-foreground">
          Top up your favorite betting platforms instantly. Fast, secure, and
          reliable.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <CardHeader className="px-0">
              <CardTitle>Fund Betting Account</CardTitle>
              <CardDescription>
                Select your betting provider and enter your account details.
              </CardDescription>
            </CardHeader>
            <BettingForm user={user} router={router} />
          </div>

          <div className="bg-muted/50 p-8 md:p-12 flex flex-col justify-center">
            <div className="relative aspect-video mb-8 rounded-lg overflow-hidden bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
              <div className="text-center text-white">
                <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-80" />
                <h3 className="text-xl font-semibold mb-2">
                  Betting Made Easy
                </h3>
                <p className="text-sm opacity-90">Fund all major platforms</p>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-secondary-foreground">
              Supported Platforms
            </h3>
            <p className="text-muted-foreground mb-4">
              Fund your accounts on 1xBet, BangBet, Bet9ja, BetKing, BetLand,
              BetWay, and many more betting platforms.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Instant account funding</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Secure wallet integration</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Support for 13+ betting platforms</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
