"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { mockTransactionHistory, mockUserProfile } from "@/lib/data";
import { runFraudDetection } from "@/app/(app)/fraud-detection/actions";
import type { DetectFraudOutput } from "@/ai/flows/detect-fraud";

const formSchema = z.object({
  transactionAmount: z.coerce.number().positive({
    message: "Transaction amount must be a positive number.",
  }),
  userProfile: z.string().min(10, {
    message: "User profile must be at least 10 characters.",
  }),
  transactionHistory: z.string().min(10, {
    message: "Transaction history must be at least 10 characters.",
  }),
});

export function FraudDetectionForm() {
  const [result, setResult] = useState<DetectFraudOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transactionAmount: 5000,
      userProfile: mockUserProfile,
      transactionHistory: mockTransactionHistory,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await runFraudDetection(values);
      if (res) {
        setResult(res);
      } else {
        setError("Failed to get a response from the AI. Please try again.");
      }
    } catch (e) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            Enter the details of the transaction to analyze.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="transactionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 5000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Profile</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter user profile details..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transactionHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction History</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter transaction history..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide recent transaction data for context.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Analyze Transaction
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
            <CardDescription>The AI's fraud analysis will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {result && (
              <Alert variant={result.isFraudulent ? "destructive" : "default"} className={!result.isFraudulent ? 'border-accent text-accent-foreground' : ''}>
                {result.isFraudulent ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4 text-accent" />}
                <AlertTitle className={!result.isFraudulent ? "text-accent" : ""}>
                  {result.isFraudulent
                    ? "Fraudulent Transaction Detected"
                    : "Transaction Appears Legitimate"}
                </AlertTitle>
                <AlertDescription className="mt-2 prose prose-sm">
                  <p>{result.fraudExplanation}</p>
                </AlertDescription>
              </Alert>
            )}
            {!isLoading && !result && !error && (
                <p className="text-sm text-muted-foreground text-center py-10">
                    Submit a transaction to see the AI analysis.
                </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
