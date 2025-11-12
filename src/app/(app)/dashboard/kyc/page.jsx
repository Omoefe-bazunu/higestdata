"use client";

// Importing required dependencies for React, Next.js, form handling, and UI components
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
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Defining the schema for KYC form validation using Zod
const kycFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  middleName: z.string().optional(),
  phone: z
    .string()
    .regex(
      /^(\+234|0)?[789]\d{9}$/,
      "Please enter a valid Nigerian phone number"
    ),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  bvn: z.string().regex(/^\d{11}$/, "BVN must be exactly 11 digits"),
  gender: z.enum(["M", "F"], {
    errorMap: () => ({ message: "Please select Male or Female" }),
  }),
});

// Function to initiate BVN verification by calling local API route
async function initiateBvnVerification(userId, data) {
  const response = await fetch("/api/bvn-verification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  if (!response.ok) {
    throw new Error(result.message || "BVN verification failed");
  }
  return result;
}

// Main KYC page component
export default function KycPage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
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

  // Fetch user data
  const fetchUserData = async (currentUser) => {
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);

        if (data.displayName) {
          const nameParts = data.displayName.split(" ");
          form.setValue("firstName", nameParts[0] || "");
          form.setValue("middleName", nameParts.length > 2 ? nameParts[1] : "");
          form.setValue("lastName", nameParts[nameParts.length - 1] || "");
        }
      } else {
        setUserData({ kycStatus: "pending" });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch user data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Effect to check auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Handle form submission
  // Update the onSubmit function in your KYC page component
  const onSubmit = async (data) => {
    if (!user || !user.email) return;

    setSubmitting(true);
    try {
      // Format phone for API call
      let formattedPhone = data.phone.replace(/[\s\-\(\)]/g, "");
      if (formattedPhone.startsWith("+234")) {
        formattedPhone = formattedPhone.substring(4);
      } else if (formattedPhone.startsWith("0")) {
        formattedPhone = formattedPhone.substring(1);
      }

      console.log("🚀 Submitting KYC with BVN:", data.bvn.slice(-4));

      // Call BVN verification API with all data for validation
      const response = await fetch("/api/bvn-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bvn: data.bvn,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          phone: formattedPhone,
          gender: data.gender,
        }),
      });

      const result = await response.json();
      console.log("📨 API Response:", result);

      if (response.ok && result.success) {
        console.log("✅ BVN verified and validated, updating Firestore...");

        // Mark user as approved in Firestore and initialize wallet
        await setDoc(
          doc(db, "users", user.uid),
          {
            kycStatus: "approved",
            displayName: data.middleName
              ? `${data.firstName} ${data.middleName} ${data.lastName}`
              : `${data.firstName} ${data.lastName}`,
            email: user.email,
            walletBalance: 0, // Initialize wallet with zero balance
            kycData: {
              firstName: data.firstName,
              lastName: data.lastName,
              middleName: data.middleName,
              phone: formattedPhone,
              dob: data.dob,
              gender: data.gender,
              bvn: data.bvn, // Store BVN securely
              verifiedAt: new Date().toISOString(),
            },
            // Store Dojah response data for reference
            bvnData: result.data,
            walletCreatedAt: new Date().toISOString(), // Track when wallet was created
          },
          { merge: true }
        );

        console.log("💰 Wallet initialized with balance: 0");

        await fetchUserData(user);

        toast({
          title: "KYC Verified ✅",
          description: "Your identity has been verified successfully!",
        });

        // Redirect to wallet
        setTimeout(() => {
          router.push("/wallet");
        }, 1000);
      } else {
        console.error("❌ Verification failed:", result.message);

        // Mark as rejected in Firestore
        await setDoc(
          doc(db, "users", user.uid),
          {
            kycStatus: "rejected",
            rejectionReason: result.message || "BVN verification failed",
            lastAttempt: new Date().toISOString(),
          },
          { merge: true }
        );

        await fetchUserData(user);

        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.errors
            ? result.errors.join(". ")
            : result.message ||
              "Unable to verify your BVN. Please check your details.",
        });
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

  // Helpers
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
        return "Your KYC has been approved and your wallet is ready to use.";
      case "rejected":
        return "Your KYC was rejected. Please review your information and submit again.";
      case "pending":
      default:
        return "Please complete your KYC verification to access wallet features.";
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

  const kycStatus = userData?.kycStatus || "pending";

  return (
    <div className="space-y-6">
      {/* KYC Status Card */}
      <Card className="my-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-headline font-semibold text-2xl">
                KYC Verification
              </CardTitle>
              <CardDescription>
                Complete your Know Your Customer verification to access wallet
                features
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
              kycStatus === "approved" ? "border-green-200 bg-green-50" : ""
            }
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{getStatusMessage(kycStatus)}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Conditional rendering */}
      {kycStatus === "approved" ? (
        <Card className="my-0">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">KYC Approved!</h3>
                <p className="text-muted-foreground">
                  Your identity has been verified and your wallet is ready to
                  use.
                </p>
              </div>
              <Button asChild className="mt-4">
                <Link href="/wallet">
                  <Wallet className="mr-2 h-4 w-4" />
                  Access Wallet
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="my-0">
          <CardHeader>
            <CardTitle>Complete KYC Verification</CardTitle>
            <CardDescription>
              {kycStatus === "rejected"
                ? "Please review and correct your information below"
                : "Provide your personal information to verify your identity"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* KYC Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
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
                  <Label htmlFor="lastName">Last Name</Label>
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
                {form.formState.errors.middleName && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.middleName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="e.g., +2348012345678 or 08012345678"
                  {...form.register("phone")}
                  disabled={submitting}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  {...form.register("dob")}
                  disabled={submitting}
                />
                {form.formState.errors.dob && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.dob.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
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
                <Label htmlFor="gender">Gender</Label>
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
                {form.formState.errors.gender && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.gender.message}
                  </p>
                )}
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
                    Processing KYC...
                  </>
                ) : (
                  <>
                    Submit KYC & Create Wallet
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="my-0">
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
            • <strong>Wallet Creation:</strong> A verified identity is required
            to create your secure wallet
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
