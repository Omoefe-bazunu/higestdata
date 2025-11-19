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
  const [scriptError, setScriptError] = useState(false);
  const hasVerified = useRef(false);
  const korapayInitialized = useRef(false);

  // Load Kor KoraPay script ONCE when modal opens
  useEffect(() => {
    if (!open || scriptLoaded || scriptError) return;

    console.log("Loading KoraPay script...");

    // Check if script is already loaded
    if (window.Korapay) {
      console.log("KoraPay already exists in window");
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js";
    script.async = true;

    script.onload = () => {
      console.log("Korapay script loaded successfully");
      if (window.Korapay) {
        setScriptLoaded(true);
        setScriptError(false);
        console.log("Korapay object available:", typeof window.Korapay);
      } else {
        console.error("Korapay object not found after script load");
        setScriptError(true);
      }
    };

    script.onerror = (error) => {
      console.error("Failed to load KoraPay script:", error);
      setScriptError(true);
      toast({
        title: "Error",
        description:
          "Failed to load payment gateway. Please refresh and try again.",
        variant: "destructive",
      });
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove the script on cleanup to avoid reloading
      // Just reset our state
      setScriptLoaded(false);
    };
  }, [open, scriptLoaded, scriptError]);

  const handleFund = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in first",
        variant: "destructive",
      });
      return;
    }

    if (Number(amount) < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is ₦100",
        variant: "destructive",
      });
      return;
    }

    // Check if script is loaded and available
    if (!scriptLoaded || !window.Korapay) {
      console.error("KoraPay not ready:", {
        scriptLoaded,
        korapayAvailable: !!window.Korapay,
        korapayType: typeof window.Korapay,
      });
      toast({
        title: "Payment Gateway Not Ready",
        description:
          "Please wait for payment gateway to load, or refresh the page.",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting payment process...");
    hasVerified.current = false;
    setLoading(true);

    try {
      // Get Firebase token
      const token = await user.getIdToken();
      console.log("Initializing payment with amount:", amount);

      // Initialize payment with backend
      const initRes = await fetch(`${API_URL}/api/kora/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const initData = await initRes.json();
      console.log("Backend response:", initData);

      if (!initRes.ok) {
        throw new Error(initData.error || "Failed to start payment");
      }

      if (!initData.publicKey || !initData.reference) {
        throw new Error("Invalid response from server");
      }

      console.log("Initializing KoraPay with:", {
        key: initData.publicKey,
        reference: initData.reference,
        amount: initData.amount,
      });

      // Initialize KoraPay payment
      window.Korapay.initialize({
        key: initData.publicKey,
        reference: initData.reference,
        amount: initData.amount,
        currency: "NGN",
        customer: initData.customer,
        channels: ["bank_transfer"],
        default_channel: "bank_transfer",

        onSuccess: async (data) => {
          console.log("KoraPay onSuccess called:", data);
          if (hasVerified.current) return;
          hasVerified.current = true;

          toast({
            title: "Payment Successful!",
            description: "Verifying your payment...",
          });

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

            const verifyData = await verifyRes.json();
            console.log("Verification response:", verifyData);

            if (verifyRes.ok) {
              toast({
                title: "Success!",
                description: `₦${
                  verifyData.amount?.toLocaleString() || amount
                } added to your wallet`,
              });
              onOpenChange(false);
              setAmount("");
            } else {
              console.error("Verification failed:", verifyData);
              toast({
                title: "Verification Failed",
                description: verifyData.error || "Please contact support",
                variant: "destructive",
              });
            }
          } catch (err) {
            console.error("Verification error:", err);
            toast({
              title: "Network Error",
              description: "Please check your internet connection",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        },

        onFailed: (data) => {
          console.log("KoraPay onFailed called:", data);
          if (!hasVerified.current) {
            setLoading(false);
            toast({
              title: "Payment Failed",
              description: "Your payment was not successful. Please try again.",
              variant: "destructive",
            });
          }
        },

        onClose: () => {
          console.log("KoraPay modal closed");
          if (!hasVerified.current) {
            setLoading(false);
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment process.",
            });
          }
        },
      });

      korapayInitialized.current = true;
      console.log("KoraPay initialized successfully");
    } catch (err) {
      console.error("Payment initialization error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to initialize payment",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setLoading(false);
      hasVerified.current = false;
      korapayInitialized.current = false;
    }
  }, [open]);

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
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Minimum amount: ₦100
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !scriptLoaded || !amount || scriptError}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {korapayInitialized.current
                  ? "Processing payment..."
                  : "Opening payment..."}
              </>
            ) : scriptError ? (
              "Payment Gateway Error - Refresh Page"
            ) : !scriptLoaded ? (
              "Loading payment gateway..."
            ) : (
              "Fund with KoraPay"
            )}
          </Button>

          {scriptError && (
            <p className="text-xs text-red-500 text-center">
              Having issues with payment gateway? Please refresh the page and
              try again.
            </p>
          )}

          {!scriptLoaded && !scriptError && (
            <p className="text-xs text-muted-foreground text-center">
              Loading secure payment gateway...
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
