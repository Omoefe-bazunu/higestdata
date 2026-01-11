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
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function FundingModal({ open, onOpenChange }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Ref to track if component is mounted (to avoid state update errors)
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 1. Load Safe Haven Script dynamically
  useEffect(() => {
    if (open && !scriptLoaded) {
      const script = document.createElement("script");
      script.src = "https://checkout.safehavenmfb.com/assets/checkout.min.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    }
  }, [open, scriptLoaded]);

  const handlePayment = async () => {
    if (!amount || isNaN(amount) || amount < 100) {
      toast.error("Minimum amount is ₦100");
      return;
    }

    setLoading(true);

    try {
      // 1. Get Config from Backend
      const token = await user.getIdToken();
      const initRes = await fetch(`${API_URL}/api/funding/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const initData = await initRes.json();

      if (!initRes.ok)
        throw new Error(initData.error || "Initialization failed");

      const config = initData.config;

      // 2. Initialize Safe Haven Checkout
      if (typeof window.SafeHavenCheckout === "undefined") {
        throw new Error("Payment gateway failed to load. Please refresh.");
      }

      // === CRITICAL FIX FOR MOBILE ===
      // We MUST close our modal here. If we leave it open, it traps focus
      // and prevents the user from clicking buttons in the Checkout iframe.
      onOpenChange(false);
      setAmount(""); // Reset for next time

      window.SafeHavenCheckout({
        environment: config.environment,
        clientId: config.clientId,
        referenceCode: config.referenceCode,
        currency: config.currency,
        amount: config.amount,
        customer: config.customer,
        settlementAccount: config.settlementAccount,
        // Callbacks
        onClose: () => {
          // Modal is already closed, just notify user
          toast.info("Payment flow cancelled");
        },
        callback: (response) => {
          console.log("Checkout Callback:", response);
          // Run verification (Modal is closed, so we rely on Toasts)
          verifyTransaction(config.referenceCode, token);
        },
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message);
      if (isMounted.current) setLoading(false);
    }
  };

  // Helper to verify (Independent of Component State)
  const verifyTransaction = async (reference, token) => {
    try {
      toast.loading("Verifying payment...", { id: "verify-toast" });

      const res = await fetch(`${API_URL}/api/funding/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reference }),
      });

      const data = await res.json();

      if (data.success) {
        toast.dismiss("verify-toast");
        toast.success("Wallet credited successfully!");
      } else {
        toast.dismiss("verify-toast");
        toast.error(data.error || "Verification failed");
      }
    } catch (error) {
      toast.dismiss("verify-toast");
      toast.error(
        "Could not verify payment. Please refresh or contact support."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center">Fund Wallet</DialogTitle>
          <DialogDescription className="text-center">
            Enter amount to deposit via Bank Transfer or Card
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Amount (₦)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                ₦
              </span>
              <Input
                type="number"
                placeholder="1000"
                className="pl-8 text-lg"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              Min: ₦100
            </p>
          </div>

          <Button
            className="w-full h-12 text-base"
            onClick={handlePayment}
            disabled={loading || !scriptLoaded}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" /> Secure Checkout
              </>
            )}
          </Button>

          <div className="flex justify-center items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>Secured by Safe Haven MFB</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// "use client";

// import { useState, useEffect } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Loader2,
//   Copy,
//   CheckCircle2,
//   Banknote,
//   ShieldCheck,
//   AlertCircle,
// } from "lucide-react";
// import { toast } from "sonner";
// import { doc, getDoc } from "firebase/firestore";
// import { firestore as db } from "@/lib/firebaseConfig";

// const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// export default function FundingModal({ open, onOpenChange }) {
//   const { user } = useAuth();

//   // View States: 'loading' | 'create_bvn' | 'create_otp' | 'display'
//   const [viewState, setViewState] = useState("loading");
//   const [loading, setLoading] = useState(false);

//   // Form Data
//   const [bvn, setBvn] = useState("");
//   const [otp, setOtp] = useState("");
//   const [identityId, setIdentityId] = useState(null);

//   // Display Data
//   const [accountDetails, setAccountDetails] = useState(null);

//   // 1. Initial Load: Check User Status
//   useEffect(() => {
//     if (open && user) {
//       checkUserAccount();
//     }
//   }, [open, user]);

//   const checkUserAccount = async () => {
//     setViewState("loading");
//     try {
//       const userRef = doc(db, "users", user.uid);
//       const userSnap = await getDoc(userRef);

//       if (userSnap.exists()) {
//         const data = userSnap.data();
//         if (data.virtualAccount && data.virtualAccount.accountNumber) {
//           setAccountDetails(data.virtualAccount);
//           setViewState("display");
//         } else {
//           setViewState("create_bvn");
//         }
//       } else {
//         setViewState("create_bvn");
//       }
//     } catch (error) {
//       console.error("Error fetching user data:", error);
//       toast.error("Failed to load account status");
//       setViewState("create_bvn");
//     }
//   };

//   // 2. Step 1: Initiate Verification (Send OTP)
//   const handleInitiate = async () => {
//     if (bvn.length !== 11) {
//       toast.error("Please enter a valid 11-digit BVN");
//       return;
//     }

//     if (loading) return;

//     setLoading(true);
//     try {
//       const token = await user.getIdToken();
//       const response = await fetch(`${API_URL}/api/virtual-account/initiate`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ bvn }),
//       });

//       const data = await response.json();

//       if (response.ok && data.success) {
//         setIdentityId(data.identityId);

//         // SIMPLE FIX: Always go to OTP form first, even if otpVerified is true
//         // Let the user click "Confirm OTP" button themselves
//         setViewState("create_otp");
//         toast.success(data.message || "OTP sent to your BVN phone number");

//         // DON'T auto-call finalize - let user enter OTP and click button
//         // if (data.otpVerified) {
//         //   setOtp("AUTO_VERIFIED");
//         //   handleValidateAndCreate(); // REMOVE THIS LINE
//         // }
//       } else {
//         throw new Error(data.error || "Verification failed");
//       }
//     } catch (error) {
//       console.error("Init Error:", error);
//       toast.error(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleValidateAndCreate = async () => {
//     // REMOVE the auto-verified check - always require real OTP
//     if (!otp || otp.length < 4) {
//       toast.error("Please enter a valid OTP");
//       return;
//     }

//     if (loading) return;

//     setLoading(true);
//     try {
//       const token = await user.getIdToken();

//       const response = await fetch(`${API_URL}/api/virtual-account/finalize`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           identityId,
//           otp, // Always send the real OTP
//           bvn,
//         }),
//       });

//       const data = await response.json();

//       if (response.ok && data.success) {
//         setAccountDetails(data.account);
//         setViewState("display");
//         toast.success("Account created successfully!");
//       } else {
//         throw new Error(data.error || "Verification failed. Please try again.");
//       }
//     } catch (error) {
//       console.error("Finalize Error:", error);
//       toast.error(error.message);
//       setOtp(""); // Clear OTP for retry
//     } finally {
//       setLoading(false);
//     }
//   };
//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text);
//     toast.success("Copied to clipboard");
//   };

//   // === RENDER HELPERS ===

//   const renderLoading = () => (
//     <div className="flex flex-col items-center justify-center py-10 space-y-4">
//       <Loader2 className="h-10 w-10 animate-spin text-primary" />
//       <p className="text-sm text-muted-foreground">
//         Checking account status...
//       </p>
//     </div>
//   );

//   const renderBvnForm = () => (
//     <div className="space-y-4 py-2">
//       <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-xs flex gap-2">
//         <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
//         <p>
//           To generate your dedicated funding account, we need to verify your
//           identity. Please enter your BVN. An OTP will be sent to the linked
//           phone number.
//         </p>
//       </div>
//       <div className="space-y-2">
//         <Label>Bank Verification Number (BVN)</Label>
//         <Input
//           placeholder="12345678901"
//           value={bvn}
//           maxLength={11}
//           onChange={(e) =>
//             setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))
//           }
//         />
//       </div>
//       <Button
//         className="w-full"
//         onClick={handleInitiate}
//         disabled={loading || bvn.length !== 11}
//       >
//         {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
//         Verify & Create Account
//       </Button>
//       <p className="text-xs text-muted-foreground text-center">
//         Verification fee of ₦50 applies.
//       </p>
//     </div>
//   );

//   const renderOtpForm = () => (
//     <div className="space-y-4 py-2">
//       <div className="bg-green-50 text-green-700 p-3 rounded-md text-xs flex gap-2">
//         <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
//         <p>OTP sent! Please check the phone number linked to your BVN.</p>{" "}
//         <br />
//         <p className="text-orange-500 text-sm">
//           Re-enter the OTP and click the button again if it fails.
//         </p>
//       </div>
//       <div className="space-y-2">
//         <Label>Enter OTP</Label>
//         <Input
//           placeholder="Enter OTP"
//           value={otp}
//           onChange={(e) => setOtp(e.target.value)}
//         />
//       </div>
//       <Button
//         className="w-full"
//         onClick={handleValidateAndCreate}
//         disabled={loading}
//       >
//         {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
//         Confirm OTP
//       </Button>
//       <Button
//         variant="ghost"
//         size="sm"
//         className="w-full text-xs text-muted-foreground"
//         onClick={() => setViewState("create_bvn")}
//         disabled={loading}
//       >
//         Go Back
//       </Button>
//     </div>
//   );

//   const renderAccountDisplay = () => (
//     <div className="space-y-6 py-2">
//       <div className="bg-muted/30 border border-border rounded-lg p-6 text-center space-y-4">
//         <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
//           <Banknote className="h-6 w-6 text-primary" />
//         </div>
//         <div>
//           <h3 className="font-semibold text-lg text-foreground">
//             Dedicated Funding Account
//           </h3>
//           <p className="text-xs text-muted-foreground">
//             Transfer to this account to fund your wallet instantly.
//           </p>
//         </div>

//         <div className="space-y-3 pt-2">
//           {/* Bank Name */}
//           <div className="flex justify-between items-center bg-background p-3 rounded border">
//             <span className="text-sm text-muted-foreground">Bank Name</span>
//             <span className="font-medium text-sm">
//               {accountDetails?.bankName}
//             </span>
//           </div>

//           {/* Account Number */}
//           <div className="flex justify-between items-center bg-background p-3 rounded border">
//             <span className="text-sm text-muted-foreground">
//               Account Number
//             </span>
//             <div className="flex items-center gap-2">
//               <span className="font-mono font-bold text-lg text-primary">
//                 {accountDetails?.accountNumber}
//               </span>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="h-6 w-6"
//                 onClick={() => copyToClipboard(accountDetails?.accountNumber)}
//               >
//                 <Copy className="h-3 w-3" />
//               </Button>
//             </div>
//           </div>

//           {/* Account Name */}
//           <div className="flex justify-between items-center bg-background p-3 rounded border">
//             <span className="text-sm text-muted-foreground">Account Name</span>
//             <span className="font-medium text-xs text-right max-w-[160px] truncate">
//               {accountDetails?.accountName}
//             </span>
//           </div>
//         </div>
//       </div>

//       <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
//         <ShieldCheck className="h-4 w-4 text-green-600" />
//         <span>Automated funding secured by Safe Haven MFB</span>
//       </div>
//     </div>
//   );

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[400px]">
//         <DialogHeader>
//           <DialogTitle className="text-center">Fund Wallet</DialogTitle>
//           <DialogDescription className="text-center">
//             {viewState === "display"
//               ? "Bank Transfer Details"
//               : "Create your personal account"}
//           </DialogDescription>
//         </DialogHeader>

//         {viewState === "loading" && renderLoading()}
//         {viewState === "create_bvn" && renderBvnForm()}
//         {viewState === "create_otp" && renderOtpForm()}
//         {viewState === "display" && renderAccountDisplay()}
//       </DialogContent>
//     </Dialog>
//   );
// }
