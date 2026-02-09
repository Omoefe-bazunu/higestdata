"use client";

import { useState, useEffect, useRef } from "react";
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
  Wallet,
  GraduationCap,
  User,
  ChevronLeft,
  CreditCard,
  CheckCircle2,
  Copy,
  Zap,
  ArrowRight,
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
import { Separator } from "@/components/ui/separator";

const EXAM_SERVICES = [
  { id: "waec", name: "WAEC", description: "WAEC Examination" },
  { id: "neco", name: "NECO", description: "NECO Examination" },
  { id: "nabteb", name: "NABTEB", description: "NABTEB Examination" },
  { id: "jamb", name: "JAMB", description: "JAMB Examination" },
];

const PRODUCT_CODES = {
  waec: [
    {
      code: "1",
      name: "WAEC Result Checking PIN",
      description: "For checking WAEC results",
    },
    {
      code: "2",
      name: "WAEC GCE Registration PIN",
      description: "For WAEC GCE registration",
    },
    {
      code: "3",
      name: "WAEC Verification PIN",
      description: "For WAEC result verification",
    },
  ],
  neco: [
    {
      code: "1",
      name: "NECO Result Checking Token",
      description: "For checking NECO results",
    },
    {
      code: "2",
      name: "NECO GCE Registration PIN",
      description: "For NECO GCE registration",
    },
  ],
  nabteb: [
    {
      code: "1",
      name: "NABTEB Result Checking PIN",
      description: "For checking NABTEB results",
    },
    {
      code: "2",
      name: "NABTEB GCE Registration PIN",
      description: "For NABTEB GCE registration",
    },
  ],
  jamb: [
    {
      code: "1",
      name: "JAMB UTME Registration PIN",
      description: "For JAMB UTME registration",
    },
    {
      code: "2",
      name: "JAMB Direct Entry Registration PIN",
      description: "For JAMB Direct Entry",
    },
  ],
};

function ExamCardForm({ user, router }) {
  const [service, setService] = useState("");
  const [productCode, setProductCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [profileCode, setProfileCode] = useState("");
  const [sender, setSender] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [examRates, setExamRates] = useState({});
  const [purchasedCards, setPurchasedCards] = useState(null);
  const [candidateName, setCandidateName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const { toast } = useToast();
  const processedTransactions = useRef(new Set());
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchExamRates();
      const unsubscribe = onSnapshot(
        collection(firestore, "users", user.uid, "transactions"),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const txn = change.doc.data();
              const txnId = change.doc.id;
              if (processedTransactions.current.has(txnId)) return;
              processedTransactions.current.add(txnId);
              if (txn.type === "exam" && txn.status === "success") {
                if (!isFirstLoad) {
                  toast({
                    title: "Purchase Successful!",
                    description: `${txn.quantity} ${txn.service} card(s) purchased.`,
                  });
                }
                fetchWalletBalance();
              }
            }
          });
          if (isFirstLoad) {
            snapshot.docs.forEach((doc) =>
              processedTransactions.current.add(doc.id),
            );
            setIsFirstLoad(false);
          }
        },
      );
      return () => unsubscribe();
    }
  }, [user, toast, isFirstLoad]);

  useEffect(() => {
    if (service && productCode && quantity && parseInt(quantity) > 0) {
      fetchEstimatedPrice();
    } else {
      setEstimatedPrice(null);
    }
  }, [service, productCode, quantity]);

  const fetchWalletBalance = async () => {
    try {
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (userDoc.exists()) setWalletBalance(userDoc.data().walletBalance || 0);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchExamRates = async () => {
    try {
      const ratesDoc = await getDoc(doc(firestore, "settings", "examRates"));
      if (ratesDoc.exists()) setExamRates(ratesDoc.data() || {});
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEstimatedPrice = async () => {
    setIsEstimating(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/exam/estimate-price",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            service: service.toLowerCase(),
            product_code: productCode,
            quantity: parseInt(quantity),
          }),
        },
      );
      const result = await response.json();
      if (result.success) setEstimatedPrice(result.data);
    } catch (error) {
      setEstimatedPrice(null);
    } finally {
      setIsEstimating(false);
    }
  };

  const verifyJambCandidate = async () => {
    if (!profileCode || !productCode) return;
    setIsVerifying(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/exam/verify-jamb",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            profilecode: profileCode,
            product_code: productCode,
          }),
        },
      );
      const result = await response.json();
      if (result.success) {
        setCandidateName(result.data.candidateName);
        toast({
          title: "Verified",
          description: `Candidate: ${result.data.candidateName}`,
        });
      } else {
        throw new Error(result.error || "Verification failed");
      }
    } catch (error) {
      toast({
        title: "Failed",
        description: error.message,
        variant: "destructive",
      });
      setCandidateName("");
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    setProductCode("");
    setProfileCode("");
    setCandidateName("");
    setEstimatedPrice(null);
  }, [service]);

  const getTotalAmount = () => estimatedPrice?.totalAmount || 0;

  const isSubmitDisabled = () => {
    const qty = parseInt(quantity) || 0;
    if (service === "jamb" && !candidateName) return true;
    return (
      !isAuthenticated ||
      !service ||
      !productCode ||
      qty < 1 ||
      qty > 100 ||
      walletBalance < getTotalAmount() ||
      isSubmitting ||
      isEstimating
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalAmount = getTotalAmount();
    if (walletBalance < totalAmount) {
      setShowInsufficientModal(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken(true);
      const ref = `EXAM_${auth.currentUser.uid}_${Date.now()}`;
      const transactionPayload = {
        service: service.toLowerCase(),
        product_code: productCode,
        quantity: quantity.toString(),
        ref,
        webhookURL: "https://higestdata-proxy.onrender.com/webhook/vtu",
      };
      if (profileCode) transactionPayload.profilecode = profileCode;
      if (sender) transactionPayload.sender = sender;
      if (phone) transactionPayload.phone = phone;

      const response = await fetch(
        "https://higestdata-proxy.onrender.com/api/exam/purchase",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transactionPayload),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Transaction failed");
      if (result.success) {
        let pins = [];
        if (result.data?.description?.pins) {
          pins = result.data.description.pins
            .split("<=")
            .map((p) => p.trim())
            .filter((p) => p);
        }
        setPurchasedCards({
          pins,
          productName: result.data.description?.ProductName,
          quantity: result.data.description?.Quantity,
          amount: result.amountBreakdown?.totalAmount,
          breakdown: result.amountBreakdown,
        });
        toast({
          title: "Success!",
          description: "Cards purchased successfully.",
        });
        setService("");
        setProductCode("");
        setQuantity("1");
        setProfileCode("");
        setSender("");
        setPhone("");
        setCandidateName("");
        setEstimatedPrice(null);
        await fetchWalletBalance();
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

  const currentProducts = PRODUCT_CODES[service] || [];

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

      {getTotalAmount() > walletBalance && getTotalAmount() > 0 && (
        <Alert
          variant="destructive"
          className="mb-6 bg-red-50 border-red-200 text-red-800"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">Insufficient Balance</AlertTitle>
          <AlertDescription>
            Shortfall: ₦{(getTotalAmount() - walletBalance).toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-blue-950 font-semibold">Exam Body</Label>
            <Select value={service} onValueChange={setService} required>
              <SelectTrigger className="h-12 border-slate-200">
                <SelectValue placeholder="Select Body" />
              </SelectTrigger>
              <SelectContent>
                {EXAM_SERVICES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-blue-950 font-semibold">Product Type</Label>
            <Select
              value={productCode}
              onValueChange={setProductCode}
              required
              disabled={!service}
            >
              <SelectTrigger className="h-12 border-slate-200">
                <SelectValue placeholder="Select Product" />
              </SelectTrigger>
              <SelectContent>
                {currentProducts.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-blue-950 font-semibold">Quantity</Label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            max="100"
            className="h-12 border-slate-200"
            required
          />
        </div>

        {service === "jamb" && (
          <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="space-y-2">
              <Label className="text-blue-950 font-bold">
                JAMB Profile Code
              </Label>
              <div className="flex gap-2">
                <Input
                  value={profileCode}
                  onChange={(e) => setProfileCode(e.target.value)}
                  placeholder="Enter code"
                  className="h-12 flex-1 border-slate-200"
                  required
                />
                <Button
                  type="button"
                  onClick={verifyJambCandidate}
                  disabled={!profileCode || !productCode || isVerifying}
                  className="h-12 px-6 bg-blue-950"
                >
                  {isVerifying ? (
                    <Loader className="animate-spin h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {candidateName && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg border border-green-100 font-bold">
                  <CheckCircle2 className="h-4 w-4" /> {candidateName}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 uppercase font-bold tracking-tight">
                  Delivery Email
                </Label>
                <Input
                  type="email"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="Optional"
                  className="h-10 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 uppercase font-bold tracking-tight">
                  Delivery Phone
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                  className="h-10 border-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {service && service !== "jamb" && (
          <div className="space-y-2">
            <Label className="text-blue-950 font-semibold">
              Profile Code (Optional)
            </Label>
            <Input
              value={profileCode}
              onChange={(e) => setProfileCode(e.target.value)}
              placeholder="Enter code if required"
              className="h-12 border-slate-200"
            />
          </div>
        )}

        {estimatedPrice && (
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest">
              <span>Main Price</span>
              <span className="text-blue-950">
                ₦{estimatedPrice.mainAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest">
              <span>Service Fee</span>
              <span className="text-blue-950">
                ₦{estimatedPrice.adminFee.toLocaleString()}
              </span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between items-center">
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
            <>
              <Loader className="mr-2 h-5 w-5 animate-spin" /> Processing...
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span>Generate Cards</span>
              <ArrowRight className="h-5 w-5" />
            </div>
          )}
        </Button>
      </form>

      <Dialog
        open={!!purchasedCards}
        onOpenChange={() => setPurchasedCards(null)}
      >
        <DialogContent className="max-w-md border-none shadow-2xl">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-green-100 p-3 rounded-full mb-3">
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-blue-950 uppercase tracking-tighter leading-none">
              Purchase Successful
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-500">
              {purchasedCards?.productName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {purchasedCards?.pins?.map((pin, idx) => (
              <div key={idx} className="group relative">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 absolute -top-2 left-3 bg-white px-1 z-10">
                  PIN #{idx + 1}
                </Label>
                <div className="flex items-center gap-2 bg-slate-50 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-950 transition-colors">
                  <p className="flex-1 font-mono font-black text-blue-950 text-xl tracking-wider">
                    {pin}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(pin);
                      toast({ title: "Copied!" });
                    }}
                  >
                    <Copy className="h-4 w-4 text-slate-400 group-hover:text-blue-950" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPurchasedCards(null)}
            >
              Close
            </Button>
            {purchasedCards?.pins?.length > 1 && (
              <Button
                className="w-full bg-blue-950"
                onClick={() => {
                  navigator.clipboard.writeText(purchasedCards.pins.join("\n"));
                  toast({ title: "All PINs Copied!" });
                }}
              >
                Copy All PINs
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ExamCardsPage() {
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
              Exam <span className="text-orange-400">Cards</span>
            </h1>
            <p className="mt-1 text-slate-600">
              Get your result checkers and registration tokens instantly.
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
                  src="/exam.png"
                  alt="Exam Illustration"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                  <div className="bg-orange-400 p-1.5 rounded-full">
                    <Zap className="h-4 w-4 text-blue-950" />
                  </div>
                  <span className="text-white font-bold text-sm tracking-wide uppercase">
                    Educational Hub
                  </span>
                </div>
              </div>
              <div className="space-y-4 relative z-10">
                <h3 className="text-white text-xl font-bold">
                  Trusted by Thousands
                </h3>
                <div className="space-y-3">
                  {[
                    "Instant PIN generation after payment",
                    "Support for WAEC, NECO & JAMB",
                    "Secure transaction records in history",
                  ].map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-blue-100 text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-orange-400" />{" "}
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10 md:col-span-3 lg:col-span-1 bg-white">
              <ExamCardForm user={user} router={router} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
