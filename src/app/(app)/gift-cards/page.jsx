import FraudCheckForm from "@/components/gift-cards/fraud-check-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export default function GiftCardsPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline">Trade Gift Cards</h1>
        <p className="text-muted-foreground">
          Enter your gift card details below to get an instant payout to your wallet.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gift Card Details</CardTitle>
          <CardDescription>All submissions are checked for validity.</CardDescription>
        </CardHeader>
        <CardContent>
          <FraudCheckForm />
        </CardContent>
      </Card>

      <div className="bg-primary/10 border-l-4 border-primary text-primary-foreground p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div className="ml-3">
            <p className="text-sm">
              Our AI-powered fraud detection system helps protect our community. Transactions that seem unusual may be flagged for a quick manual review to ensure everyone's safety.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
