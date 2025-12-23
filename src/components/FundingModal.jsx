"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  ArrowLeft,
  Smartphone,
  Mail,
  Key,
  User,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function FundingModal({ open, onOpenChange }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [step, setStep] = useState(1); // 1 = Enter details, 2 = Enter OTP
  const [bvn, setBvn] = useState("");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [email, setEmail] = useState(user?.email || "");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const isMounted = useRef(true);
  const timerRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Fetch VA on open
  useEffect(() => {
    if (open) {
      fetchVirtualAccount();
      // Reset state when modal opens
      setStep(1);
      setOtp("");
      setVerificationId(null);
      setCountdown(0);
    }
  }, [open]);

  // Countdown timer for OTP
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown]);

  const fetchVirtualAccount = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/virtual-account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setVirtualAccount(data.data);
      }
    } catch (err) {
      console.error("Failed to load account details:", err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const initiateVerification = async () => {
    // Validate inputs
    if (!bvn || bvn.length !== 11 || !/^\d+$/.test(bvn)) {
      toast.error("Please enter a valid 11-digit BVN");
      return;
    }

    // Validate phone (accepts: 080..., 23480..., +23480...)
    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.startsWith("0") && formattedPhone.length === 11) {
      formattedPhone = "234" + formattedPhone.slice(1);
    } else if (
      formattedPhone.startsWith("234") &&
      formattedPhone.length === 13
    ) {
      // Valid format
    } else {
      toast.error(
        "Please enter a valid Nigerian phone number (e.g., 08012345678)"
      );
      return;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${API_URL}/api/virtual-account/initiate-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bvn,
            phoneNumber: formattedPhone,
            emailAddress: email,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setVerificationId(data.data.verificationId);
        setStep(2);
        setCountdown(300); // 5 minutes countdown
        toast.success(
          "OTP sent to your phone! Please check and enter the code."
        );
      } else {
        toast.error(data.error || "Failed to initiate verification");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
      console.error("Initiate verification error:", err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) {
      toast.error(`Please wait ${countdown} seconds before resending`);
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/virtual-account/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verificationId,
          phoneNumber: phone,
          emailAddress: email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCountdown(300); // Reset 5 minutes countdown
        toast.success("New OTP sent successfully!");
      } else {
        toast.error(data.error || "Failed to resend OTP");
      }
    } catch (err) {
      toast.error("Failed to resend OTP");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const createVirtualAccount = async () => {
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsCreating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/virtual-account/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bvn,
          phoneNumber: phone,
          emailAddress: email,
          otp,
          verificationId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Virtual account created successfully!");
        setVirtualAccount(data.data);
        setStep(1); // Reset to step 1 for next time
        setOtp("");
        setVerificationId(null);
      } else {
        toast.error(data.error || "Failed to create virtual account");
        // If OTP is invalid, stay on step 2
        if (data.error?.includes("OTP") || data.error?.includes("otp")) {
          // Stay on step 2
        } else {
          setStep(1); // Go back to step 1 for other errors
        }
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      if (isMounted.current) setIsCreating(false);
    }
  };

  const copyAccountNumber = () => {
    if (virtualAccount?.accountNumber) {
      navigator.clipboard.writeText(virtualAccount.accountNumber);
      setCopied(true);
      toast.success("Account number copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleBack = () => {
    setStep(1);
    setOtp("");
    setVerificationId(null);
    setCountdown(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <CreditCard className="h-5 w-5" />
            Virtual Account
          </DialogTitle>
          <DialogDescription className="text-center">
            {virtualAccount
              ? "Your dedicated account for funding"
              : "Create a personal virtual account for instant deposits"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading && !virtualAccount && !isCreating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : virtualAccount ? (
            // SHOW VIRTUAL ACCOUNT DETAILS
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Account Name
                    </Label>
                    <p className="font-semibold text-lg">
                      {virtualAccount.accountName}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Account Number
                    </Label>
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <p className="font-mono text-xl font-bold tracking-wider">
                        {virtualAccount.accountNumber}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyAccountNumber}
                        className="h-8 w-8 p-0"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Bank Details
                    </Label>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="font-medium">{virtualAccount.bankName}</p>
                      <p className="text-sm text-muted-foreground">
                        Code: {virtualAccount.bankCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">How to use:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5">
                      <span className="text-xs font-bold">1</span>
                    </div>
                    <span>
                      Transfer any amount to this account from any bank
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5">
                      <span className="text-xs font-bold">2</span>
                    </div>
                    <span>Funds will auto-credit to your wallet instantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5">
                      <span className="text-xs font-bold">3</span>
                    </div>
                    <span>Use your wallet balance for all services</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : step === 1 ? (
            // STEP 1: ENTER DETAILS
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  BVN (11 digits)
                </Label>
                <Input
                  type="text"
                  maxLength={11}
                  placeholder="12345678901"
                  value={bvn}
                  onChange={(e) =>
                    setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Your BVN is required for KYC verification
                </p>
              </div>

              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  placeholder="08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  OTP will be sent to this number
                </p>
              </div>

              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800">
                      Security Notice
                    </p>
                    <p className="text-xs text-amber-700">
                      Your BVN and personal information are encrypted and used
                      only for verification purposes with Safe Haven MFB, our
                      licensed banking partner.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full h-12"
                onClick={initiateVerification}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Send OTP for Verification
              </Button>
            </div>
          ) : (
            // STEP 2: ENTER OTP
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Details
              </Button>

              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Key className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Enter OTP</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit OTP sent to {phone}
                </p>
              </div>

              <div className="space-y-2">
                <Label>6-digit OTP</Label>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="h-12 text-center text-2xl font-mono tracking-widest"
                />
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="link"
                  onClick={resendOtp}
                  disabled={countdown > 0}
                  className="p-0 h-auto"
                >
                  Resend OTP
                </Button>
                {countdown > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Resend in {formatCountdown(countdown)}
                  </span>
                )}
              </div>

              <Button
                className="w-full h-12"
                onClick={createVirtualAccount}
                disabled={isCreating || otp.length !== 6}
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Verify & Create Account
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-800">
                      Important
                    </p>
                    <p className="text-xs text-blue-700">
                      This OTP is valid for 5 minutes. After verification, your
                      virtual account will be created instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {virtualAccount && (
            <DialogFooter className="flex flex-col sm:flex-col gap-2">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground w-full">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>Secured by Safe Haven MFB (Licensed by CBN)</span>
              </div>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
