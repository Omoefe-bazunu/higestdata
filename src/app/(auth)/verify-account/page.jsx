"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
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
  const searchParams = useSearchParams();

  // Pre-fill email from URL parameter
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/email-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: code }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "✅ Verification Successful",
          description: "Your email has been verified. You can now log in.",
        });

        // Redirect to login after 1 second
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      } else {
        toast({
          variant: "destructive",
          title: "❌ Verification Failed",
          description: data.message || "Invalid code or email.",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address first.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/email-verification/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "✅ Code Resent",
          description: "A new verification code has been sent to your email.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to resend code. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to resend code. Please try again.",
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
            We've sent a 6-digit code to your email address. Please enter it
            below to verify your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!searchParams.get("email")} // Disable if pre-filled
                className="w-full"
              />
              {searchParams.get("email") && (
                <p className="text-xs text-muted-foreground">
                  This is the email you used to sign up
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                required
                placeholder="123456"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                className="w-full text-center text-2xl font-mono tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full"
            >
              {loading ? "Verifying..." : "Verify Account"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                className="text-sm text-primary hover:underline"
              >
                Didn't receive a code? Resend
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Code expires in 30 minutes. If you need help,{" "}
              <a href="/contact" className="text-primary hover:underline">
                contact support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
