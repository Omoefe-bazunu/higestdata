"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { firestore } from "@/lib/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const { signup, loginWithGoogle, logout } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Generate 6-digit verification code
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // 1️⃣ Create user with Firebase Auth
      const userCredential = await signup(email, password);
      const user = userCredential.user;

      // 2️⃣ Generate verification token
      const verificationCode = generateVerificationCode();

      // 3️⃣ Create Firestore doc with verification data
      await setDoc(doc(firestore, "users", user.uid), {
        name: fullName,
        email: user.email.toLowerCase(),
        kyc: "pending",
        walletBalance: 0,
        isVerified: false,
        verificationToken: verificationCode,
        tokenCreatedAt: new Date(),
        createdAt: new Date().toISOString(),
      });

      // 4️⃣ Send verification email
      const emailResponse = await fetch("/api/email-verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          firstName: fullName.split(" ")[0], // Get first name
          verificationCode: verificationCode,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error("Failed to send verification email");
      }

      // 5️⃣ Log user out immediately
      await logout();

      // 6️⃣ Redirect to verification page with email
      router.push(`/verify-account?email=${encodeURIComponent(user.email)}`);
    } catch (err) {
      console.error("Signup error:", err);
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setMessage("");
    setLoading(true);

    try {
      const userCredential = await loginWithGoogle();
      const user = userCredential.user;

      // Generate verification code for Google users too
      const verificationCode = generateVerificationCode();

      await setDoc(
        doc(firestore, "users", user.uid),
        {
          name: user.displayName || "Unnamed User",
          email: user.email.toLowerCase(),
          kyc: "pending",
          walletBalance: 0,
          isVerified: false,
          verificationToken: verificationCode,
          tokenCreatedAt: new Date(),
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Send verification email
      const emailResponse = await fetch("/api/email-verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          firstName: user.displayName?.split(" ")[0] || "User",
          verificationCode: verificationCode,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error("Failed to send verification email");
      }

      // Log user out
      await logout();

      // Redirect to verification page
      router.push(`/verify-account?email=${encodeURIComponent(user.email)}`);
    } catch (err) {
      console.error("Google signup error:", err);
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100 mt-12">
      {/* Background Image */}
      <Image
        src="https://images.unsplash.com/photo-1556742400-b5f0e1a6bfcf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80"
        alt="Signup Background"
        fill
        className="object-cover brightness-75 -z-10"
        priority
      />

      {/* Signup Card */}
      <Card className="mx-auto w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-headline">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                placeholder="Omoefe Bazunu"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="raniem57@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password with toggle */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create an account"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <Image
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google logo"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              Sign up with Google
            </Button>
          </form>

          {message && (
            <p className="mt-4 text-sm text-center text-red-500">{message}</p>
          )}

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
