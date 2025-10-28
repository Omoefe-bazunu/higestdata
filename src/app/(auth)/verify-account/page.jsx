// app/verify-account/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { firestore } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
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
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedCode = code.trim();

      const usersRef = collection(firestore, "users");
      const q = query(
        usersRef,
        where("email", "==", normalizedEmail),
        where("verificationToken", "==", trimmedCode)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast({
          variant: "destructive",
          title: "Invalid",
          description: "Wrong email or code.",
        });
        setLoading(false);
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      const tokenDate =
        userData.tokenCreatedAt?.toDate?.() ||
        new Date(userData.tokenCreatedAt);

      if (Date.now() - tokenDate.getTime() > 1000 * 60 * 30) {
        toast({
          variant: "destructive",
          title: "Expired",
          description: "Code expired. Resend new one.",
        });
        setLoading(false);
        return;
      }

      await updateDoc(doc(firestore, "users", userDoc.id), {
        isVerified: true,
        verificationToken: null,
        tokenCreatedAt: null,
      });

      toast({
        title: "Success",
        description: "Email verified! Redirecting...",
      });
      setTimeout(() => router.push("/login"), 1000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email)
      return toast({ variant: "destructive", title: "Enter email first" });

    setLoading(true);
    try {
      const res = await fetch("/api/email-verification/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      res.ok
        ? toast({ title: "Code resent" })
        : toast({
            variant: "destructive",
            title: "Failed",
            description: data.error,
          });
    } catch {
      toast({ variant: "destructive", title: "Network error" });
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
          <CardDescription>Enter your email and 6-digit code</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
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
                className="text-sm text-primary hover:underline"
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
