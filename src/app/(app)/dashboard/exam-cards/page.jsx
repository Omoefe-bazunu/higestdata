// USER: Buy Exam Cards - app/dashboard/exam-cards/page.jsx
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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

function ExamCardForm({ user, router }) {
  const [cardType, setCardType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [examCards, setExamCards] = useState({});
  const [purchasedCards, setPurchasedCards] = useState(null);
  const { toast } = useToast();

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      fetchExamCards();
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
    }
  };

  const fetchExamCards = async () => {
    try {
      const ratesDoc = await getDoc(
        doc(firestore, "settings", "examCardRates")
      );
      if (ratesDoc.exists()) {
        setExamCards(ratesDoc.data().rates || {});
      }
    } catch (error) {
      console.error("Error fetching exam cards:", error);
    }
  };

  const getSelectedCard = () => {
    return examCards[cardType] || null;
  };

  const getTotalAmount = () => {
    const card = getSelectedCard();
    const qty = parseInt(quantity) || 0;
    return card ? card.finalPrice * qty : 0;
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

      const response = await fetch("/api/exam-cards/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          cardTypeId: cardType,
          quantity: qty,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Transaction failed");
      }

      setPurchasedCards(result.data.cards);
      toast({
        title: "Purchase Successful",
        description: `${qty} exam card(s) purchased successfully`,
      });

      setCardType("");
      setQuantity("");
      fetchWalletBalance();
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
            Your wallet balance (₦{walletBalance.toLocaleString()}) is less than
            the required amount (₦{getTotalAmount().toLocaleString()}).
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="cardType">Exam Card Type *</Label>
          <Select value={cardType} onValueChange={setCardType} required>
            <SelectTrigger id="cardType" className="text-foreground">
              <SelectValue placeholder="Select exam card type" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(examCards).length > 0 ? (
                Object.keys(examCards).map((cardId) => (
                  <SelectItem key={cardId} value={cardId}>
                    {examCards[cardId].name} - ₦
                    {examCards[cardId].finalPrice.toLocaleString()}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  No exam cards available
                </div>
              )}
            </SelectContent>
          </Select>
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

        {getTotalAmount() > 0 && (
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span>Unit Price:</span>
              <span className="font-medium">
                ₦{(getSelectedCard()?.finalPrice || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quantity:</span>
              <span className="font-medium">{parseInt(quantity) || 0}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold text-lg">
                  ₦{getTotalAmount().toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={
            isSubmitting ||
            !isAuthenticated ||
            !cardType ||
            !quantity ||
            getTotalAmount() > walletBalance
          }
        >
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
              Your exam cards have been generated. Save these details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {purchasedCards?.map((card, index) => (
              <div key={index} className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Card #{index + 1}
                    </p>
                    <p className="font-mono font-bold text-lg">{card.pin}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Serial Number
                    </p>
                    <p className="font-mono font-medium">{card.serial_no}</p>
                  </div>
                </div>
              </div>
            ))}
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
              Your wallet balance is insufficient for this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Required Amount:</span> ₦
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
          Purchase WAEC, NECO, NABTEB exam scratch cards instantly.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <CardHeader className="px-0">
              <CardTitle>Exam Card Purchase</CardTitle>
              <CardDescription>
                Select card type and quantity to purchase.
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
                  Get your scratch cards instantly
                </p>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-secondary-foreground">
              Available Exam Cards
            </h3>
            <p className="text-muted-foreground mb-4">
              Purchase WAEC, NECO, and NABTEB scratch cards for checking exam
              results.
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
                <span>Instant delivery with PIN & Serial</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
