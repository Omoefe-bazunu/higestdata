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
import { Loader, AlertTriangle, Wallet, GraduationCap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Updated exam services to match VTU Africa
const EXAM_SERVICES = [
  { id: "waec", name: "WAEC Scratch Card" },
  { id: "neco", name: "NECO Token Card" },
  { id: "nabteb", name: "NABTEB Scratch Card" },
  { id: "waec-gce", name: "WAEC GCE" },
  { id: "neco-gce", name: "NECO GCE" },
];

function ExamCardForm({ user, router }) {
  const [service, setService] = useState("");
  const [productCode, setProductCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [profileCode, setProfileCode] = useState("");
  const [sender, setSender] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [examRates, setExamRates] = useState({});
  const [purchasedCards, setPurchasedCards] = useState(null);
  const { toast } = useToast();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchExamRates();

      // Listen for transaction updates
      const unsubscribe = onSnapshot(
        collection(firestore, "users", user.uid, "transactions"),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
              const txn = change.doc.data();
              if (txn.type === "exam" && txn.status === "success") {
                toast({
                  title: "Exam Card Purchase Successful!",
                  description: `${txn.quantity} ${txn.service} card(s) purchased successfully.`,
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

  const fetchExamRates = async () => {
    try {
      const ratesDoc = await getDoc(doc(firestore, "settings", "examRates"));
      if (ratesDoc.exists()) {
        setExamRates(ratesDoc.data() || {});
      }
    } catch (error) {
      console.error("Error fetching exam rates:", error);
    }
  };

  const getTotalAmount = () => {
    const qty = parseInt(quantity) || 0;
    const profitMargin = parseFloat(examRates.profitMargin) || 0;

    // For exam cards, we'll calculate the final amount after getting the VTU response
    // This is just an estimate for display
    return qty * 1000 * (1 + profitMargin / 100); // Base estimate
  };

  const isSubmitDisabled = () => {
    const totalAmount = getTotalAmount();
    const qty = parseInt(quantity) || 0;
    return (
      !isAuthenticated ||
      !service ||
      !productCode ||
      !qty ||
      qty < 1 ||
      qty > 100 ||
      walletBalance < totalAmount ||
      isSubmitting
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

    const qty = parseInt(quantity);
    if (!qty || qty < 1 || qty > 100) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a quantity between 1 and 100.",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = getTotalAmount();
    if (walletBalance < totalAmount) {
      setShowInsufficientModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const token = await currentUser.getIdToken(true);
      const ref = `EXAM_${currentUser.uid}_${Date.now()}`;

      const transactionPayload = {
        service,
        product_code: productCode,
        quantity: qty,
        ref,
        webhookURL: "https://higestdata-proxy.onrender.com/webhook/vtu",
      };

      // Add optional parameters if provided
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
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Transaction failed");
      }

      if (result.success) {
        // Show purchased cards if available
        if (result.data?.description?.pins) {
          setPurchasedCards(result.data.description.pins);
        }

        toast({
          title: "Purchase Successful!",
          description: `${qty} ${service.toUpperCase()} exam card(s) purchased successfully.`,
        });

        // Reset form
        setService("");
        setProductCode("");
        setQuantity("");
        setProfileCode("");
        setSender("");
        setPhone("");

        // Refresh wallet balance
        await fetchWalletBalance();
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

      {getTotalAmount() > walletBalance && getTotalAmount() > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Insufficient Balance</AlertTitle>
          <AlertDescription>
            Your wallet balance (₦{walletBalance.toLocaleString()}) may be
            insufficient for this purchase. The final amount will be calculated
            based on VTU Africa pricing.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="service">Exam Service *</Label>
          <Select value={service} onValueChange={setService} required>
            <SelectTrigger id="service">
              <SelectValue placeholder="Select exam service" />
            </SelectTrigger>
            <SelectContent>
              {EXAM_SERVICES.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="productCode">Product Code *</Label>
          <Input
            id="productCode"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            placeholder="Enter product code (e.g., waec-direct)"
            required
          />
          <p className="text-xs text-muted-foreground">
            Enter the specific product code for the exam card
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity (1-100) *</Label>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter quantity"
            min="1"
            max="100"
            required
          />
          <p className="text-xs text-muted-foreground">
            Maximum 100 cards per purchase
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profileCode">Profile Code (Optional)</Label>
          <Input
            id="profileCode"
            value={profileCode}
            onChange={(e) => setProfileCode(e.target.value)}
            placeholder="Enter profile code if required"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender">Sender Name (Optional)</Label>
          <Input
            id="sender"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="Enter sender name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
          />
        </div>

        {getTotalAmount() > 0 && (
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span>Estimated Amount:</span>
              <span className="font-medium">
                ₦{getTotalAmount().toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quantity:</span>
              <span className="font-medium">{parseInt(quantity) || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Final amount will be calculated by VTU Africa based on current
              rates
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
            "Purchase Exam Cards"
          )}
        </Button>
      </form>

      {/* Purchased Cards Display Dialog */}
      <Dialog
        open={!!purchasedCards}
        onOpenChange={() => setPurchasedCards(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase Successful</DialogTitle>
            <DialogDescription>
              Your exam cards have been generated. Save these PINs securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Array.isArray(purchasedCards) ? (
              purchasedCards.map((pin, index) => (
                <div key={index} className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Card #{index + 1}
                      </p>
                      <p className="font-mono font-bold text-lg">{pin}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(pin);
                        toast({
                          title: "Copied!",
                          description: "PIN copied to clipboard",
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No PINs available in response. Check your transaction history
                for details.
              </div>
            )}
          </div>
          <Button onClick={() => setPurchasedCards(null)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>

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
              Your wallet balance may be insufficient for this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Estimated Amount:</span> ₦
                {getTotalAmount().toLocaleString()}
              </p>
              <p className="text-sm">
                <span className="font-medium">Current Balance:</span> ₦
                {walletBalance.toLocaleString()}
              </p>
              <p className="text-sm text-red-600">
                <span className="font-medium">Potential Shortfall:</span> ₦
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
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-4">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Buy Exam Scratch Cards
        </h1>
        <p className="text-muted-foreground">
          Purchase WAEC, NECO, NABTEB exam scratch cards instantly via VTU
          Africa.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <CardHeader className="px-0">
              <CardTitle>Exam Card Purchase</CardTitle>
              <CardDescription>
                Select service and enter product details to purchase exam cards.
              </CardDescription>
            </CardHeader>
            <ExamCardForm user={user} router={router} />
          </div>

          <div className="bg-muted/50 p-8 md:p-12 flex flex-col justify-center">
            <div className="relative aspect-video mb-8 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-center text-white">
                <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-80" />
                <h3 className="text-xl font-semibold mb-2">
                  Exam Results Made Easy
                </h3>
                <p className="text-sm opacity-90">
                  Get your scratch cards instantly via VTU Africa
                </p>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-secondary-foreground">
              Available Exam Cards
            </h3>
            <p className="text-muted-foreground mb-4">
              Purchase WAEC, NECO, and NABTEB scratch cards through our VTU
              Africa integration.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>WAEC Scratch Cards</span>
              </li>
              <li className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>NECO Token Cards</span>
              </li>
              <li className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>NABTEB Scratch Cards</span>
              </li>
              <li className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>Instant PIN delivery</span>
              </li>
              <li className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>Real-time transaction tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
