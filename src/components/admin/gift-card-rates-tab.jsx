"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firestore } from "@/lib/firebaseConfig";
import { Skeleton } from "@/components/ui/skeleton";

export default function GiftCardRatesTab() {
  const [rates, setRates] = useState([]);
  const [newCardName, setNewCardName] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const adminEmails = process.env.NEXT_PUBLIC_ADMINEMAIL?.split(",") || [];

  // 🔹 Fetch gift card rates and exchange rate from Firestore
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch gift card rates
        const ratesSnapshot = await getDocs(
          collection(firestore, "giftCardRates")
        );
        const ratesData = ratesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRates(ratesData);

        // Fetch exchange rate
        const exchangeRateDoc = await getDoc(
          doc(firestore, "settings", "exchangeRate")
        );
        if (exchangeRateDoc.exists()) {
          setExchangeRate(exchangeRateDoc.data().rate.toString());
        } else {
          setExchangeRate("1600"); // Default value
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        toast({
          title: "Error",
          description: "Failed to load gift card rates or exchange rate.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  // 🔹 Update rate locally with validation
  const handleRateChange = (id, newRate) => {
    const parsedRate = parseInt(newRate);
    if (isNaN(parsedRate) || parsedRate < 0) {
      toast({
        title: "Invalid Rate",
        description: "Rate must be a non-negative number.",
        variant: "destructive",
      });
      return;
    }
    setRates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, rate: parsedRate } : r))
    );
  };

  // 🔹 Update exchange rate locally with validation
  const handleExchangeRateChange = (newRate) => {
    const parsedRate = parseFloat(newRate);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      toast({
        title: "Invalid Exchange Rate",
        description: "Exchange rate must be a positive number.",
        variant: "destructive",
      });
      return;
    }
    setExchangeRate(newRate);
  };

  // 🔹 Add a new card with duplicate ID check
  const handleAddNewCard = () => {
    if (!newCardName.trim()) {
      toast({
        title: "Invalid Input",
        description: "Card name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    const newId = newCardName.toLowerCase().replace(/\s+/g, "-");
    if (rates.some((r) => r.id === newId)) {
      toast({
        title: "Duplicate Card",
        description: "A card with this name already exists.",
        variant: "destructive",
      });
      return;
    }
    const newCard = {
      id: newId,
      name: newCardName,
      rate: 50,
      min: 10,
      max: 100,
    };
    setRates((prev) => [...prev, newCard]);
    setNewCardName("");
    toast({
      title: "Card Added",
      description: `${newCardName} added locally. Save to confirm.`,
    });
  };

  // 🔹 Remove card from Firestore and then update local state
  const handleRemoveCard = async (id) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to remove gift cards.",
        variant: "destructive",
      });
      return;
    }
    if (!adminEmails.includes(user.email)) {
      toast({
        title: "Permission Error",
        description: "You are not authorized to remove gift cards.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteDoc(doc(firestore, "giftCardRates", id));
      setRates((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Deleted", description: "Gift card removed." });
    } catch (err) {
      console.error("Error removing card:", err);
      toast({
        title: "Error",
        description: "Failed to remove gift card.",
        variant: "destructive",
      });
    }
  };

  // 🔹 Save all changes to Firestore using batch
  const handleSaveChanges = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to save changes.",
        variant: "destructive",
      });
      return;
    }
    if (!adminEmails.includes(user.email)) {
      toast({
        title: "Permission Error",
        description: "You are not authorized to save changes.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const batch = writeBatch(firestore);

      // Save gift card rates
      for (const card of rates) {
        const docRef = doc(firestore, "giftCardRates", card.id);
        batch.set(docRef, {
          name: card.name,
          rate: card.rate,
          min: card.min,
          max: card.max,
        });
      }

      // Save exchange rate
      const exchangeRateValue = parseFloat(exchangeRate);
      if (isNaN(exchangeRateValue) || exchangeRateValue <= 0) {
        throw new Error("Invalid exchange rate");
      }
      batch.set(doc(firestore, "settings", "exchangeRate"), {
        rate: exchangeRateValue,
        updatedAt: new Date().toISOString(),
      });

      await batch.commit();
      toast({
        title: "Changes Saved",
        description: "Gift card rates and exchange rate updated.",
      });
    } catch (err) {
      console.error("Error saving changes:", err);
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Gift Card Rate Settings</CardTitle>
        <CardDescription>
          Manage percentage rates for gift cards and USD-to-NGN exchange rate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exchangeRate">USD to NGN Exchange Rate</Label>
            <Input
              id="exchangeRate"
              type="number"
              value={exchangeRate}
              onChange={(e) => handleExchangeRateChange(e.target.value)}
              placeholder="e.g., 1600"
              min="0"
              step="0.01"
              disabled={loading || saving}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card Type</TableHead>
                <TableHead className="w-48">Rate (%)</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-6 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                : rates.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">{card.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={card.rate}
                          onChange={(e) =>
                            handleRateChange(card.id, e.target.value)
                          }
                          className="max-w-xs"
                          min="0"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCard(card.id)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="New card name (e.g., eBay)"
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              disabled={saving}
            />
            <Button
              variant="outline"
              onClick={handleAddNewCard}
              disabled={saving}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveChanges} disabled={saving || loading}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
