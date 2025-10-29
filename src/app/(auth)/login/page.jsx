// app/(auth)/login/page.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Login user
      await login(emailOrPhone, password);

      toast({
        title: "✅ Login Successful",
        description: "Welcome back!",
      });
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      // Handle specific Firebase errors
      if (err.code === "auth/user-not-found") {
        setMessage("❌ No account found with this email or phone number.");
      } else if (err.code === "auth/wrong-password") {
        setMessage("❌ Incorrect password.");
      } else if (err.code === "auth/too-many-requests") {
        setMessage("❌ Too many failed attempts. Please try again later.");
      } else {
        setMessage(`❌ ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center mt-12">
      {/* Background Image */}
      <Image
        src="https://images.unsplash.com/photo-1556742400-b5f0e1a6bfcf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80"
        alt="Login Background"
        fill
        className="object-cover brightness-75 -z-10"
        priority
      />

      {/* Login Card */}
      <Card className="mx-auto w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-headline">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="emailOrPhone">Email or Phone Number</Label>
              <Input
                id="emailOrPhone"
                type="text"
                placeholder="your.email@example.com or +234 800 000 0000"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
              />
            </div>

            {/* Password with toggle */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm underline">
                  Forgot password?
                </Link>
              </div>
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
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {message && (
            <p className="mt-4 text-sm text-center text-red-500">{message}</p>
          )}

          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
