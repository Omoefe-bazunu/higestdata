"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function ExamRatesForm() {
  const [profitMargin, setProfitMargin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchRates();
        setAuthChecked(true);
      } else {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  const fetchRates = async () => {
    try {
      const ratesDoc = await getDoc(doc(firestore, "settings", "examRates"));
      if (ratesDoc.exists()) {
        const data = ratesDoc.data();
        setProfitMargin(data.profitMargin?.toString() || "");
      }
    } catch (error) {
      console.error("Error fetching exam rates:", error);
      toast({
        title: "Error",
        description: "Failed to load current rates.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const marginValue = parseFloat(profitMargin);
    if (isNaN(marginValue) || marginValue < 0) {
      setError("Please enter a valid profit margin percentage.");
      setIsSubmitting(false);
      return;
    }

    if (marginValue > 100) {
      setError("Profit margin percentage cannot exceed 100%.");
      setIsSubmitting(false);
      return;
    }

    try {
      await setDoc(doc(firestore, "settings", "examRates"), {
        profitMargin: marginValue,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Success",
        description: "Exam rates updated successfully.",
      });
    } catch (error) {
      console.error("Error updating exam rates:", error);
      toast({
        title: "Error",
        description: "Failed to update rates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-4">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Set Exam Card Rates
        </h1>
        <p className="text-muted-foreground">
          Configure the profit margin for exam card purchases.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Exam Card Profit Margin</CardTitle>
          <CardDescription>
            Set the profit margin percentage applied to exam card purchases.
            This margin will be added to the VTU Africa base price.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="profitMargin">Profit Margin Percentage *</Label>
              <Input
                id="profitMargin"
                type="number"
                value={profitMargin}
                onChange={(e) => setProfitMargin(e.target.value)}
                placeholder="Enter percentage (e.g., 10 for 10%)"
                step="0.1"
                min="0"
                max="100"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the profit margin percentage (0-100%). Example: 10 for 10%
                profit margin.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Example Calculation:</h4>
              <p className="text-sm">
                If VTU Africa charges ₦1,000 per card with {profitMargin || "0"}
                % profit margin:
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>VTU Base Price:</span>
                  <span>₦1,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Margin ({profitMargin || "0"}%):</span>
                  <span>
                    ₦
                    {(
                      (1000 * (parseFloat(profitMargin) || 0)) /
                      100
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Customer Pays:</span>
                  <span>
                    ₦
                    {(
                      1000 *
                      (1 + (parseFloat(profitMargin) || 0) / 100)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profit Margin"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
