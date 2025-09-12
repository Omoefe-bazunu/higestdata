"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { useToast } from "@/hooks/use-toast";
import FraudCheckForm from "@/components/gift-cards/fraud-check-form";

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(null);
  const { toast } = useToast();

  // Fetch gift card rates and exchange rate
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch gift card rates
        const snapshot = await getDocs(collection(firestore, "giftCardRates"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGiftCards(data);

        // Fetch exchange rate
        const exchangeRateDoc = await getDoc(
          doc(firestore, "settings", "exchangeRate")
        );
        if (exchangeRateDoc.exists()) {
          console.log("Exchange rate:", exchangeRateDoc.data().rate);
          setExchangeRate(exchangeRateDoc.data().rate);
        } else {
          setExchangeRate(1600); // Fallback default
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        toast({
          title: "Error",
          description: "Failed to load gift card options or exchange rate.",
          variant: "destructive",
        });
      }
    }
    fetchData();
  }, [toast]);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline">Trade Gift Cards</h1>
        <p className="text-muted-foreground">
          Enter your gift card details below to get a payout to your wallet.
          Validation and processing take 15–30 minutes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gift Card Details</CardTitle>
          <CardDescription>
            All submissions are checked for validity within 15–30 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FraudCheckForm giftCards={giftCards} exchangeRate={exchangeRate} />
        </CardContent>
      </Card>

      <div className="bg-primary/10 hidden border-l-4 border-primary text-primary-foreground p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-600">
              Our AI-powered fraud detection system helps protect our community.
              Transactions that seem unusual may be flagged for a quick manual
              review to ensure everyone's safety.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
