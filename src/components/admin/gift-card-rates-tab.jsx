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
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firestore } from "@/lib/firebaseConfig";
import { Skeleton } from "@/components/ui/skeleton";

const CURRENCIES = [
  "USD",
  "GBP",
  "EUR",
  "EUR(Ger)",
  "EUR(Spain)",
  "EUR(Fin)",
  "Singapore",
  "CAD",
  "AUD",
  "CHF",
  "NZD",
  "BRL",
  "JPY",
  "TWD",
  "HKD",
  "MXN",
  "PLN",
  "DKK",
  "AED",
  "SAR",
  "NOK",
  "SEK",
  "ZAR",
  "INR",
];

export default function GiftCardRatesTab() {
  const [rates, setRates] = useState([]);
  const [newCardName, setNewCardName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(firestore, "giftCardRates"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || doc.id,
          currencies: doc.data().currencies || {},
          min: doc.data().min || 10,
          max: doc.data().max || 1000,
        }));
        setRates(data);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load rates.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const updateCurrencyRate = (cardId, currency, value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      toast({
        title: "Invalid",
        description: "Rate must be ≥ 0.",
        variant: "destructive",
      });
      return;
    }
    setRates((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? {
              ...card,
              currencies: { ...card.currencies, [currency]: num },
            }
          : card
      )
    );
  };

  const handleAddCard = () => {
    if (!newCardName.trim()) {
      toast({
        title: "Error",
        description: "Card name required.",
        variant: "destructive",
      });
      return;
    }
    const id = newCardName.toLowerCase().replace(/\s+/g, "-");
    if (rates.some((r) => r.id === id)) {
      toast({
        title: "Duplicate",
        description: "Card exists.",
        variant: "destructive",
      });
      return;
    }
    const currencies = {};
    CURRENCIES.forEach((c) => (currencies[c] = 0));
    setRates((prev) => [
      ...prev,
      { id, name: newCardName, currencies, min: 10, max: 1000 },
    ]);
    setNewCardName("");
    toast({ title: "Added", description: "Save to confirm." });
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(firestore, "giftCardRates", id));
      setRates((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Deleted" });
    } catch {
      toast({
        title: "Error",
        description: "Delete failed.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      toast({
        title: "Auth Error",
        description: "Login required.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSaving(true);
      const batch = writeBatch(firestore);
      rates.forEach((card) => {
        const ref = doc(firestore, "giftCardRates", card.id);
        batch.set(ref, {
          name: card.name,
          currencies: card.currencies,
          min: card.min,
          max: card.max,
        });
      });
      await batch.commit();
      toast({ title: "Saved", description: "Rates updated." });
    } catch {
      toast({
        title: "Error",
        description: "Save failed.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Gift Card Rates</CardTitle>
        <CardDescription>
          Set exchange rate per unit (NGN) for each currency.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            rates.map((card) => (
              <div key={card.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{card.name}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(card.id)}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {CURRENCIES.map((cur) => (
                    <div key={cur} className="flex flex-col gap-1">
                      <label className="text-xs font-medium">{cur}</label>
                      <Input
                        type="number"
                        value={card.currencies[cur] || 0}
                        onChange={(e) =>
                          updateCurrencyRate(card.id, cur, e.target.value)
                        }
                        className="h-8 text-sm"
                        min="0"
                        step="0.01"
                        disabled={saving}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="New card (e.g., Amazon)"
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              disabled={saving}
            />
            <Button variant="outline" onClick={handleAddCard} disabled={saving}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || loading}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
