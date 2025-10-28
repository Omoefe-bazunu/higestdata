"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { firestore } from "@/lib/firebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function VerifyAccountPage() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please sign up first",
      });
      router.push("/signup");
      return;
    }

    setLoading(true);

    try {
      // Get user document
      const userRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();

      // Verify the code matches
      if (userData.verificationToken !== code.trim()) {
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: "The verification code is incorrect",
        });
        return;
      }

      // Check if token has expired (30 minutes)
      if (userData.tokenCreatedAt) {
        const tokenDate = userData.tokenCreatedAt.toDate();
        const thirtyMinutesInMs = 30 * 60 * 1000;
        const isExpired = Date.now() - tokenDate.getTime() > thirtyMinutesInMs;

        if (isExpired) {
          toast({
            variant: "destructive",
            title: "Code Expired",
            description: "Please request a new verification code",
          });
          return;
        }
      }

      // Update user document - mark as verified
      await updateDoc(userRef, {
        isVerified: true,
        verificationToken: null,
        tokenCreatedAt: null,
      });

      toast({
        title: "Success",
        description: "Email verified successfully!",
      });

      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Verification failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please sign up first",
      });
      return;
    }

    setLoading(true);
    try {
      // Get user data to retrieve name
      const userRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      const firstName = userData.name?.split(" ")[0] || "User";

      // Generate new verification code
      const newVerificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      // Update user document with new code
      await updateDoc(userRef, {
        verificationToken: newVerificationCode,
        tokenCreatedAt: new Date(),
      });

      // Send verification email using /send endpoint
      const res = await fetch("/api/email-verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          firstName: firstName,
          verificationCode: newVerificationCode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Code Resent",
          description: "A new verification code has been sent to your email",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed",
          description: data.error || "Failed to resend code",
        });
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to resend verification code",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">
            Verify Your Email
          </CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {user?.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                type="text"
                required
                placeholder="123456"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full"
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
