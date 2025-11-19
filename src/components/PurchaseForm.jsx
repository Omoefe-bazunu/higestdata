"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";
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
import { Loader, AlertTriangle, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
        }))
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
        }
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
      <div className="bg-primary/5 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-4 w-4" />
          <span className="text-sm font-medium">Wallet Balance</span>
        </div>
        <p className="text-2xl font-bold">₦{walletBalance.toLocaleString()}</p>
      </div>

      {getWalletDeduction() > walletBalance && getWalletDeduction() > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Insufficient Balance</AlertTitle>
          <AlertDescription>
            Required ₦{getWalletDeduction().toLocaleString()} • Balance ₦
            {walletBalance.toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Network/Provider */}
        <div className="space-y-2">
          <Label>Network *</Label>
          <Select value={network} onValueChange={setNetwork}>
            <SelectTrigger>
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

        {/* Phone */}
        <div className="space-y-2">
          <Label>Phone Number *</Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08012345678"
            required
          />
        </div>

        {/* Airtime Amount */}
        {type === "Airtime" && (
          <div className="space-y-2">
            <Label>Amount (₦) *</Label>
            <Input
              type="number"
              min="50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {network && amount && (
              <p className="text-xs text-muted-foreground">
                You pay ₦{getWalletDeduction().toFixed(2)} • Receive ₦
                {parseFloat(amount).toLocaleString()} (
                {airtimeRates[network]?.discountPercentage || 0}% discount)
              </p>
            )}
          </div>
        )}

        {/* Data Plan */}
        {type === "Data" && (
          <div className="space-y-2">
            <Label>Data Plan *</Label>
            <Select value={dataPlan} onValueChange={setDataPlan}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isFetchingPlans ? "Loading plans..." : "Choose plan"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {isFetchingPlans ? (
                  <div className="p-4 text-center">
                    <Loader className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : dataPlans.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No plans available
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

        {/* Charge Summary */}
        {getWalletDeduction() > 0 && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-semibold">
              Amount to be deducted: ₦{getWalletDeduction().toLocaleString()}
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isDisabled()}>
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Buy ${type}`
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
              <AlertTriangle className="text-orange-500" />
              Insufficient Balance
            </DialogTitle>
            <DialogDescription>
              Required: ₦{getWalletDeduction().toLocaleString()} • Available: ₦
              {walletBalance.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowInsufficientModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => router.push("/dashboard/wallet")}>
              Fund Wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PurchaseForm;
