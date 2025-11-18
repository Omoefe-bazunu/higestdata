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
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function FundingModal({ open, onOpenChange }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const hasVerified = useRef(false);

  // Load Kor KoraPay script ONCE when modal opens
  useEffect(() => {
    if (!open || scriptLoaded) return;

    const script = document.createElement("script");
    script.src =
      "https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js";
    script.async = true;
    script.onload = () => {
      console.log("Korapay script loaded");
      setScriptLoaded(true);
    };
    script.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to load payment gateway",
        variant: "destructive",
      });
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      setScriptLoaded(false);
    };
  }, [open, scriptLoaded]);

  const handleFund = async (e) => {
    e.preventDefault();
    if (!user)
      return toast({
        title: "Error",
        description: "Sign in first",
        variant: "destructive",
      });
    if (Number(amount) < 100)
      return toast({
        title: "Invalid",
        description: "Minimum ₦100",
        variant: "destructive",
      });

    if (!scriptLoaded || !window.Korapay) {
      return toast({
        title: "Error",
        description: "Payment gateway not ready",
        variant: "destructive",
      });
    }

    hasVerified.current = false;
    setLoading(true);

    try {
      const initRes = await fetch(`${API_URL}/api/kora/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const initData = await initRes.json();
      if (!initRes.ok)
        throw new Error(initData.error || "Failed to start payment");

      window.Korapay.initialize({
        key: initData.publicKey,
        reference: initData.reference,
        amount: initData.amount,
        currency: "NGN",
        customer: initData.customer,

        onSuccess: async () => {
          if (hasVerified.current) return;
          hasVerified.current = true;

          toast({ title: "Verifying payment...", description: "Please wait" });

          try {
            const verifyRes = await fetch(
              `${API_URL}/api/kora/verify-and-credit`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${await user.getIdToken()}`,
                },
                body: JSON.stringify({ reference: initData.reference }),
              }
            );

            const data = await verifyRes.json();

            if (verifyRes.ok) {
              toast({
                title: "Success!",
                description: `₦${
                  data.amount?.toLocaleString() || amount
                } added`,
              });
              onOpenChange(false);
              setAmount("");
            } else {
              toast({
                title: "Failed",
                description: data.error || "Verification failed",
                variant: "destructive",
              });
            }
          } catch (err) {
            toast({
              title: "Error",
              description: "Network error",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        },

        onFailed: () => {
          if (!hasVerified.current) setLoading(false);
          toast({
            title: "Payment Failed",
            description: "Try again",
            variant: "destructive",
          });
        },

        onClose: () => {
          if (!hasVerified.current) setLoading(false);
        },
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fund Wallet</DialogTitle>
          <DialogDescription>
            Add money instantly with KoraPay
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFund} className="space-y-4">
          <div className="space-y-2">
            <Label>Amount (₦)</Label>
            <Input
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !scriptLoaded || !amount}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening payment...
              </>
            ) : !scriptLoaded ? (
              "Loading payment gateway..."
            ) : (
              "Fund with KoraPay"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
