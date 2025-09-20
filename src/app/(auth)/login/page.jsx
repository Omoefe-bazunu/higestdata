"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👈 state for visibility
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard"); // ✅ redirect
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setMessage("");
    try {
      await loginWithGoogle();
      router.push("/dashboard"); // ✅ redirect
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setMessage("⚠️ Enter your email first to reset password.");
      return;
    }
    try {
      await resetPassword(email);
      setMessage("📩 Password reset email sent.");
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <Card className="mx-auto max-w-sm mt-12">
      <CardHeader>
        <CardTitle className="text-2xl text-center font-headline">
          Login
        </CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
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

          {/* Password Field */}
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={handleResetPassword}
                className="ml-auto inline-block text-sm underline"
              >
                Forgot your password?
              </button>
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"} // 👈 toggle type
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
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <Image
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google logo"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            Login with Google
          </Button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-center text-muted-foreground">
            {message}
          </p>
        )}

        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
