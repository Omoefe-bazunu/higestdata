"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
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
  Loader,
  AlertTriangle,
  Wallet,
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

  useEffect(() => {
    if (!user) return;
    fetchWalletBalance();
    fetchAirtimeRates();
    fetchDataProviders();
  }, [user]);

  useEffect(() => {
    if (network && type === "Data") fetchDataPlans(network);
  }, [network, type]);

  const fetchWalletBalance = async () => {
    const snap = await getDoc(doc(firestore, "users", user.uid));
    if (snap.exists()) setWalletBalance(snap.data().walletBalance || 0);
  };

  const fetchAirtimeRates = async () => {
    const snap = await getDoc(doc(firestore, "settings", "airtimeRates"));
    if (snap.exists()) setAirtimeRates(snap.data().rates || {});
  };

  const fetchDataProviders = async () => {
    const snap = await getDoc(doc(firestore, "settings", "dataRates"));
    if (snap.exists()) {
      const rates = snap.data().rates || {};
      setDataProviders(
        Object.keys(rates).map((k) => ({
          id: k,
          name: rates[k].name || k,
        })),
      );
    }
  };

  const fetchDataPlans = async (provider) => {
    setIsFetchingPlans(true);
    try {
      const snap = await getDoc(doc(firestore, "settings", "dataRates"));
      if (!snap.exists()) throw new Error("Data rates not configured");

      const plansObj = snap.data()?.rates?.[provider]?.plans || {};
      const plans = Object.entries(plansObj)
        .map(([id, p]) => ({
          id,
          display: p.size
            ? `${p.size} (${p.validity || ""})`.trim() +
              ` - ₦${p.finalPrice?.toLocaleString()}`
            : `${p.name || id} - ₦${p.finalPrice?.toLocaleString()}`,
          price: Number(p.finalPrice || 0),
        }))
        .sort((a, b) => a.price - b.price);

      setDataPlans(plans);
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsFetchingPlans(false);
    }
  };

  const getWalletDeduction = () => {
    if (type === "Airtime") {
      const val = parseFloat(amount || 0);
      const disc = airtimeRates[network]?.discountPercentage || 0;
      return val * (1 - disc / 100);
    }
    const plan = dataPlans.find((p) => p.id === dataPlan);
    return plan?.price || 0;
  };

  const isDisabled = () => {
    const deduction = getWalletDeduction();
    return (
      !network ||
      !phone ||
      (type === "Airtime" && (!amount || parseFloat(amount) < 50)) ||
      (type === "Data" && !dataPlan) ||
      walletBalance < deduction ||
      isSubmitting ||
      isFetchingPlans
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const deduction = getWalletDeduction();
    if (walletBalance < deduction) {
      setShowInsufficientModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      const ref = `VTU_${user.uid}_${Date.now()}`;

      const endpoint =
        type === "Airtime" ? "/api/airtime/purchase" : "/api/data/purchase";

      const body =
        type === "Airtime"
          ? {
              network: network.toLowerCase(),
              phone,
              amount: parseFloat(amount),
              ref,
            }
          : {
              service: network,
              MobileNumber: phone,
              DataPlan: dataPlan,
              ref,
            };

      const res = await fetch(
        `https://higestdata-proxy.onrender.com${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transaction failed");

      toast({ title: "Success", description: `${type} purchased!` });
      setPhone("");
      setAmount("");
      setDataPlan("");
      setNetwork("");
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
      {/* Wallet Balance Card */}
      <div className="relative overflow-hidden bg-blue-950 rounded-xl p-5 mb-8 shadow-md border border-blue-900">
        <div className="absolute top-[-20%] right-[-5%] opacity-10">
          <Wallet className="h-24 w-24 text-white" />
        </div>
        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-blue-200">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Available Balance
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

      {getWalletDeduction() > walletBalance && getWalletDeduction() > 0 && (
        <Alert
          variant="destructive"
          className="mb-6 bg-red-50 border-red-200 text-red-800"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">Insufficient Balance</AlertTitle>
          <AlertDescription className="text-xs">
            Deduction: ₦{getWalletDeduction().toLocaleString()} • Please fund
            your wallet to continue.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5">
          {/* Network Selector */}
          <div className="space-y-2">
            <Label className="text-blue-950 font-semibold">
              Select Provider
            </Label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger className="h-12 border-slate-200 focus:ring-blue-950 transition-all">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                {type === "Airtime"
                  ? Object.keys(airtimeRates).map((n) => (
                      <SelectItem key={n} value={n}>
                        {airtimeRates[n].name || n}
                      </SelectItem>
                    ))
                  : dataProviders.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label className="text-blue-950 font-semibold">
              Recipient Phone Number
            </Label>
            <Input
              type="tel"
              className="h-12 border-slate-200 focus:ring-blue-950"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 08012345678"
              required
            />
          </div>

          {/* Airtime Amount */}
          {type === "Airtime" && (
            <div className="space-y-2">
              <Label className="text-blue-950 font-semibold">
                Amount (Min ₦50)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  ₦
                </span>
                <Input
                  type="number"
                  min="50"
                  className="h-12 pl-8 border-slate-200 focus:ring-blue-950"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              {network && amount && (
                <div className="flex justify-between items-center px-1">
                  <p className="text-xs text-slate-500 italic">
                    You pay:{" "}
                    <span className="font-bold text-blue-950">
                      ₦{getWalletDeduction().toLocaleString()}
                    </span>
                  </p>
                  <p className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">
                    Save {airtimeRates[network]?.discountPercentage || 0}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Data Plan Selector */}
          {type === "Data" && (
            <div className="space-y-2">
              <Label className="text-blue-950 font-semibold">
                Choose Data Plan
              </Label>
              <Select value={dataPlan} onValueChange={setDataPlan}>
                <SelectTrigger className="h-12 border-slate-200">
                  <SelectValue
                    placeholder={
                      isFetchingPlans
                        ? "Fetching available bundles..."
                        : "Select a plan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isFetchingPlans ? (
                    <div className="p-4 text-center">
                      <Loader className="h-5 w-5 animate-spin mx-auto text-orange-400" />
                    </div>
                  ) : dataPlans.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      {network
                        ? "No plans found for this network"
                        : "Please select a network first"}
                    </div>
                  ) : (
                    dataPlans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.display}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          type="submit"
          className="w-full h-14 text-lg font-bold bg-blue-950 hover:bg-blue-900 shadow-lg shadow-blue-950/20 transition-all active:scale-[0.98]"
          disabled={isDisabled()}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader className="h-5 w-5 animate-spin" />
              <span>Processing Transaction...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Purchase {type}</span>
              <ArrowRight className="h-5 w-5" />
            </div>
          )}
        </Button>
      </form>

      {/* Insufficient Balance Modal */}
      <Dialog
        open={showInsufficientModal}
        onOpenChange={setShowInsufficientModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto bg-orange-100 p-3 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-blue-950">
              Low Wallet Balance
            </DialogTitle>
            <DialogDescription className="text-center text-slate-500 text-base">
              This transaction requires{" "}
              <span className="font-bold text-blue-950">
                ₦{getWalletDeduction().toLocaleString()}
              </span>
              , but you only have{" "}
              <span className="font-bold text-orange-500">
                ₦{walletBalance.toLocaleString()}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-4">
            <Button
              variant="outline"
              className="w-full border-slate-200"
              onClick={() => setShowInsufficientModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="w-full bg-blue-950 hover:bg-blue-900"
              onClick={() => router.push("/dashboard/wallet")}
            >
              Top up Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PurchaseForm;
