"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import Link from "next/link";
import {
  Card,
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
  Phone,
  ChevronLeft,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const BETTING_SERVICES = [
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
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [customerVerified, setCustomerVerified] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [bettingRates, setBettingRates] = useState({
    serviceCharge: 0,
    chargeType: "fixed",
  });
  const [customerName, setCustomerName] = useState("");
  const { toast } = useToast();

  const initialLoadRef = useRef(true);
  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchBettingRates();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      collection(firestore, "users", user.uid, "transactions"),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (initialLoadRef.current) {
            initialLoadRef.current = false;
            return;
          }
          if (change.type === "added" || change.type === "modified") {
            const txn = change.doc.data();
            const transactionTime = txn.createdAt?.toDate?.() || new Date();
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (transactionTime < fiveMinutesAgo) return;
            if (txn.type === "betting" && txn.status === "success") {
              toast({
                title: "Betting Account Funded!",
                description: `₦${txn.amountToVTU?.toLocaleString()} credited to ${txn.service} account successfully.`,
              });
              fetchWalletBalance();
            } else if (txn.type === "betting" && txn.status === "pending") {
              toast({
                title: "Transaction Pending",
                description: `Your ${txn.service} funding is being processed.`,
              });
            }
          }
        });
      },
    );
    return () => unsubscribe();
  }, [user, toast]);

  useEffect(() => {
    return () => {
      initialLoadRef.current = true;
    };
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (userDoc.exists()) setWalletBalance(userDoc.data().walletBalance || 0);
    } catch (error) {
      console.error(error);
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
      console.error(error);
    }
  };

  const verifyCustomerId = async () => {
    if (!provider || !customerId) return;
    setIsVerifying(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");
      const token = await currentUser.getIdToken(true);
      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/betting/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ service: provider, userid: customerId }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Verification failed");
      if (result.success) {
        setCustomerVerified(true);
        const name = result.data?.description?.Customer || "Verified Customer";
        setCustomerName(name);
        toast({
          title: "Account Verified",
          description: `${provider} account for ${name} verified.`,
        });
      } else {
        setCustomerVerified(false);
        setCustomerName("");
        toast({
          title: "Verification Failed",
          description: result.error || "Invalid account ID.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setCustomerVerified(false);
      setCustomerName("");
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getBettingAmount = () => parseFloat(amount || 0);
  const getServiceCharge = () => {
    const bettingAmount = getBettingAmount();
    const serviceCharge = parseFloat(bettingRates.serviceCharge) || 0;
    return bettingRates.chargeType === "percentage"
      ? (bettingAmount * serviceCharge) / 100
      : serviceCharge;
  };
  const getTotalAmount = () => getBettingAmount() + getServiceCharge();

  const isSubmitDisabled = () => {
    const bettingAmount = getBettingAmount();
    return (
      !isAuthenticated ||
      !provider ||
      !customerId ||
      !customerVerified ||
      !bettingAmount ||
      bettingAmount < 100 ||
      bettingAmount > 100000 ||
      walletBalance < getTotalAmount() ||
      isSubmitting ||
      isVerifying
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    const bettingAmount = getBettingAmount();
    const totalAmount = getTotalAmount();
    if (walletBalance < totalAmount) {
      setShowInsufficientModal(true);
      return;
    }
    if (!customerVerified) return;
    setIsSubmitting(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken(true);
      const reference = `BET_${currentUser.uid}_${Date.now()}`;
      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/betting/fund",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            service: provider,
            userid: customerId,
            amount: bettingAmount,
            ref: reference,
            phone: phone || undefined,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Transaction failed");
      if (result.success) {
        toast({
          title: "Success!",
          description: `₦${bettingAmount.toLocaleString()} credited successfully!`,
        });
        setProvider("");
        setCustomerId("");
        setAmount("");
        setPhone("");
        setCustomerVerified(false);
        setCustomerName("");
        fetchWalletBalance();
      } else if (result.status === "pending") {
        toast({
          title: "Transaction Processing",
          description: result.message || "Please wait for confirmation.",
        });
        fetchWalletBalance();
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (customerVerified) {
      setCustomerVerified(false);
      setCustomerName("");
    }
  }, [provider, customerId]);

  return (
    <>
      {/* Wallet Card */}
      <div className="relative overflow-hidden bg-blue-950 rounded-xl p-5 mb-8 shadow-md border border-blue-900">
        <div className="absolute top-[-20%] right-[-5%] opacity-10">
          <Wallet className="h-24 w-24 text-white" />
        </div>
        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-blue-300">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Wallet Balance
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-medium text-orange-400">₦</span>
            <span className="text-3xl font-bold text-white tracking-tight">
              {walletBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {getTotalAmount() > walletBalance && getBettingAmount() > 0 && (
        <Alert
          variant="destructive"
          className="mb-6 bg-red-50 border-red-200 text-red-800"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">Insufficient Balance</AlertTitle>
          <AlertDescription className="text-xs">
            Total Required: ₦{getTotalAmount().toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-blue-950 font-semibold">
            Betting Provider
          </Label>
          <Select value={provider} onValueChange={setProvider} required>
            <SelectTrigger className="h-12 border-slate-200 focus:ring-blue-950">
              <SelectValue placeholder="Choose provider" />
            </SelectTrigger>
            <SelectContent>
              {BETTING_SERVICES.map((betting) => (
                <SelectItem key={betting.id} value={betting.id}>
                  {betting.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-blue-950 font-semibold">
            Account ID / Username
          </Label>
          <div className="flex gap-2">
            <Input
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Enter ID"
              required
              className="h-12 flex-1 border-slate-200 focus:ring-blue-950"
            />
            <Button
              type="button"
              onClick={verifyCustomerId}
              disabled={!provider || !customerId || isVerifying}
              className={`h-12 px-6 ${customerVerified ? "bg-green-600 hover:bg-green-700" : "bg-blue-950"}`}
            >
              {isVerifying ? (
                <Loader className="animate-spin h-4 w-4" />
              ) : customerVerified ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                "Verify"
              )}
            </Button>
          </div>
          {customerName && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-100">
              <UserCheck className="h-4 w-4" />
              <span className="font-bold uppercase tracking-tight">
                {customerName}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-blue-950 font-semibold">
            Phone Number (Optional)
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08012345678"
              className="h-12 pl-10 border-slate-200 focus:ring-blue-950"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-blue-950 font-semibold">Amount to Fund</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
              ₦
            </span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Min ₦100"
              className="h-12 pl-8 border-slate-200"
              required
            />
          </div>
        </div>

        {getBettingAmount() > 0 && (
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-xs text-slate-500 uppercase font-bold tracking-widest">
              <span>Subtotal</span>
              <span>₦{getBettingAmount().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 uppercase font-bold tracking-widest">
              <span>Service Fee</span>
              <span>₦{getServiceCharge().toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
              <span className="text-blue-950 font-bold">Total Charge</span>
              <span className="text-xl font-black text-blue-950">
                ₦{getTotalAmount().toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-14 text-lg font-bold bg-blue-950 hover:bg-blue-900 shadow-lg shadow-blue-950/10 transition-all active:scale-[0.98]"
          disabled={isSubmitDisabled()}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader className="h-5 w-5 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Fund Account</span>
              <ArrowRight className="h-5 w-5" />
            </div>
          )}
        </Button>
      </form>

      <Dialog
        open={showInsufficientModal}
        onOpenChange={setShowInsufficientModal}
      >
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto bg-orange-100 p-3 rounded-full mb-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
            <DialogTitle className="text-center text-xl text-blue-950">
              Insufficient Balance
            </DialogTitle>
            <DialogDescription className="text-center">
              Total required: ₦{getTotalAmount().toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowInsufficientModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="w-full bg-blue-950"
              onClick={() => router.push("/dashboard/wallet")}
            >
              Fund Wallet
            </Button>
          </DialogFooter>
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
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader className="h-10 w-10 animate-spin text-blue-950" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-4">
          <Link
            href="/dashboard/tools"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-950 group"
          >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />{" "}
            Back to Services
          </Link>
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-blue-950 font-headline">
              Betting{" "}
              <span className="text-orange-400 text-nowrap">Funding</span>
            </h1>
            <p className="mt-1 text-slate-600">
              Fund your account across all major platforms instantly.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden border-none shadow-2xl ring-1 ring-slate-200">
          <div className="grid md:grid-cols-5 lg:grid-cols-2">
            <div className="flex flex-col md:col-span-2 lg:col-span-1 bg-blue-950 p-8 md:p-10 justify-center relative overflow-hidden order-first md:order-last">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-orange-400 rounded-full opacity-10 blur-3xl"></div>
              <div className="relative z-10 border border-white/10 rounded-2xl overflow-hidden aspect-video shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 to-transparent z-10"></div>
                <img
                  src="/betting.jpg"
                  alt="Betting Illustration"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                  <div className="bg-orange-400 p-1.5 rounded-full">
                    <ShieldCheck className="h-4 w-4 text-blue-950" />
                  </div>
                  <span className="text-white font-bold text-sm tracking-wide uppercase">
                    Secure Payouts
                  </span>
                </div>
              </div>
              <div className="mt-8 space-y-6 relative z-10">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-orange-400" />
                  <span className="text-blue-100 text-sm">
                    Verified account details
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-orange-400" />
                  <span className="text-blue-100 text-sm">
                    Instant wallet-to-betting credit
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10 md:col-span-3 lg:col-span-1 bg-white">
              <BettingForm user={user} router={router} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
