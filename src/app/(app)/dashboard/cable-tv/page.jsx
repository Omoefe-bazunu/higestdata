"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import Link from "next/link";
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
  Tv,
  UserCheck,
  ChevronLeft,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

function CableTVForm({ user, router }) {
  const [provider, setProvider] = useState("");
  const [smartCardNumber, setSmartCardNumber] = useState("");
  const [plan, setPlan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [tvProviders, setTvProviders] = useState([]);
  const [tvPlans, setTvPlans] = useState([]);
  const [isFetchingPlans, setIsFetchingPlans] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchProviders();
    }
  }, [user]);

  useEffect(() => {
    if (provider) fetchTVPlans(provider);
  }, [provider]);

  useEffect(() => {
    setCustomerName("");
  }, [provider, smartCardNumber]);

  const fetchWalletBalance = async () => {
    const snap = await getDoc(doc(firestore, "users", user.uid));
    if (snap.exists()) setWalletBalance(snap.data().walletBalance || 0);
  };

  const fetchProviders = async () => {
    const snap = await getDoc(doc(firestore, "settings", "tvRates"));
    if (snap.exists()) {
      const rates = snap.data()?.rates || {};
      setTvProviders(
        Object.keys(rates).map((k) => ({
          id: k,
          name:
            rates[k].name ||
            { gotv: "GOtv", dstv: "DStv", startimes: "Startimes" }[k] ||
            k.toUpperCase(),
        })),
      );
    }
  };

  const fetchTVPlans = async (prov) => {
    setIsFetchingPlans(true);
    const snap = await getDoc(doc(firestore, "settings", "tvRates"));
    if (snap.exists()) {
      const plansObj = snap.data()?.rates?.[prov]?.plans || {};
      const plans = Object.entries(plansObj).map(([id, p]) => ({
        id,
        name: p.name || id.replace(/_/g, " ").toUpperCase(),
        price: Number(p.finalPrice || 0),
      }));
      setTvPlans(plans);
    }
    setIsFetchingPlans(false);
  };

  const verifySmartCard = async () => {
    if (!provider || !smartCardNumber || smartCardNumber.length < 9) return;
    setIsVerifying(true);
    try {
      const token = await getAuth().currentUser.getIdToken();
      const res = await fetch(
        "https://higestdata-proxy.onrender.com/api/cabletv/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ service: provider, smartNo: smartCardNumber }),
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomerName(data.customerName);
        toast({ title: "Verified", description: data.customerName });
      } else {
        setCustomerName("");
        toast({
          title: "Invalid",
          description: "Verification failed",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const getAmount = () => tvPlans.find((p) => p.id === plan)?.price || 0;

  const isDisabled = () =>
    !provider ||
    !smartCardNumber ||
    !plan ||
    getAmount() <= 0 ||
    walletBalance < getAmount() ||
    isSubmitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = getAmount();
    if (walletBalance < amount) {
      setShowInsufficientModal(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await getAuth().currentUser.getIdToken();
      const ref = `TV_${user.uid}_${Date.now()}`;
      const res = await fetch(
        "https://higestdata-proxy.onrender.com/api/cabletv/purchase",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            service: provider,
            smartNo: smartCardNumber,
            variation: plan,
            ref,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Subscription failed");
      toast({
        title: "Success!",
        description: "Cable TV subscribed successfully!",
      });
      setSmartCardNumber("");
      setPlan("");
      setProvider("");
      fetchWalletBalance();
    } catch (err) {
      toast({
        title: "Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden bg-blue-950 rounded-xl p-5 mb-8 shadow-md border border-blue-900">
        <div className="absolute top-[-20%] right-[-5%] opacity-10">
          <Wallet className="h-24 w-24 text-white" />
        </div>
        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-blue-200">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
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

      {getAmount() > walletBalance && getAmount() > 0 && (
        <Alert
          variant="destructive"
          className="mb-6 bg-red-50 border-red-200 text-red-800"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">Insufficient Balance</AlertTitle>
          <AlertDescription>
            Required: ₦{getAmount().toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-blue-950 font-semibold">TV Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="h-12 border-slate-200 focus:ring-blue-950 transition-all">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {tvProviders.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-blue-950 font-semibold">
            IUC / Smart Card Number
          </Label>
          <div className="flex gap-2">
            <Input
              value={smartCardNumber}
              onChange={(e) => setSmartCardNumber(e.target.value)}
              placeholder="Enter number"
              required
              className="h-12 flex-1 border-slate-200 focus:ring-blue-950"
              onBlur={verifySmartCard}
            />
            <Button
              type="button"
              variant="outline"
              onClick={verifySmartCard}
              disabled={isVerifying || !smartCardNumber}
              className="h-12 px-6 border-blue-950 text-blue-950 hover:bg-blue-50"
            >
              {isVerifying ? (
                <Loader className="animate-spin h-4 w-4" />
              ) : (
                "Verify"
              )}
            </Button>
          </div>
          {customerName && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 animate-in fade-in slide-in-from-top-1">
              <UserCheck className="h-4 w-4" />
              <span className="font-bold uppercase tracking-tight">
                {customerName}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-blue-950 font-semibold">
            Subscription Plan
          </Label>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger className="h-12 border-slate-200">
              <SelectValue
                placeholder={
                  isFetchingPlans ? "Loading plans..." : "Choose plan"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {isFetchingPlans ? (
                <div className="p-4 text-center">
                  <Loader className="h-5 w-5 animate-spin mx-auto text-orange-400" />
                </div>
              ) : (
                tvPlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - ₦{p.price.toLocaleString()}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {getAmount() > 0 && (
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center shadow-inner">
            <p className="text-sm text-slate-500 mb-1 font-medium uppercase tracking-wider">
              Total Charge
            </p>
            <p className="text-2xl font-black text-blue-950">
              ₦{getAmount().toLocaleString()}
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-14 text-lg font-bold bg-blue-950 hover:bg-blue-900 shadow-lg shadow-blue-950/10 transition-all active:scale-[0.98]"
          disabled={isDisabled() || (provider !== "startimes" && !customerName)}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader className="h-5 w-5 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Pay & Subscribe</span>
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
              Low Funds
            </DialogTitle>
            <DialogDescription className="text-center">
              Required: ₦{getAmount().toLocaleString()} • You have ₦
              {walletBalance.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
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
              Cable TV <span className="text-orange-400">Sub</span>
            </h1>
            <p className="mt-1 text-slate-600">
              Renew your subscription for DStv, GOtv, and Startimes in seconds.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden border-none shadow-2xl ring-1 ring-slate-200">
          <div className="grid md:grid-cols-5 lg:grid-cols-2">
            {/* Visual Header (Mobile First) */}
            <div className="flex flex-col md:col-span-2 lg:col-span-1 bg-blue-950 p-8 md:p-10 justify-center relative overflow-hidden order-first md:order-last">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-orange-400 rounded-full opacity-10 blur-3xl"></div>
              <div className="relative z-10 border border-white/10 rounded-2xl overflow-hidden aspect-video shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 to-transparent z-10"></div>
                <img
                  src="/cabletv.png"
                  alt="TV Illustration"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                  <div className="bg-orange-400 p-1.5 rounded-full">
                    <Tv className="h-4 w-4 text-blue-950" />
                  </div>
                  <span className="text-white font-bold text-sm tracking-wide uppercase">
                    Entertainment Hub
                  </span>
                </div>
              </div>
              <div className="mt-8 space-y-4 relative z-10 hidden md:block">
                <p className="text-blue-200 text-sm italic">
                  Never miss your favorite shows. Fast verification and instant
                  activation.
                </p>
              </div>
            </div>

            {/* Form Column */}
            <div className="p-6 md:p-10 md:col-span-3 lg:col-span-1 bg-white">
              <CableTVForm user={user} router={router} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
