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
  Loader2,
  CheckCircle,
  XCircle,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Import Combobox Components
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function WithdrawalModal({ open, onOpenChange }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [result, setResult] = useState(null);

  // Bank State
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankOpen, setBankOpen] = useState(false); // Controls the combobox dropdown

  // Form State
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
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

  // Fetch Banks with Deduplication
  useEffect(() => {
    if (open && banks.length === 0) {
      setBanksLoading(true);
      fetch(`${API_URL}/api/banks`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const uniqueBanksMap = new Map();
            data.data.forEach((bank) => {
              if (!uniqueBanksMap.has(bank.code)) {
                uniqueBanksMap.set(bank.code, bank);
              }
            });
            const sorted = Array.from(uniqueBanksMap.values()).sort((a, b) =>
              a.name.localeCompare(b.name)
            );
            setBanks(sorted);
          }
        })
        .catch(() => toast.error("Failed to load bank list"))
        .finally(() => setBanksLoading(false));
    }
  }, [open, banks.length]);

  const handleResolveAccount = useCallback(async () => {
    if (accountNumber.length !== 10 || !bankCode) return;
    setLoading(true);
    setAccountName("");

    try {
      const res = await fetch(`${API_URL}/api/resolve-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankCode, accountNumber }),
      });
      const data = await res.json();

      if (data.success) {
        setAccountName(data.data.account_name);
        toast.success("Verified: " + data.data.account_name);
      } else {
        toast.error("Could not resolve account name");
      }
    } catch (err) {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  }, [accountNumber, bankCode]);

  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      const timer = setTimeout(handleResolveAccount, 1000);
      return () => clearTimeout(timer);
    }
  }, [accountNumber, bankCode, handleResolveAccount]);

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/withdrawal/send-otp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOtpSent(true);
        toast.success("OTP sent to email");
      } else {
        throw new Error("Failed to send OTP");
      }
    } catch (err) {
      toast.error(err.message);
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
      if (res.ok && data.success) {
        setStep(2);
      } else {
        toast.error(data.error || "Invalid OTP");
      }
    } catch (err) {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWithdrawal = async () => {
    const amt = parseFloat(amount);
    if (amt + FEE > walletBalance) return toast.error("Insufficient funds");

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
        setResult("success");
      } else {
        throw new Error(data.error || "Request failed");
      }
    } catch (err) {
      toast.error(err.message);
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

  // Helper to get selected bank name
  const selectedBankName = banks.find((b) => b.code === bankCode)?.name;

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            {step === 1 ? "Verify Identity" : "Enter Withdrawal Details"}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: OTP */}
        {step === 1 && !result && (
          <div className="space-y-4">
            {!otpSent ? (
              <Button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                Send Verification Code
              </Button>
            ) : (
              <div className="space-y-3">
                <Label>Enter OTP</Label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code"
                  className="text-center text-lg tracking-widest"
                />
                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: FORM */}
        {step === 2 && !result && (
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg flex justify-between">
              <span className="text-sm">Balance</span>
              <span className="font-bold">
                ₦{walletBalance.toLocaleString()}
              </span>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min: ₦${MIN}`}
              />
              <p className="text-xs text-muted-foreground">Fee: ₦{FEE}</p>
            </div>

            <div className="space-y-2 flex flex-col">
              <Label>Bank</Label>
              <Popover open={bankOpen} onOpenChange={setBankOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={bankOpen}
                    className="w-full justify-between"
                  >
                    {bankCode
                      ? selectedBankName
                      : banksLoading
                      ? "Loading Banks..."
                      : "Select bank..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search bank..." />
                    <CommandList>
                      <CommandEmpty>No bank found.</CommandEmpty>
                      <CommandGroup>
                        {banks.map((bank) => (
                          <CommandItem
                            key={`${bank.code}_${bank.name}`}
                            value={bank.name}
                            onSelect={() => {
                              setBankCode(bank.code);
                              setBankOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                bankCode === bank.code
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {bank.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.slice(0, 10))}
                maxLength={10}
              />
            </div>

            {accountName && (
              <div className="bg-green-50 p-2 rounded border border-green-200 text-green-700 text-sm text-center font-medium">
                {accountName}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSubmitWithdrawal}
              disabled={loading || !accountName || !amount}
            >
              {loading ? "Processing..." : "Confirm Withdrawal"}
            </Button>
          </div>
        )}

        {/* SUCCESS STATE */}
        {result === "success" && (
          <div className="text-center py-6 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-bold">Withdrawal Initiated</h3>
            <p className="text-muted-foreground">
              Your funds are being processed.
            </p>
            <Button onClick={resetAndClose} className="w-full">
              Close
            </Button>
          </div>
        )}

        {/* ERROR STATE */}
        {result === "error" && (
          <div className="text-center py-6 space-y-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h3 className="text-xl font-bold">Processing Failed</h3>
            <p className="text-muted-foreground">Please try again.</p>
            <Button
              onClick={() => setResult(null)}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
