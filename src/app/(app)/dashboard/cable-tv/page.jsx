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
import { CheckCircle } from "lucide-react";
import { Loader, AlertTriangle, Wallet, Tv } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
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

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchProviders();
    }
  }, [user]);

  useEffect(() => {
    if (provider) fetchTVPlans(provider);
  }, [provider]);

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
        }))
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
        }
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
      <div className="bg-primary/5 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-4 w-4" />
          <span className="text-sm font-medium">Wallet Balance</span>
        </div>
        <p className="text-2xl font-bold">₦{walletBalance.toLocaleString()}</p>
      </div>

      {getAmount() > walletBalance && getAmount() > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Insufficient Balance</AlertTitle>
          <AlertDescription>
            Required: ₦{getAmount().toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Provider *</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
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
          <Label>Smart Card / IUC Number *</Label>
          <Input
            value={smartCardNumber}
            onChange={(e) => setSmartCardNumber(e.target.value)}
            placeholder="Enter your smart card number"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Subscription Plan *</Label>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isFetchingPlans ? "Loading plans..." : "Choose plan"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {isFetchingPlans ? (
                <div className="p-4">
                  <Loader className="h-4 w-4 animate-spin mx-auto" />
                </div>
              ) : tvPlans.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No plans available
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
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-lg font-bold">
              Amount to Pay: ₦{getAmount().toLocaleString()}
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isDisabled()}>
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : (
            "Subscribe Now"
          )}
        </Button>
      </form>

      <Dialog
        open={showInsufficientModal}
        onOpenChange={setShowInsufficientModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insufficient Balance</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Required: ₦{getAmount().toLocaleString()} • Available: ₦
            {walletBalance.toLocaleString()}
          </p>
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
          Subscribe to GOtv, DStv, Startimes instantly.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <CardHeader className="px-0">
              <CardTitle>Cable TV</CardTitle>
              <CardDescription>
                Enter your smart card number and choose plan
              </CardDescription>
            </CardHeader>
            <CableTVForm user={user} router={router} />
          </div>

          <div
            className="p-8 md:p-12 flex flex-col justify-center relative min-h-[400px] rounded-lg overflow-hidden"
            style={{
              backgroundImage: "url('/cabletv.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Optional overlay for better text readability if needed */}
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
        </div>
      </Card>
    </div>
  );
}
