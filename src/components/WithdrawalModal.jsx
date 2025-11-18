"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { firestore as db } from "@/lib/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
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
import { Loader2, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Fallback banks list in case API fails
const FALLBACK_BANKS = [
  { code: "035", name: "Wema Bank" },
  { code: "058", name: "GTBank" },
  { code: "232", name: "Sterling Bank" },
  { code: "033", name: "United Bank for Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "076", name: "Polaris Bank" },
  { code: "214", name: "First City Monument Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "035A", name: "ALAT by Wema" },
];

export default function WithdrawalModal({ open, onOpenChange }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [result, setResult] = useState(null);
  const [banks, setBanks] = useState(FALLBACK_BANKS);
  const [banksLoading, setBanksLoading] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const FEE = 50;
  const MIN = 100;

  // Wallet balance listener
  useEffect(() => {
    if (!user || !open) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
      setWalletBalance(doc.data()?.walletBalance || 0);
    });

    return () => unsub();
  }, [user, open]);

  // Fetch banks through backend to avoid exposing API keys
  useEffect(() => {
    async function fetchBanks() {
      if (banks.length > FALLBACK_BANKS.length) return; // Don't refetch if we already have banks

      setBanksLoading(true);
      try {
        console.log("Fetching banks from:", `${API_URL}/api/banks`);
        const res = await fetch(`${API_URL}/api/banks`);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to fetch banks: ${res.status}`
          );
        }

        const data = await res.json();

        if (data.success && data.data && Array.isArray(data.data)) {
          setBanks(data.data);
          console.log("Banks fetched successfully:", data.data.length);
        } else {
          throw new Error(data.error || "Invalid banks data received");
        }
      } catch (err) {
        console.error("Failed to fetch banks from API:", err);
        console.log("Using fallback banks list");
        toast.error("Using cached banks list. Some features may be limited.");
      } finally {
        setBanksLoading(false);
      }
    }

    if (open) {
      fetchBanks();
    }
  }, [open, banks.length]);

  // Handle account resolution with useCallback to prevent recreation
  const handleResolveAccount = useCallback(async () => {
    if (accountNumber.length !== 10 || !bankCode) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/resolve-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankCode,
          accountNumber,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Account verification failed");
      }

      const data = await res.json();

      if (data.success && data.data) {
        setAccountName(data.data.account_name);
        toast.success("Account verified successfully");
      } else {
        throw new Error(data.error || "Account verification failed");
      }
    } catch (err) {
      console.error("Resolve account error:", err);
      toast.error(err.message || "Failed to verify account number");
      setAccountName("");
    } finally {
      setLoading(false);
    }
  }, [accountNumber, bankCode]);

  // Account resolution effect with stable dependencies
  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      const timeoutId = setTimeout(() => {
        handleResolveAccount();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [accountNumber, bankCode, handleResolveAccount]);

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/withdrawal/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to send OTP");
      }

      setOtpSent(true);
      toast.success("OTP sent to your email");
    } catch (err) {
      console.error("Send OTP error:", err);
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/withdrawal/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      toast.success("OTP verified successfully");
      setStep(2);
    } catch (err) {
      console.error("Verify OTP error:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

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

    if (!accountNumber || !bankCode || !accountName) {
      toast.error("Please fill all bank details");
      return;
    }

    if (accountNumber.length !== 10) {
      toast.error("Account number must be 10 digits");
      return;
    }

    setLoading(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/withdrawal/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amt,
          bankCode,
          accountNumber,
          accountName,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Withdrawal request submitted successfully");
        setResult("success");
      } else {
        throw new Error(data.error || "Withdrawal request failed");
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      toast.error(err.message || "Withdrawal failed. Please try again.");
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
    setBankCode("");
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
            {step === 1 && "Verify your identity with OTP"}
            {step === 2 && !result && "Enter your withdrawal details"}
            {result === "success" && "Withdrawal Processing"}
            {result === "error" && "Submission Failed"}
          </DialogDescription>
        </DialogHeader>

        {/* OTP Step */}
        {step === 1 && !result && (
          <div className="space-y-4">
            {!otpSent ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  For security, we'll send a verification code to your email.
                </p>
                <Button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter Verification Code</Label>
                  <Input
                    id="otp"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    maxLength={6}
                    className="text-center text-lg font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Check your email for the verification code
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="flex-1"
                  >
                    Resend Code
                  </Button>
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="flex-1"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Verify Code"
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

            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Withdraw</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={MIN}
                placeholder={`Minimum: ₦${MIN}`}
              />
              <p className="text-xs text-muted-foreground">
                Fee: ₦{FEE} | Total Deducted: ₦
                {(parseFloat(amount || 0) + FEE).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank">Bank</Label>
              <Select
                value={bankCode}
                onValueChange={setBankCode}
                disabled={banksLoading}
              >
                <SelectTrigger id="bank">
                  <SelectValue
                    placeholder={
                      banksLoading ? "Loading banks..." : "Select your bank"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {banksLoading && (
                <p className="text-xs text-muted-foreground">
                  Loading banks...
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(
                    e.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                maxLength={10}
                placeholder="10-digit account number"
                disabled={loading}
              />
            </div>

            {accountName && (
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-green-600">
                  ✓ Account verified successfully
                </p>
              </div>
            )}

            <Button
              onClick={handleSubmitWithdrawal}
              disabled={
                loading ||
                !amount ||
                !bankCode ||
                !accountNumber ||
                !accountName ||
                parseFloat(amount || 0) + FEE > walletBalance ||
                accountNumber.length !== 10
              }
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Withdrawal...
                </>
              ) : (
                <>
                  Confirm Withdrawal <ArrowRight className="ml-2 h-4 w-4" />
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
              <p className="text-lg font-semibold">Withdrawal Processing!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your withdrawal request has been submitted successfully. Funds
                will be transferred to your bank account shortly.
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
              <p className="text-lg font-semibold">Withdrawal Failed</p>
              <p className="text-sm text-muted-foreground mt-2">
                There was an issue processing your withdrawal. Please try again
                later.
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={resetAndClose}
                className="flex-1"
              >
                Close
              </Button>
              <Button onClick={() => setResult(null)} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
