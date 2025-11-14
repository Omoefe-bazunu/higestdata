"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { firestore as db } from "@/lib/firebaseConfig";
import {
  doc,
  onSnapshot,
  addDoc,
  collection,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function WithdrawalModal({ open, onOpenChange }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [result, setResult] = useState(null); // 'success' | 'error' | null

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const FEE = 50;
  const MIN = 100;

  useEffect(() => {
    if (!user || !open) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
      setWalletBalance(doc.data()?.walletBalance || 0);
    });
    return () => unsub();
  }, [user, open]);

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const email = userDoc.data().email;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await updateDoc(doc(db, "users", user.uid), {
        verificationToken: otp,
        verificationTokenExpiry: new Date(
          Date.now() + 10 * 60 * 1000
        ).toISOString(),
      });

      await fetch("/api/withdrawal/send-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
        headers: { "Content-Type": "application/json" },
      });

      setOtpSent(true);
      toast.success("OTP sent");
    } catch (err) {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const { verificationToken, verificationTokenExpiry } = userDoc.data();

      if (new Date() > new Date(verificationTokenExpiry))
        throw new Error("OTP expired");
      if (verificationToken !== otp) throw new Error("Invalid OTP");

      toast.success("OTP verified");
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // handleSubmitWithdrawal — DO NOT deduct wallet
  const handleSubmitWithdrawal = async () => {
    const amt = parseFloat(amount);
    const total = amt + FEE;

    if (amt < MIN) {
      toast.error(`Minimum withdrawal is ₦${MIN}`);
      return;
    }

    if (total > walletBalance) {
      toast.error("Insufficient balance (including ₦50 fee)");
      return;
    }

    if (!accountNumber || !bankName || !accountName) {
      toast.error("Please fill all bank details");
      return;
    }

    setLoading(true);
    const reference = `WDR_${user.uid}_${Date.now()}`;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      // NO WALLET DEDUCTION HERE
      await addDoc(collection(db, "withdrawalRequests"), {
        userId: user.uid,
        userName: userData.name || userData.email,
        userEmail: userData.email,
        userPhone: userData.phoneNumber || "N/A",
        reference,
        amount: amt,
        fee: FEE,
        totalAmount: total,
        walletBalance: walletBalance, // Current balance (not deducted)
        bankName,
        accountNumber,
        accountName,
        status: "pending",
        createdAt: new Date(),
      });

      await addDoc(collection(db, "users", user.uid, "transactions"), {
        userId: user.uid,
        reference,
        description: `Withdrawal to ${bankName}`,
        amount: -total,
        fee: FEE,
        type: "debit",
        status: "pending",
        date: new Date().toLocaleDateString("en-GB"),
        createdAt: new Date(),
        metadata: { bankName, accountNumber, accountName },
      });

      await fetch("/api/withdrawal/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: userData.fullName || userData.email,
          userEmail: userData.email,
          amount: amt,
          bankName,
          accountNumber,
          accountName,
          reference,
        }),
      });

      setResult("success");
    } catch (err) {
      console.error("Withdrawal error:", err);
      setResult("error");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setOtp("");
    setOtpSent(false);
    setAmount("");
    setBankName("");
    setAccountNumber("");
    setAccountName("");
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            {step === 1 && "Verify with OTP"}
            {step === 2 && !result && "Enter withdrawal details"}
            {result === "success" && "Request Submitted"}
            {result === "error" && "Submission Failed"}
          </DialogDescription>
        </DialogHeader>

        {/* OTP Step */}
        {step === 1 && !result && (
          <div className="space-y-4">
            {!otpSent ? (
              <Button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="mr-2 animate-spin" />
                ) : (
                  "Send OTP"
                )}
              </Button>
            ) : (
              <>
                <Input
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSendOTP}
                    disabled={loading}
                  >
                    Resend
                  </Button>
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Withdrawal Form */}
        {step === 2 && !result && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-xl font-bold">
                ₦{walletBalance.toLocaleString()}
              </p>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={MIN}
                placeholder={`Min: ₦${MIN}`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Fee: ₦{FEE} | Total: ₦
                {(parseFloat(amount || 0) + FEE).toFixed(2)}
              </p>
            </div>

            <div>
              <Label>Bank Name</Label>
              <Input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Enter bank name"
              />
            </div>

            <div>
              <Label>Account Number</Label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                maxLength={10}
                placeholder="10-digit account number"
              />
            </div>

            <div>
              <Label>Account Name</Label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Account holder name"
              />
            </div>

            <Button
              onClick={handleSubmitWithdrawal}
              disabled={
                loading ||
                !amount ||
                !bankName ||
                !accountNumber ||
                !accountName ||
                parseFloat(amount || 0) + FEE > walletBalance
              }
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Request <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Success Modal */}
        {result === "success" && (
          <div className="flex flex-col items-center space-y-4 py-6">
            <CheckCircle className="h-16 w-16 text-green-600" />
            <div className="text-center">
              <p className="text-lg font-semibold">Request Submitted!</p>
              <p className="text-sm text-muted-foreground">
                Your withdrawal is being processed.
              </p>
            </div>
            <Button onClick={resetAndClose} className="w-full">
              Done
            </Button>
          </div>
        )}

        {/* Error Modal */}
        {result === "error" && (
          <div className="flex flex-col items-center space-y-4 py-6">
            <XCircle className="h-16 w-16 text-red-600" />
            <div className="text-center">
              <p className="text-lg font-semibold">Submission Failed</p>
              <p className="text-sm text-muted-foreground">
                Please try again later.
              </p>
            </div>
            <Button onClick={resetAndClose} className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
