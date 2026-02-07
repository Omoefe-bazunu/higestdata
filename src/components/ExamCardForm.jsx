"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  Loader,
  AlertTriangle,
  Wallet,
  GraduationCap,
  User,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Updated exam services to match VTU Africa API
const EXAM_SERVICES = [
  { id: "waec", name: "WAEC", description: "WAEC Examination" },
  { id: "neco", name: "NECO", description: "NECO Examination" },
  { id: "nabteb", name: "NABTEB", description: "NABTEB Examination" },
  { id: "jamb", name: "JAMB", description: "JAMB Examination" },
];

// Product codes based on VTU Africa documentation
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

      // Fixed transaction listener - only show toasts for NEW transactions
      const unsubscribe = onSnapshot(
        collection(firestore, "users", user.uid, "transactions"),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            // Only process NEW transactions, not existing ones
            if (change.type === "added") {
              const txn = change.doc.data();
              const txnId = change.doc.id;

              // Skip if we've already processed this transaction
              if (processedTransactions.current.has(txnId)) {
                return;
              }

              // Mark as processed
              processedTransactions.current.add(txnId);

              if (txn.type === "exam" && txn.status === "success") {
                // Don't show toast on initial load for existing transactions
                if (!isFirstLoad) {
                  toast({
                    title: "Exam Card Purchase Successful!",
                    description: `${txn.quantity} ${txn.service} card(s) purchased successfully.`,
                  });
                }
                fetchWalletBalance();
              }
            }
          });

          // After first load, mark that initial transactions are processed
          if (isFirstLoad) {
            // Add all existing transactions to processed set
            snapshot.docs.forEach((doc) => {
              processedTransactions.current.add(doc.id);
            });
            setIsFirstLoad(false);
          }
        },
      );

      return () => unsubscribe();
    }
  }, [user, toast, isFirstLoad]);

  // Fetch estimated price when service, product code, or quantity changes
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

  const fetchEstimatedPrice = async () => {
    setIsEstimating(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken(true);

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

      if (result.success) {
        setEstimatedPrice(result.data);
      } else {
        throw new Error(result.error || "Failed to estimate price");
      }
    } catch (error) {
      console.error("Price estimation error:", error);
      // Don't show toast for estimation errors to avoid spamming the user
      setEstimatedPrice(null);
    } finally {
      setIsEstimating(false);
    }
  };

  // Verify JAMB candidate
  const verifyJambCandidate = async () => {
    if (!profileCode || !productCode) {
      toast({
        title: "Missing Information",
        description:
          "Profile code and product code are required for JAMB verification",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken(true);

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
          title: "Verification Successful",
          description: `Candidate: ${result.data.candidateName}`,
        });
      } else {
        throw new Error(result.error || "Verification failed");
      }
    } catch (error) {
      console.error("JAMB verification error:", error);
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
      setCandidateName("");
    } finally {
      setIsVerifying(false);
    }
  };

  // Reset form when service changes
  useEffect(() => {
    setProductCode("");
    setProfileCode("");
    setCandidateName("");
    setEstimatedPrice(null);
  }, [service]);

  const getTotalAmount = () => {
    return estimatedPrice?.totalAmount || 0;
  };

  const isSubmitDisabled = () => {
    const qty = parseInt(quantity) || 0;
    const totalAmount = getTotalAmount();

    // For JAMB, require profile code verification
    if (service === "jamb" && !candidateName) {
      return true;
    }

    return (
      !isAuthenticated ||
      !service ||
      !productCode ||
      !qty ||
      qty < 1 ||
      qty > 100 ||
      walletBalance < totalAmount ||
      isSubmitting ||
      isEstimating
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
        service: service.toLowerCase(),
        product_code: productCode,
        quantity: qty.toString(),
        ref,
        webhookURL: "https://higestdata-proxy.onrender.com/webhook/vtu",
      };

      // Add optional parameters if provided
      if (profileCode) transactionPayload.profilecode = profileCode;
      if (sender) transactionPayload.sender = sender;
      if (phone) transactionPayload.phone = phone;

      console.log("Sending exam purchase request:", transactionPayload);

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

      if (!response.ok) {
        throw new Error(result.error || "Transaction failed");
      }

      if (result.success) {
        // Parse PINs from response
        let pins = [];
        if (result.data?.description?.pins) {
          // PINs might be in format: "PIN1<=>PIN2<=>PIN3"
          const pinString = result.data.description.pins;
          pins = pinString
            .split("<=")
            .map((pin) => pin.trim())
            .filter((pin) => pin);
        }

        setPurchasedCards({
          pins: pins,
          productName: result.data.description?.ProductName,
          quantity: result.data.description?.Quantity,
          amount:
            result.amountBreakdown?.totalAmount ||
            result.data.description?.Amount_Charged,
          breakdown: result.amountBreakdown,
        });

        toast({
          title: "Purchase Successful!",
          description: `${qty} ${service.toUpperCase()} exam card(s) purchased successfully.`,
        });

        // Reset form
        setService("");
        setProductCode("");
        setQuantity("1");
        setProfileCode("");
        setSender("");
        setPhone("");
        setCandidateName("");
        setEstimatedPrice(null);

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

  const currentProducts = PRODUCT_CODES[service] || [];

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
            Your wallet balance (₦{walletBalance.toLocaleString()}) is
            insufficient for this purchase.
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
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {service.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {service && (
          <div className="space-y-2">
            <Label htmlFor="productCode">Product Type *</Label>
            <Select value={productCode} onValueChange={setProductCode} required>
              <SelectTrigger id="productCode">
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent>
                {currentProducts.map((product) => (
                  <SelectItem key={product.code} value={product.code}>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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

        {/* JAMB Specific Fields */}
        {service === "jamb" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="profileCode">JAMB Profile Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="profileCode"
                  value={profileCode}
                  onChange={(e) => setProfileCode(e.target.value)}
                  placeholder="Enter JAMB profile code"
                  required
                />
                <Button
                  type="button"
                  onClick={verifyJambCandidate}
                  disabled={!profileCode || !productCode || isVerifying}
                  variant="outline"
                >
                  {isVerifying ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {candidateName && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-800 font-medium">
                    Verified Candidate: {candidateName}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender">Sender Email (Optional)</Label>
              <Input
                id="sender"
                type="email"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="Enter email to receive JAMB PIN"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number to receive JAMB PIN"
              />
            </div>
          </>
        )}

        {/* Other services optional profile code */}
        {service && service !== "jamb" && (
          <div className="space-y-2">
            <Label htmlFor="profileCode">Profile Code (Optional)</Label>
            <Input
              id="profileCode"
              value={profileCode}
              onChange={(e) => setProfileCode(e.target.value)}
              placeholder="Enter profile code if required"
            />
          </div>
        )}

        {/* Estimated Price Display */}
        {estimatedPrice && (
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span>Main Amount:</span>
              <span className="font-medium">
                ₦{estimatedPrice.mainAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Admin Fee ({estimatedPrice.profitPercentage}%):</span>
              <span className="font-medium">
                ₦{estimatedPrice.adminFee.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t pt-2">
              <span>Total Amount:</span>
              <span className="text-primary">
                ₦{estimatedPrice.totalAmount.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              This is the estimated amount that will be deducted from your
              wallet
            </p>
          </div>
        )}

        {isEstimating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader className="h-4 w-4 animate-spin" />
            Calculating estimated amount...
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
            <DialogTitle>Purchase Successful! 🎉</DialogTitle>
            <DialogDescription>
              Your {purchasedCards?.productName} has been generated
              successfully.
              {purchasedCards?.breakdown && (
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Main Amount:</span>
                    <span>
                      ₦{purchasedCards.breakdown.mainAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin Fee:</span>
                    <span>
                      ₦{purchasedCards.breakdown.adminFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total Deducted:</span>
                    <span>
                      ₦{purchasedCards.breakdown.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {purchasedCards?.pins && purchasedCards.pins.length > 0 ? (
              purchasedCards.pins.map((pin, index) => (
                <div key={index} className="bg-muted p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Card #{index + 1}
                      </p>
                      <p className="font-mono font-bold text-lg bg-background p-2 rounded border">
                        {pin}
                      </p>
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
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No PINs available in response.</p>
                <p className="text-sm">
                  Check your transaction history for details.
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setPurchasedCards(null)}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
            {purchasedCards?.pins && purchasedCards.pins.length > 0 && (
              <Button
                onClick={() => {
                  const allPins = purchasedCards.pins.join("\n");
                  navigator.clipboard.writeText(allPins);
                  toast({
                    title: "All PINs Copied!",
                    description: "All PINs copied to clipboard",
                  });
                }}
                className="flex-1"
              >
                Copy All PINs
              </Button>
            )}
          </div>
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
              Your wallet balance is insufficient for this transaction.
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
          Purchase WAEC, NECO, NABTEB, and JAMB exam cards instantly via VTU
          Africa.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <CardHeader className="px-0">
              <CardTitle>Exam Card Purchase</CardTitle>
              <CardDescription>
                Select service and product type to purchase exam cards. JAMB
                purchases require profile code verification.
              </CardDescription>
            </CardHeader>
            <ExamCardForm user={user} router={router} />
          </div>

          <div className="bg-muted/50 p-8 md:p-12 flex flex-col justify-center">
            <div
              className="relative aspect-video mb-8 rounded-lg overflow-hidden bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/exam.png')",
              }}
            ></div>

            <h3 className="text-xl font-semibold mb-4 text-secondary-foreground">
              Available Exam Cards
            </h3>
            <p className="text-muted-foreground mb-4">
              Purchase WAEC, NECO, NABTEB, and JAMB cards through.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <span className="font-medium">WAEC Cards</span>
                  <p className="text-xs text-muted-foreground">
                    Result Checking, GCE Registration, Verification
                  </p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <span className="font-medium">NECO Cards</span>
                  <p className="text-xs text-muted-foreground">
                    Result Checking, GCE Registration
                  </p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <span className="font-medium">NABTEB Cards</span>
                  <p className="text-xs text-muted-foreground">
                    Result Checking, GCE Registration
                  </p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <span className="font-medium">JAMB Cards</span>
                  <p className="text-xs text-muted-foreground">
                    UTME & Direct Entry Registration
                  </p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <span className="font-medium">Instant Delivery</span>
                  <p className="text-xs text-muted-foreground">
                    Real-time PIN generation and delivery
                  </p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <span className="font-medium">Transparent Pricing</span>
                  <p className="text-xs text-muted-foreground">
                    Clear breakdown of main amount and admin fee
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
