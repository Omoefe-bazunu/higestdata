"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Clock, Loader2, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Schema for KoraPay BVN verification
const kycFormSchema = z.object({
  bvn: z.string().regex(/^\d{11}$/, "BVN must be exactly 11 digits"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  middleName: z.string().optional(),
  phone: z.string().optional(),
  dob: z.string().optional(),
  gender: z
    .enum(["M", "F"], {
      errorMap: () => ({ message: "Please select Male or Female" }),
    })
    .optional(),
});

export default function KycPage() {
  const { user } = useAuth();
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Initialize form
  const form = useForm({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      phone: "",
      dob: "",
      bvn: "",
      gender: undefined,
    },
  });

  // Fetch KYC status from backend
  const fetchKycStatus = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/kyc/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setKycData(data.data);
      } else {
        console.error("Failed to fetch KYC status");
      }
    } catch (error) {
      console.error("Error fetching KYC status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchKycStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Handle form submission
  const onSubmit = async (data) => {
    if (!user) return;

    setSubmitting(true);
    try {
      const token = await user.getIdToken();

      console.log("🚀 Submitting KYC with BVN:", data.bvn.slice(-4));

      const response = await fetch(`${API_URL}/api/kyc/verify-bvn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bvn: data.bvn,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          phone: data.phone,
          dob: data.dob,
          gender: data.gender,
        }),
      });

      const result = await response.json();
      console.log("📨 API Response:", result);

      if (response.ok && result.success) {
        console.log("✅ KYC approved!");

        await fetchKycStatus();

        toast({
          title: "KYC Verified ✅",
          description: "Your identity has been verified successfully!",
        });
      } else {
        console.error("❌ KYC verification failed:", result.error);

        toast({
          variant: "destructive",
          title: "Verification Failed",
          description:
            result.error ||
            "Unable to verify your BVN. Please check your details.",
        });

        // Refresh KYC status to show rejection
        await fetchKycStatus();
      }
    } catch (error) {
      console.error("❌ Submission error:", error);

      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper functions
  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "pending":
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
      default:
        return "secondary";
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "approved":
        return "Your KYC has been approved successfully!";
      case "rejected":
        return (
          kycData?.rejectionReason ||
          "Your KYC was rejected. Please review your information and submit again."
        );
      case "pending":
      default:
        return "Please complete your KYC verification.";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const kycStatus = kycData?.kycStatus || "pending";

  return (
    <div className="space-y-6">
      {/* KYC Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-headline font-semibold text-2xl">
                KYC Verification
              </CardTitle>
              <CardDescription>
                Complete your Know Your Customer verification
              </CardDescription>
            </div>
            <Badge
              variant={getStatusVariant(kycStatus)}
              className="flex items-center gap-2"
            >
              {getStatusIcon(kycStatus)}
              {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert
            className={
              kycStatus === "approved"
                ? "border-green-200 bg-green-50"
                : kycStatus === "rejected"
                ? "border-red-200 bg-red-50"
                : "border-yellow-200 bg-yellow-50"
            }
          >
            {kycStatus === "rejected" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            <AlertDescription>{getStatusMessage(kycStatus)}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* KYC Form - Only show if not approved */}
      {kycStatus !== "approved" && (
        <Card>
          <CardHeader>
            <CardTitle>Complete KYC Verification</CardTitle>
            <CardDescription>
              {kycStatus === "rejected"
                ? "Please review and correct your information below"
                : "Provide your personal information to verify your identity"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    {...form.register("firstName")}
                    disabled={submitting}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    {...form.register("lastName")}
                    disabled={submitting}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name (Optional)</Label>
                <Input
                  id="middleName"
                  placeholder="Enter your middle name"
                  {...form.register("middleName")}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  placeholder="e.g., 08012345678"
                  {...form.register("phone")}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth (Optional)</Label>
                <Input
                  id="dob"
                  type="date"
                  {...form.register("dob")}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bvn">Bank Verification Number (BVN) *</Label>
                <Input
                  id="bvn"
                  placeholder="Enter your 11-digit BVN"
                  maxLength={11}
                  {...form.register("bvn")}
                  disabled={submitting}
                />
                {form.formState.errors.bvn && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.bvn.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Your BVN is used for identity verification and is kept secure.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender (Optional)</Label>
                <Select
                  onValueChange={(value) => form.setValue("gender", value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying BVN...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Verify KYC
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Why do we need this information?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            • <strong>Identity Verification:</strong> We verify your identity to
            comply with financial regulations
          </p>
          <p>
            • <strong>Security:</strong> KYC helps protect your account and
            prevent fraud
          </p>
          <p>
            • <strong>Compliance:</strong> We follow banking regulations to
            ensure safe transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
