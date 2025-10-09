"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Lightbulb, Loader } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { useToast } from "@/hooks/use-toast";
import FraudCheckForm from "@/components/gift-cards/fraud-check-form";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const { toast } = useToast();
  const router = useRouter();

  // ✅ Check authentication before rendering anything
  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((usr) => {
      if (usr) {
        setUser(usr);
        setAuthChecked(true);
      } else {
        router.replace("/login"); // redirect without flash
      }
    });
    return () => unsub();
  }, [router]);

  // Fetch gift card rates and exchange rate
  useEffect(() => {
    if (!authChecked || !user) return; // wait for auth before fetching

    async function fetchData() {
      try {
        // Fetch gift card rates from Firebase
        const snapshot = await getDocs(collection(firestore, "giftCardRates"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGiftCards(data);

        // Fetch live exchange rate from API route
        const exchangeResponse = await fetch("/api/exchangeRate");
        if (exchangeResponse.ok) {
          const exchangeData = await exchangeResponse.json();
          console.log("Live exchange rate:", exchangeData.rate);
          setExchangeRate(exchangeData.rate);
        } else {
          console.warn("Failed to fetch live exchange rate, using fallback");
          setExchangeRate(1600); // Fallback default
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setExchangeRate(1600); // Fallback on error
        toast({
          title: "Error",
          description: "Failed to load gift card options or exchange rate.",
          variant: "destructive",
        });
      }
    }
    fetchData();
  }, [authChecked, user, toast]);

  // ✅ Block rendering until auth check finishes
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
        <h1 className="text-3xl font-bold font-headline">Trade Gift Cards</h1>
        <p className="text-muted-foreground mt-2">
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
