"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import Link from "next/link";
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
  Loader,
  AlertTriangle,
  Smartphone,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  ChevronLeft,
  Copy,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const NETWORKS = [
  {
    id: "mtn",
    name: "MTN",
    transferCode: "*600*recipient*amount*pin#",
    changePinCode: "*600*default*new*new#",
    color: "bg-yellow-400",
  },
  {
    id: "airtel",
    name: "Airtel",
    transferCode: "*432*1*amount*phone*pin#",
    changePinCode: "Call 111",
    color: "bg-red-600",
  },
  {
    id: "glo",
    name: "Glo",
    transferCode: "*131*recipient*amount*pin#",
    changePinCode: "*132*default*new*new#",
    maxAmount: 1000,
    color: "bg-green-600",
  },
  {
    id: "9mobile",
    name: "9mobile",
    transferCode: "*223*pin*amount*number#",
    changePinCode: "*247*default*new#",
    color: "bg-green-900",
  },
];

function AirtimeToCashForm({ user, router }) {
  const [network, setNetwork] = useState("");
  const [sender, setSender] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [serviceData, setServiceData] = useState(null);
  const [conversionRates, setConversionRates] = useState({});
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const { toast } = useToast();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      fetchConversionRates();
      const unsubscribe = fetchTransactionHistory();
      return () => unsubscribe && unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setShowInstructions(false);
            setCurrentTransaction(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const fetchConversionRates = async () => {
    try {
      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/airtime-cash/rates",
      );
      const result = await response.json();
      if (result.success) setConversionRates(result.data || {});
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTransactionHistory = () => {
    try {
      const transactionsRef = collection(
        firestore,
        "users",
        user.uid,
        "transactions",
      );
      return onSnapshot(transactionsRef, (snapshot) => {
        const transactions = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((txn) => txn.type === "airtime_cash")
          .sort(
            (a, b) =>
              (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0),
          );
        setTransactionHistory(transactions);
      });
    } catch (error) {
      console.error(error);
    }
  };

  const verifyServiceAvailability = async () => {
    if (!network) return;
    setIsVerifying(true);
    setServiceData(null);
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/airtime-cash/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ network }),
        },
      );
      const result = await response.json();
      if (result.success) {
        setServiceData(result.data);
        toast({
          title: "Service Verified",
          description: "You can now proceed with conversion.",
        });
      } else {
        toast({
          title: "Offline",
          description: result.error || "Service currently unavailable.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Verification failed",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getNetworkConfig = () => NETWORKS.find((n) => n.id === network);
  const getConversionRate = () => conversionRates[network]?.rate || 0.7;
  const getAmountToReceive = () =>
    (parseFloat(amount) || 0) * getConversionRate();
  const getServiceFee = () =>
    (parseFloat(amount) || 0) * (1 - getConversionRate());
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isSubmitDisabled = () => {
    const amt = parseFloat(amount) || 0;
    const max = getNetworkConfig()?.maxAmount || 10000;
    return (
      !isAuthenticated ||
      !network ||
      !sender ||
      !senderNumber ||
      amt < 100 ||
      amt > max ||
      !serviceData ||
      isSubmitting ||
      isVerifying
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken(true);
      const ref = `A2C_${auth.currentUser.uid}_${Date.now()}`;
      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/airtime-cash/convert",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            network,
            sender,
            sendernumber: senderNumber,
            amount: parseFloat(amount),
            ref,
            sitephone: serviceData.phoneNumber,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Conversion failed");
      if (result.success) {
        setCurrentTransaction({
          ...result.data,
          amount: parseFloat(amount),
          network: network.toUpperCase(),
          phoneNumber: serviceData.phoneNumber,
        });
        setShowInstructions(true);
        setTimeRemaining(30 * 60);
        toast({
          title: "Request Initialized",
          description: "Follow instructions to complete.",
        });
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

  const resetForm = () => {
    setNetwork("");
    setSender("");
    setSenderNumber("");
    setAmount("");
    setServiceData(null);
    setShowInstructions(false);
    setCurrentTransaction(null);
    setTimeRemaining(0);
  };

  return (
    <div className="grid md:grid-cols-5 gap-8">
      <div className="md:col-span-3 space-y-6">
        {!showInstructions ? (
          <Card className="border-none shadow-xl ring-1 ring-slate-200 overflow-hidden">
            <div className="bg-blue-950 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-orange-400" />
                <h3 className="font-bold">New Conversion</h3>
              </div>
              <Badge className="bg-orange-400 text-blue-950 hover:bg-orange-300">
                Instant Credit
              </Badge>
            </div>
            <CardContent className="p-6 space-y-6">
              <Alert className="bg-amber-50 border-amber-200 text-amber-900">
                <Info className="h-4 w-4 text-amber-700" />
                <AlertDescription className="text-xs font-medium leading-relaxed">
                  Only airtime transfers are accepted. <strong>Do not</strong>{" "}
                  buy a recharge card. Transfer within 30 mins of submission.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-blue-950 font-semibold">
                      Network
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={network}
                        onValueChange={(v) => {
                          setNetwork(v);
                          setServiceData(null);
                        }}
                      >
                        <SelectTrigger className="h-12 border-slate-200">
                          <SelectValue placeholder="Network" />
                        </SelectTrigger>
                        <SelectContent>
                          {NETWORKS.map((net) => (
                            <SelectItem key={net.id} value={net.id}>
                              {net.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={verifyServiceAvailability}
                        disabled={!network || isVerifying}
                        variant="outline"
                        className="h-12 px-4 border-blue-950 text-blue-950"
                      >
                        {isVerifying ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-blue-950 font-semibold">
                      Amount (₦)
                    </Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 1000"
                      className="h-12 border-slate-200"
                    />
                  </div>
                </div>

                {serviceData && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-bold text-green-700 uppercase tracking-tight">
                        System Ready
                      </span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">
                      Recipient: {serviceData.phoneNumber}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-blue-950 font-semibold">
                      Sender's Full Name
                    </Label>
                    <Input
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                      placeholder="Name on bank account"
                      className="h-12 border-slate-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-950 font-semibold">
                      Sending Phone Number
                    </Label>
                    <Input
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="The number having the airtime"
                      className="h-12 border-slate-200"
                      required
                    />
                  </div>
                </div>

                {amount && parseFloat(amount) >= 100 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 shadow-inner">
                    <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest">
                      <span>Conversion Rate</span>
                      <span className="text-blue-950">
                        {(getConversionRate() * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-red-500 font-bold uppercase tracking-widest">
                      <span>Service Charge</span>
                      <span>-₦{getServiceFee().toLocaleString()}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-blue-950 font-bold">
                        You Receive
                      </span>
                      <span className="text-2xl font-black text-green-600 tracking-tighter">
                        ₦{getAmountToReceive().toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-bold bg-blue-950 hover:bg-blue-900 shadow-lg shadow-blue-950/10 active:scale-[0.98] transition-all"
                  disabled={isSubmitDisabled()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="mr-2 h-5 w-5 animate-spin" />{" "}
                      Processing...
                    </>
                  ) : (
                    "Start Conversion"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-orange-400 p-6 text-blue-950 flex flex-col items-center text-center">
              <Clock className="h-10 w-10 mb-2 animate-pulse" />
              <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">
                Awaiting Transfer
              </h2>
              <p className="text-sm font-bold mt-1 opacity-80 uppercase tracking-widest">
                Expires in {formatTime(timeRemaining)}
              </p>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="bg-blue-950 rounded-2xl p-6 text-white text-center space-y-2 shadow-xl">
                <p className="text-blue-300 text-xs font-bold uppercase tracking-widest">
                  Transfer Exactly
                </p>
                <p className="text-5xl font-black text-orange-400">
                  ₦{currentTransaction?.amount}
                </p>
                <div className="pt-2">
                  <p className="text-blue-200 text-xs uppercase font-bold tracking-widest">
                    To Recipient
                  </p>
                  <p className="text-xl font-bold tracking-tight">
                    {currentTransaction?.phoneNumber}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-blue-950 font-bold flex items-center gap-2">
                  <Smartphone className="h-4 w-4" /> USSD Command
                </h4>
                <div className="p-4 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 relative group">
                  <code className="text-blue-950 font-mono text-sm break-all">
                    {getNetworkConfig()?.transferCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-950"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        getNetworkConfig()?.transferCode,
                      );
                      toast({ title: "Copied!" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-100 text-blue-900">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs leading-relaxed">
                  Your wallet will be credited with{" "}
                  <strong>
                    ₦{currentTransaction?.expectedCredit?.toLocaleString()}
                  </strong>{" "}
                  automatically once the network confirms the transfer.
                </AlertDescription>
              </Alert>

              <Button
                onClick={resetForm}
                variant="ghost"
                className="w-full text-slate-400 hover:text-red-600"
              >
                Cancel and Start New
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="md:col-span-2 space-y-6">
        <Card className="border-none shadow-md ring-1 ring-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-950">Live Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {NETWORKS.map((net) => {
              const rate = conversionRates[net.id];
              return (
                <div
                  key={net.id}
                  className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${net.color}`} />
                    <div>
                      <p className="font-bold text-blue-950 leading-none">
                        {net.name}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                        {rate?.charge || 30}% Fee
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                    {((rate?.rate || 0.7) * 100).toFixed(0)}% Value
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md ring-1 ring-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-950">History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {transactionHistory.length === 0 ? (
              <div className="text-center py-10 opacity-30 flex flex-col items-center">
                <Clock className="h-8 w-8 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">
                  No transactions yet
                </p>
              </div>
            ) : (
              transactionHistory.slice(0, 5).map((txn) => (
                <div
                  key={txn.id}
                  className="p-3 border-b border-slate-50 last:border-0 group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-blue-950 text-sm tracking-tight">
                      {txn.network?.toUpperCase()}
                    </p>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        txn.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : txn.status === "processing"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-[10px] text-slate-400 font-medium">
                      <p>{txn.createdAt?.toDate()?.toLocaleDateString()}</p>
                      <p>Ref: {txn.id.slice(-8)}</p>
                    </div>
                    <p className="text-sm font-black text-blue-950">
                      ₦{txn.amount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AirtimeToCashPage() {
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
              Airtime to <span className="text-orange-400">Cash</span>
            </h1>
            <p className="mt-1 text-slate-600">
              Convert excess airtime into real money in your wallet instantly.
            </p>
          </div>
        </div>

        <AirtimeToCashForm user={user} router={router} />
      </div>
    </div>
  );
}
