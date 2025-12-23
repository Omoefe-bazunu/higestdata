"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import { Loader2, ShieldCheck, Lock, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function FundingModal({ open, onOpenChange }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [bvn, setBvn] = useState("");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [email, setEmail] = useState(user?.email || "");
  const [copied, setCopied] = useState(false);

  // Ref to track if component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch VA on open
  useEffect(() => {
    if (open) {
      fetchVirtualAccount();
    }
  }, [open]);

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
        setShowForm(false);
      } else {
        setShowForm(true);
      }
    } catch (err) {
      toast.error("Failed to load account details");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!bvn || bvn.length !== 11) {
      toast.error("Please enter a valid 11-digit BVN");
      return;
    }
    if (!phone || !email) {
      toast.error("Phone and email are required");
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/virtual-account/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bvn, phoneNumber: phone, emailAddress: email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Account created! Refreshing...");
        fetchVirtualAccount(); // Reload to show VA
      } else {
        toast.error(data.error || "Creation failed");
      }
    } catch (err) {
      toast.error("Failed to create account");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(virtualAccount.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center">Fund Wallet</DialogTitle>
          <DialogDescription className="text-center">
            Transfer to your dedicated account. Funds auto-credit to wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : virtualAccount ? (
            <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
              <div className="space-y-1">
                <Label>Account Name</Label>
                <p className="font-medium">{virtualAccount.accountName}</p>
              </div>
              <div className="space-y-1">
                <Label>Account Number</Label>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-lg">
                    {virtualAccount.accountNumber}
                  </p>
                  <Button variant="ghost" size="sm" onClick={copyAccountNumber}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Bank</Label>
                <p>
                  {virtualAccount.bankName} ({virtualAccount.bankCode})
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Transfer any amount. Wallet updates automatically via webhook.
              </p>
            </div>
          ) : showForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>BVN (11 digits)</Label>
                <Input
                  type="text"
                  maxLength={11}
                  placeholder="12345678901"
                  value={bvn}
                  onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Generate Account
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Your details are secure and used only for KYC verification.
              </p>
            </div>
          ) : null}

          <div className="flex justify-center items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>Secured by Safe Haven MFB</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
