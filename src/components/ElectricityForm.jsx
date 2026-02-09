"use client";

import { useState, useEffect } from "react";
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
  Zap,
  ChevronLeft,
  CreditCard,
  ArrowRight,
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

const ELECTRICITY_PROVIDERS = [
  { id: "ikeja-electric", name: "Ikeja (IKEDC)" },
  { id: "eko-electric", name: "Eko (EKEDC)" },
  { id: "kano-electric", name: "Kano (KEDCO)" },
  { id: "portharcourt-electric", name: "Portharcourt (PHED)" },
  { id: "jos-electric", name: "Jos (JED)" },
  { id: "ibadan-electric", name: "Ibadan (IBEDC)" },
  { id: "kaduna-electric", name: "Kaduna (KAEDCO)" },
  { id: "abuja-electric", name: "Abuja (AEDC)" },
  { id: "enugu-electric", name: "Enugu (EEDC)" },
  { id: "benin-electric", name: "Benin (BEDC)" },
  { id: "aba-electric", name: "Aba (ABEDC)" },
  { id: "yola-electric", name: "Yola (YEDC)" },
];

const METER_TYPES = [
  { id: "prepaid", name: "Prepaid" },
  { id: "postpaid", name: "Postpaid" },
];

function ElectricityForm({ user, router }) {
  const [provider, setProvider] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [meterType, setMeterType] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [meterVerified, setMeterVerified] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [electricityRates, setElectricityRates] = useState({
    serviceCharge: 0,
  });
  const { toast } = useToast();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchElectricityRates();
      const unsubscribe = onSnapshot(
        collection(firestore, "users", user.uid, "transactions"),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
              const txn = change.doc.data();
              if (txn.type === "electricity" && txn.status === "success") {
                toast({
                  title: "Purchase Successful!",
                  description: `₦${txn.amountToVTU?.toLocaleString()} units purchased.`,
                });
                fetchWalletBalance();
              }
            }
          });
        },
      );
      return () => unsubscribe();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (userDoc.exists()) setWalletBalance(userDoc.data().walletBalance || 0);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchElectricityRates = async () => {
    try {
      const ratesDoc = await getDoc(
        doc(firestore, "settings", "electricityRates"),
      );
      if (ratesDoc.exists())
        setElectricityRates({
          serviceCharge: ratesDoc.data().serviceCharge || 0,
        });
    } catch (error) {
      console.error(error);
    }
  };

  const verifyMeterNumber = async () => {
    if (!provider || !meterNumber || !meterType) return;
    setIsVerifying(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/electricity/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            service: provider,
            meterNo: meterNumber,
            metertype: meterType,
          }),
        },
      );
      const result = await response.json();
      if (result.success) {
        setMeterVerified(true);
        setCustomerDetails(result.data);
        toast({
          title: "Meter Verified",
          description: `Meter details verified successfully`,
        });
      } else {
        setMeterVerified(false);
        setCustomerDetails(null);
        toast({
          title: "Verification Failed",
          description: result.error || "Invalid meter details",
          variant: "destructive",
        });
      }
    } catch (error) {
      setMeterVerified(false);
      setCustomerDetails(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const getElectricityAmount = () => parseFloat(amount || 0);
  const getServiceCharge = () =>
    (getElectricityAmount() *
      (parseFloat(electricityRates.serviceCharge) || 0)) /
    100;
  const getTotalAmount = () => getElectricityAmount() + getServiceCharge();

  const isSubmitDisabled = () => {
    const eAmt = getElectricityAmount();
    return (
      !isAuthenticated ||
      !provider ||
      !meterNumber ||
      !meterType ||
      !meterVerified ||
      eAmt < 1000 ||
      eAmt > 100000 ||
      walletBalance < getTotalAmount() ||
      isSubmitting ||
      isVerifying
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (walletBalance < getTotalAmount()) {
      setShowInsufficientModal(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken(true);
      const ref = `ELEC_${auth.currentUser.uid}_${Date.now()}`;
      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/electricity/purchase",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            service: provider,
            meterNo: meterNumber,
            metertype: meterType,
            amount: getElectricityAmount(),
            ref,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Transaction failed");
      if (result.success) {
        toast({
          title: "Success!",
          description: "Electricity purchase successful!",
        });
        setProvider("");
        setMeterNumber("");
        setMeterType("");
        setAmount("");
        setMeterVerified(false);
        setCustomerDetails(null);
        fetchWalletBalance();
      }
    } catch (error) {
      toast({
        title: "Failed",
        description: error.message,
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
          <div className="flex items-center gap-2 text-blue-300">
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

      {getTotalAmount() > walletBalance && getElectricityAmount() > 0 && (
        <Alert
          variant="destructive"
          className="mb-6 bg-red-50 border-red-200 text-red-800 font-medium"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">Insufficient Balance</AlertTitle>
          <AlertDescription className="text-xs">
            Required: ₦{getTotalAmount().toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-blue-950 font-semibold">Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="h-12 border-slate-200">
                <SelectValue placeholder="Select DisCo" />
              </SelectTrigger>
              <SelectContent>
                {ELECTRICITY_PROVIDERS.map((prov) => (
                  <SelectItem key={prov.id} value={prov.id}>
                    {prov.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-blue-950 font-semibold">Meter Type</Label>
            <Select value={meterType} onValueChange={setMeterType}>
              <SelectTrigger className="h-12 border-slate-200">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {METER_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-blue-950 font-semibold">Meter Number</Label>
          <div className="flex gap-2">
            <Input
              value={meterNumber}
              onChange={(e) => {
                setMeterNumber(e.target.value);
                setMeterVerified(false);
                setCustomerDetails(null);
              }}
              placeholder="Enter number"
              className="h-12 flex-1 border-slate-200"
              required
            />
            <Button
              type="button"
              onClick={verifyMeterNumber}
              disabled={!provider || !meterNumber || !meterType || isVerifying}
              className={`h-12 px-6 transition-colors ${meterVerified ? "bg-green-600 hover:bg-green-700" : "bg-blue-950"}`}
            >
              {isVerifying ? (
                <Loader className="animate-spin h-4 w-4" />
              ) : meterVerified ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                "Verify"
              )}
            </Button>
          </div>
          {customerDetails && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 animate-in fade-in slide-in-from-top-1">
              <UserCheck className="h-4 w-4" />
              <span className="font-bold uppercase tracking-tight">
                {customerDetails.Customer_Name ||
                  customerDetails.name ||
                  "Verified Customer"}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-blue-950 font-semibold">Amount (₦)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium font-mono">
              ₦
            </span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Min ₦1,000"
              className="h-12 pl-8 border-slate-200"
              required
            />
          </div>
        </div>

        {getElectricityAmount() > 0 && (
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 shadow-inner">
            <div className="flex justify-between text-xs text-slate-500 uppercase font-bold tracking-widest">
              <span>Electricity Value</span>
              <span className="text-blue-950">
                ₦{getElectricityAmount().toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 uppercase font-bold tracking-widest">
              <span>Service Charge ({electricityRates.serviceCharge}%)</span>
              <span className="text-blue-950">
                ₦{getServiceCharge().toLocaleString()}
              </span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between items-center pt-1">
              <span className="text-blue-950 font-bold">Total Deduction</span>
              <span className="text-xl font-black text-blue-950 tracking-tighter">
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
              <span>Processing Payment...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Pay Electricity Bill</span>
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
              Balance Too Low
            </DialogTitle>
            <DialogDescription className="text-center">
              This transaction requires ₦{getTotalAmount().toLocaleString()}.
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
              Top up Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ElectricityPage() {
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
              Electricity <span className="text-orange-400">Bills</span>
            </h1>
            <p className="mt-1 text-slate-600 italic">
              Fast, secure, and reliable energy top-ups for all DisCos.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden border-none shadow-2xl ring-1 ring-slate-200">
          <div className="grid md:grid-cols-5 lg:grid-cols-2">
            <div className="flex flex-col md:col-span-2 lg:col-span-1 bg-blue-950 p-8 md:p-10 justify-center relative overflow-hidden order-first md:order-last">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-orange-400 rounded-full opacity-10 blur-3xl"></div>
              <div className="relative z-10 border border-white/10 rounded-2xl overflow-hidden aspect-video shadow-2xl mb-8">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 to-transparent z-10"></div>
                <img
                  src="/electricity.png"
                  alt="Electricity Illustration"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                  <div className="bg-orange-400 p-1.5 rounded-full">
                    <Zap className="h-4 w-4 text-blue-950" />
                  </div>
                  <span className="text-white font-bold text-sm tracking-wide uppercase">
                    Power Units
                  </span>
                </div>
              </div>
              <div className="space-y-5 relative z-10">
                <h3 className="text-white text-xl font-bold">
                  Why top up here?
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-100 text-sm">
                    <CheckCircle className="h-4 w-4 text-orange-400" />
                    <span>Instant token delivery via SMS & Email</span>
                  </div>
                  <div className="flex items-center gap-3 text-blue-100 text-sm">
                    <CheckCircle className="h-4 w-4 text-orange-400" />
                    <span>Secure 24/7 bill processing</span>
                  </div>
                  <div className="flex items-center gap-3 text-blue-100 text-sm">
                    <CheckCircle className="h-4 w-4 text-orange-400" />
                    <span>Support for all major Nigerian DisCos</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10 md:col-span-3 lg:col-span-1 bg-white">
              <ElectricityForm user={user} router={router} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
