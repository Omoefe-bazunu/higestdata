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
import { CheckCircle, Loader, AlertTriangle, Wallet, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Updated electricity providers to match VTU Africa service IDs
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

      // Listen for transaction updates
      const unsubscribe = onSnapshot(
        collection(firestore, "users", user.uid, "transactions"),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
              const txn = change.doc.data();
              if (txn.type === "electricity" && txn.status === "success") {
                toast({
                  title: "Electricity Purchase Successful!",
                  description: `₦${txn.amountToVTU?.toLocaleString()} electricity units purchased successfully.`,
                });
                fetchWalletBalance();
              }
            }
          });
        }
      );

      return () => unsubscribe();
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

  const fetchElectricityRates = async () => {
    try {
      const ratesDoc = await getDoc(
        doc(firestore, "settings", "electricityRates")
      );
      if (ratesDoc.exists()) {
        const data = ratesDoc.data();
        setElectricityRates({
          serviceCharge: data.serviceCharge || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching electricity rates:", error);
    }
  };

  const verifyMeterNumber = async () => {
    if (!provider || !meterNumber || !meterType) return;
    setIsVerifying(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");

      const token = await currentUser.getIdToken(true);

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
        }
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
      toast({
        title: "Verification Error",
        description: "Unable to verify meter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getElectricityAmount = () => {
    return parseFloat(amount || 0);
  };

  const getServiceCharge = () => {
    const electricityAmount = getElectricityAmount();
    const serviceCharge = parseFloat(electricityRates.serviceCharge) || 0;
    return (electricityAmount * serviceCharge) / 100;
  };

  const getTotalAmount = () => {
    return getElectricityAmount() + getServiceCharge();
  };

  const isSubmitDisabled = () => {
    const electricityAmount = getElectricityAmount();
    const totalAmount = getTotalAmount();
    return (
      !isAuthenticated ||
      !provider ||
      !meterNumber ||
      !meterType ||
      !meterVerified ||
      !electricityAmount ||
      electricityAmount < 1000 ||
      electricityAmount > 100000 ||
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

    const electricityAmount = getElectricityAmount();
    const totalAmount = getTotalAmount();

    if (!electricityAmount || electricityAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount (₦1000–₦100,000).",
        variant: "destructive",
      });
      return;
    }

    if (electricityAmount < 1000 || electricityAmount > 100000) {
      toast({
        title: "Amount Out of Range",
        description: "Amount must be between ₦1000 and ₦100,000.",
        variant: "destructive",
      });
      return;
    }

    if (walletBalance < totalAmount) {
      setShowInsufficientModal(true);
      return;
    }

    if (!meterVerified) {
      toast({
        title: "Meter Not Verified",
        description: "Please verify your meter number before proceeding.",
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
      const ref = `ELEC_${currentUser.uid}_${Date.now()}`;

      const transactionPayload = {
        service: provider,
        meterNo: meterNumber,
        metertype: meterType,
        amount: electricityAmount,
        ref: ref,
      };

      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/electricity/purchase",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transactionPayload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Transaction failed");
      }

      if (result.success) {
        toast({
          title: "Success!",
          description: `₦${electricityAmount.toLocaleString()} electricity purchase successful!`,
        });

        // Reset form
        setProvider("");
        setMeterNumber("");
        setMeterType("");
        setAmount("");
        setMeterVerified(false);
        setCustomerDetails(null);

        fetchWalletBalance();
      } else {
        throw new Error(result.error || "Transaction failed");
      }
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

      {getTotalAmount() > walletBalance && getElectricityAmount() > 0 && (
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

      {meterVerified && customerDetails && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Meter Verified</AlertTitle>
          <AlertDescription>
            Meter details verified successfully. You can proceed with payment.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="provider">Electricity Provider *</Label>
          <Select value={provider} onValueChange={setProvider} required>
            <SelectTrigger id="provider">
              <SelectValue placeholder="Select provider" />
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
          <Label htmlFor="meterNumber">Meter/Account Number *</Label>
          <div className="flex gap-2">
            <Input
              id="meterNumber"
              value={meterNumber}
              onChange={(e) => {
                setMeterNumber(e.target.value);
                setMeterVerified(false);
                setCustomerDetails(null);
              }}
              placeholder="Enter meter or account number"
              required
            />
            <Button
              type="button"
              onClick={verifyMeterNumber}
              disabled={!provider || !meterNumber || !meterType || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : meterVerified ? (
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
            Your meter or account number. Verify before purchasing.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meterType">Meter Type *</Label>
          <Select value={meterType} onValueChange={setMeterType} required>
            <SelectTrigger id="meterType">
              <SelectValue placeholder="Select meter type" />
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

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₦) *</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="1000"
            max="100000"
            required
          />
          <p className="text-xs text-muted-foreground">
            Minimum: ₦1,000, Maximum: ₦100,000
          </p>
        </div>

        {getElectricityAmount() > 0 && (
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span>Electricity Amount:</span>
              <span className="font-medium">
                ₦{getElectricityAmount().toLocaleString()}
              </span>
            </div>
            {getServiceCharge() > 0 && (
              <div className="flex justify-between text-sm">
                <span>Service Charge ({electricityRates.serviceCharge}%):</span>
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
              ₦{getElectricityAmount().toLocaleString()} will be sent to your
              meter.{" "}
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
            "Purchase Electricity"
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
                <span className="font-medium">Electricity Amount:</span> ₦
                {getElectricityAmount().toLocaleString()}
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
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-4">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Pay Electricity Bills
        </h1>
        <p className="text-muted-foreground">
          Purchase electricity units instantly via VTU Africa. Fast, secure, and
          reliable.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <CardHeader className="px-0">
              <CardTitle>Electricity Bill Payment</CardTitle>
              <CardDescription>
                Select your provider and enter your meter details.
              </CardDescription>
            </CardHeader>
            <ElectricityForm user={user} router={router} />
          </div>

          <div className="bg-muted/50 p-8 md:p-12 flex flex-col justify-center">
            <div className="relative aspect-video mb-8 rounded-lg overflow-hidden bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <div className="text-center text-white">
                <Zap className="h-16 w-16 mx-auto mb-4 opacity-80" />
                <h3 className="text-xl font-semibold mb-2">Power Your Home</h3>
                <p className="text-sm opacity-90">
                  Pay bills for all major providers via VTU Africa
                </p>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-secondary-foreground">
              Supported Providers
            </h3>
            <p className="text-muted-foreground mb-4">
              Pay bills for Ikeja, Eko, Kano, Portharcourt, Jos, Ibadan, and
              more through our VTU Africa integration.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Instant meter crediting via VTU Africa</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Secure wallet integration</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Support for prepaid and postpaid meters</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Real-time transaction tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
