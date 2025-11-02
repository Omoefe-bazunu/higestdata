"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { firestore as db } from "@/lib/firebaseConfig";
import {
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
  collection,
  getDoc,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export default function WithdrawalModal({ open, onOpenChange }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // OTP
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Details
  const [amount, setAmount] = useState("");
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountResolved, setAccountResolved] = useState(false);

  const FEE = 50;
  const MIN = 100;
  const MAX = 5000000;

  useEffect(() => {
    if (!user || !open) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
      setWalletBalance(doc.data()?.walletBalance || 0);
    });
    return () => unsub();
  }, [user, open]);

  useEffect(() => {
    if (step === 2 && banks.length === 0) fetchBanks();
  }, [step]);

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/kora/banks");
      const data = await res.json();
      if (data.banks) setBanks(data.banks);
    } catch (err) {
      toast.error("Failed to load banks");
    }
  };

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

  const handleResolveAccount = async () => {
    if (!accountNumber || !selectedBank) return;
    setLoading(true);
    try {
      const res = await fetch("/api/kora/resolve-account", {
        method: "POST",
        body: JSON.stringify({ account: accountNumber, bank: selectedBank }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      console.log("Resolve response:", data); // Debug

      if (!res.ok) throw new Error(data.error || "Failed to verify account");

      setAccountName(data.account_name);
      setAccountResolved(true);
      toast.success("Account verified");
    } catch (err) {
      console.error("Resolution error:", err);
      toast.error(err.message || "Failed to verify account");
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateWithdrawal = async () => {
    const amt = parseFloat(amount);
    const total = amt + FEE;

    if (amt < MIN || amt > MAX) {
      toast.error(
        `Amount must be between ₦${MIN} and ₦${MAX.toLocaleString()}`
      );
      return;
    }

    if (total > walletBalance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!accountResolved) {
      toast.error("Please verify account first");
      return;
    }

    setLoading(true);
    const reference = `WDR_${user.uid}_${Date.now()}`;
    const bankName = banks.find((b) => b.code === selectedBank)?.name;

    try {
      console.log("Sending withdrawal request:", {
        reference,
        amount: amt,
        bank: selectedBank,
        account: accountNumber,
      });

      const res = await fetch("/api/kora/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: reference,
          amount: amt,
          currency: "NGN",
          destination: {
            type: "bank_account",
            narration: "Wallet withdrawal",
            bank_account: {
              bank: selectedBank,
              account: accountNumber,
            },
            customer: {
              name: accountName,
              email: user.email,
            },
          },
        }),
      });

      const data = await res.json();
      console.log("Withdrawal response:", data);

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Payout failed");
      }

      // Deduct from wallet
      await updateDoc(doc(db, "users", user.uid), {
        walletBalance: walletBalance - total,
      });

      // Save transaction
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        userId: user.uid,
        reference: reference,
        description: `Withdrawal to ${bankName}`,
        amount: -total, // Negative for debit
        fee: FEE,
        type: "debit",
        status: data.data?.status || "processing",
        date: new Date(),
        createdAt: new Date(),
        metadata: {
          bankName,
          accountNumber,
          accountName,
          koraReference: data.data?.reference,
          koraStatus: data.data?.status,
        },
      });

      toast.success("Withdrawal initiated! Processing...");
      resetAndClose();
    } catch (err) {
      console.error("Withdrawal error:", err);
      toast.error(err.message || "Failed to process withdrawal");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setOtp("");
    setOtpSent(false);
    setAmount("");
    setSelectedBank("");
    setAccountNumber("");
    setAccountName("");
    setAccountResolved(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            {step === 1 && "Verify with OTP"}
            {step === 2 && "Enter details"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: OTP */}
        {step === 1 && (
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

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Balance</p>
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
                min="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Fee: ₦{FEE} | Total: ₦
                {(parseFloat(amount || 0) + FEE).toFixed(2)}
              </p>
            </div>

            <div>
              <Label>Bank</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((b) => (
                    <SelectItem key={b.code} value={b.code}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Account Number</Label>
              <div className="flex gap-2">
                <Input
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    setAccountResolved(false);
                  }}
                  maxLength={10}
                  className="flex-1"
                />
                <Button
                  onClick={handleResolveAccount}
                  disabled={loading || !accountNumber || !selectedBank}
                >
                  {loading ? (
                    <Loader2 className="h-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            </div>

            {accountResolved && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800">{accountName}</p>
                <p className="text-sm text-green-700">{accountNumber}</p>
              </div>
            )}

            <Button
              onClick={handleInitiateWithdrawal}
              disabled={
                loading ||
                !accountResolved ||
                parseFloat(amount || 0) + FEE > walletBalance
              }
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm Withdrawal <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
