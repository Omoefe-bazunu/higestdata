"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { firestore } from "@/lib/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

export default function WithdrawalModal({ open, onOpenChange }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: OTP, 2: Details, 3: Preview
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // OTP Step
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(null);

  // Details Step
  const [amount, setAmount] = useState("");
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountResolved, setAccountResolved] = useState(false);

  // Preview Step
  const [recipientCode, setRecipientCode] = useState("");

  const WITHDRAWAL_FEE = 50;

  // Fetch wallet balance
  useEffect(() => {
    if (!user || !open) return;

    const userRef = doc(firestore, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setWalletBalance(docSnap.data().walletBalance || 0);
      }
    });

    return () => unsubscribe();
  }, [user, open]);

  // Fetch banks
  useEffect(() => {
    if (step === 2 && banks.length === 0) {
      fetchBanks();
    }
  }, [step]);

  const fetchBanks = async () => {
    try {
      const response = await fetch("/api/withdrawal/banks");
      const data = await response.json();
      if (data.banks) {
        setBanks(data.banks);
      }
    } catch (error) {
      console.error("Failed to fetch banks:", error);
      toast.error("Failed to load banks");
    }
  };

  const handleSendOTP = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/withdrawal/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpSent(true);
      setOtpExpiry(new Date(data.expiresAt));
      toast.success("OTP sent to your email");
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!user || !otp) {
      toast.error("Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/withdrawal/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      toast.success("OTP verified successfully");
      setStep(2);
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAccount = async () => {
    if (!accountNumber || !selectedBank) {
      toast.error("Please enter account number and select bank");
      return;
    }

    setLoading(true);
    setAccountResolved(false);
    setAccountName("");

    try {
      const response = await fetch("/api/withdrawal/resolve-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber,
          bankCode: selectedBank,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resolve account");
      }

      setAccountName(data.accountName);
      setAccountResolved(true);
      toast.success("Account resolved successfully");
    } catch (error) {
      console.error("Resolve account error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPreview = async () => {
    const withdrawalAmount = parseFloat(amount);

    if (!withdrawalAmount || withdrawalAmount < 100) {
      toast.error("Minimum withdrawal is ₦100");
      return;
    }

    const totalAmount = withdrawalAmount + WITHDRAWAL_FEE;

    if (totalAmount > walletBalance) {
      toast.error("Insufficient wallet balance");
      return;
    }

    if (!accountResolved) {
      toast.error("Please resolve account first");
      return;
    }

    // Create transfer recipient
    setLoading(true);
    try {
      const response = await fetch("/api/withdrawal/create-recipient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName,
          accountNumber,
          bankCode: selectedBank,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create recipient");
      }

      setRecipientCode(data.recipientCode);
      setStep(3);
    } catch (error) {
      console.error("Create recipient error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWithdrawal = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const bankName =
        banks.find((b) => b.code === selectedBank)?.name || "Bank";

      const response = await fetch("/api/withdrawal/initiate-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          amount: parseFloat(amount),
          recipientCode,
          bankName,
          accountNumber,
          accountName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process withdrawal");
      }

      toast.success("Withdrawal initiated successfully!");
      resetModal();
      onOpenChange(false);
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setOtp("");
    setOtpSent(false);
    setAmount("");
    setSelectedBank("");
    setAccountNumber("");
    setAccountName("");
    setAccountResolved(false);
    setRecipientCode("");
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            {step === 1 && "Verify your identity with OTP"}
            {step === 2 && "Enter withdrawal details"}
            {step === 3 && "Review and confirm withdrawal"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: OTP Verification */}
        {step === 1 && (
          <div className="space-y-4">
            {!otpSent ? (
              <>
                <p className="text-sm text-muted-foreground">
                  We'll send a One-Time Password to your registered email
                  address for security verification.
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
                    "Send OTP"
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Check your email for the OTP code
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendOTP}
                    variant="outline"
                    disabled={loading}
                    className="flex-1"
                  >
                    Resend OTP
                  </Button>
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Withdrawal Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold">
                ₦{walletBalance.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="100"
                step="0.01"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Minimum: ₦100 | Fee: ₦{WITHDRAWAL_FEE}
              </p>
              {amount && (
                <p className="text-sm font-medium">
                  Total Deduction: ₦
                  {(parseFloat(amount) + WITHDRAWAL_FEE).toFixed(2)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank">Select Bank</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <div className="flex gap-2">
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    setAccountResolved(false);
                    setAccountName("");
                  }}
                  maxLength={10}
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={handleResolveAccount}
                  disabled={
                    loading ||
                    !accountNumber ||
                    !selectedBank ||
                    accountNumber.length !== 10
                  }
                  variant="outline"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            </div>

            {accountResolved && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">{accountName}</p>
                  <p className="text-sm text-green-700">{accountNumber}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleProceedToPreview}
              disabled={
                loading ||
                !amount ||
                !accountResolved ||
                parseFloat(amount) + WITHDRAWAL_FEE > walletBalance
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
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 3: Preview & Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-medium">
                  ₦{parseFloat(amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fee</span>
                <span className="font-medium">
                  ₦{WITHDRAWAL_FEE.toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-medium">Total Deduction</span>
                <span className="font-bold text-lg">
                  ₦{(parseFloat(amount) + WITHDRAWAL_FEE).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-medium">Recipient Details</h4>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Account Name:</span>{" "}
                  <span className="font-medium">{accountName}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Account Number:</span>{" "}
                  <span className="font-medium">{accountNumber}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Bank:</span>{" "}
                  <span className="font-medium">
                    {banks.find((b) => b.code === selectedBank)?.name}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirmWithdrawal}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Withdrawal"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
