// components/BettingForm.js
// Betting form component with wallet integration

"use client";

import { useState, useEffect } from "react";
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
import Image from "next/image";
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
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Betting providers supported by eBills
const BETTING_PROVIDERS = [
  { id: "1xBet", name: "1xBet", logo: "/betting/1xbet.png" },
  { id: "BangBet", name: "BangBet", logo: "/betting/bangbet.png" },
  { id: "Bet9ja", name: "Bet9ja", logo: "/betting/bet9ja.png" },
  { id: "BetKing", name: "BetKing", logo: "/betting/betking.png" },
  { id: "BetLand", name: "BetLand", logo: "/betting/betland.png" },
  { id: "BetLion", name: "BetLion", logo: "/betting/betlion.png" },
  { id: "BetWay", name: "BetWay", logo: "/betting/betway.png" },
  { id: "CloudBet", name: "CloudBet", logo: "/betting/cloudbet.png" },
  {
    id: "LiveScoreBet",
    name: "LiveScore Bet",
    logo: "/betting/livescorebet.png",
  },
  { id: "MerryBet", name: "MerryBet", logo: "/betting/merrybet.png" },
  { id: "NaijaBet", name: "NaijaBet", logo: "/betting/naijabed.png" },
  { id: "NairaBet", name: "NairaBet", logo: "/betting/nairabet.png" },
  { id: "SupaBet", name: "SupaBet", logo: "/betting/supabet.png" },
];

function BettingForm({ user, router }) {
  const [provider, setProvider] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [bettingRates, setBettingRates] = useState({
    serviceCharge: 0,
    chargeType: "fixed",
  });
  const { toast } = useToast();

  const isAuthenticated = !!user;

  // Fetch user wallet balance and betting rates
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
    }
  };

  const fetchBettingRates = async () => {
    try {
      const ratesDoc = await getDoc(doc(firestore, "settings", "bettingRates"));
      if (ratesDoc.exists()) {
        const data = ratesDoc.data();
        setBettingRates({
          serviceCharge: data.serviceCharge || 0,
          chargeType: data.chargeType || "fixed",
        });
      }
    } catch (error) {
      console.error("Error fetching betting rates:", error);
    }
  };

  // Get betting amount (what goes to betting account)
  const getBettingAmount = () => {
    return parseFloat(amount || 0);
  };

  // Get service charge
  const getServiceCharge = () => {
    const bettingAmount = getBettingAmount();
    const serviceCharge = parseFloat(bettingRates.serviceCharge) || 0;

    if (bettingRates.chargeType === "percentage") {
      return (bettingAmount * serviceCharge) / 100;
    } else {
      return serviceCharge;
    }
  };

  // Get total amount to be charged (betting amount + service charge)
  const getTotalAmount = () => {
    return getBettingAmount() + getServiceCharge();
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

    // Validate betting amount
    if (!bettingAmount || bettingAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount (minimum ₦50).",
        variant: "destructive",
      });
      return;
    }

    // Minimum amount validation
    if (bettingAmount < 50) {
      toast({
        title: "Minimum Amount Required",
        description: "Minimum funding amount is ₦50.",
        variant: "destructive",
      });
      return;
    }

    // Check wallet balance against total amount (including service charge)
    if (walletBalance < totalAmount) {
      setShowInsufficientModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare transaction data
      const transactionData = {
        userId: user.uid,
        serviceType: "betting",
        bettingAmount: bettingAmount,
        serviceCharge: getServiceCharge(),
        totalAmount: totalAmount,
        provider: provider,
        customerId: customerId,
      };

      // Call betting transaction API
      const response = await fetch("/api/betting/fund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Funding Successful",
          description: `₦${bettingAmount.toLocaleString()} has been credited to your ${provider} account.`,
        });

        // Reset form
        setProvider("");
        setCustomerId("");
        setAmount("");

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
        <div className="space-y-2">
          <Label htmlFor="provider">Betting Provider *</Label>
          <Select value={provider} onValueChange={setProvider} required>
            <SelectTrigger id="provider">
              <SelectValue placeholder="Choose betting provider" />
            </SelectTrigger>
            <SelectContent>
              {BETTING_PROVIDERS.map((betting) => (
                <SelectItem key={betting.id} value={betting.id}>
                  <div className="flex items-center gap-2">
                    <span>{betting.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerId">Customer ID *</Label>
          <Input
            id="customerId"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="Enter customer (account) ID"
            required
          />
          <p className="text-xs text-muted-foreground">
            Your betting account ID or username
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
            min="50"
            required
          />
          <p className="text-xs text-muted-foreground">Minimum amount: ₦50</p>
        </div>

        {/* Amount Preview */}
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
              betting account.
              {getServiceCharge() > 0 &&
                " Service charge will be deducted from your wallet."}
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
            `Fund Betting Account`
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
                  // Redirect to funding page
                  window.location.href = "/dashboard/wallet";
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
                <span>No service fees</span>
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
