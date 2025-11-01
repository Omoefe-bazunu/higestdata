"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, PlusCircle, Trash2, X } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function GiftCardRatesTab() {
  const [rates, setRates] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [newCardName, setNewCardName] = useState("");
  const [newCurrency, setNewCurrency] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch currencies configuration
        const currenciesDoc = await getDoc(
          doc(firestore, "config", "currencies")
        );
        if (currenciesDoc.exists()) {
          const currenciesList =
            currenciesDoc.data().list || DEFAULT_CURRENCIES;
          setCurrencies(currenciesList);
        } else {
          // Initialize with default currencies if not exists
          setCurrencies(DEFAULT_CURRENCIES);
        }

        // Fetch gift card rates
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
    const currencyRates = {};
    currencies.forEach((c) => (currencyRates[c] = 0));
    setRates((prev) => [
      ...prev,
      { id, name: newCardName, currencies: currencyRates, min: 10, max: 1000 },
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

  const handleAddCurrency = () => {
    const trimmed = newCurrency.trim().toUpperCase();
    if (!trimmed) {
      toast({
        title: "Error",
        description: "Currency name required.",
        variant: "destructive",
      });
      return;
    }
    if (currencies.includes(trimmed)) {
      toast({
        title: "Duplicate",
        description: "Currency already exists.",
        variant: "destructive",
      });
      return;
    }

    // Add currency to list
    setCurrencies((prev) => [...prev, trimmed]);

    // Add currency with 0 rate to all existing cards
    setRates((prev) =>
      prev.map((card) => ({
        ...card,
        currencies: { ...card.currencies, [trimmed]: 0 },
      }))
    );

    setNewCurrency("");
    toast({
      title: "Currency Added",
      description: "Remember to save changes.",
    });
  };

  const handleRemoveCurrency = (currencyToRemove) => {
    if (currencies.length <= 1) {
      toast({
        title: "Error",
        description: "Must have at least one currency.",
        variant: "destructive",
      });
      return;
    }

    // Remove from currencies list
    setCurrencies((prev) => prev.filter((c) => c !== currencyToRemove));

    // Remove from all cards (but don't delete the data, just hide it)
    // This preserves data in case currency is re-added
    setRates((prev) =>
      prev.map((card) => {
        const updatedCurrencies = { ...card.currencies };
        delete updatedCurrencies[currencyToRemove];
        return {
          ...card,
          currencies: updatedCurrencies,
        };
      })
    );

    toast({
      title: "Currency Removed",
      description: "Remember to save changes.",
    });
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

      // Save currencies configuration separately first
      try {
        const currenciesRef = doc(firestore, "config", "currencies");
        await setDoc(currenciesRef, { list: currencies });
      } catch (err) {
        console.error("Error saving currencies:", err);
        toast({
          title: "Warning",
          description: "Failed to save currencies config.",
          variant: "destructive",
        });
      }

      // Save gift card rates in batch
      const batch = writeBatch(firestore);
      rates.forEach((card) => {
        const ref = doc(firestore, "giftCardRates", card.id);
        // Ensure all values are valid numbers
        const cleanCurrencies = {};
        Object.keys(card.currencies).forEach((curr) => {
          const val = parseFloat(card.currencies[curr]);
          cleanCurrencies[curr] = isNaN(val) ? 0 : val;
        });

        batch.set(ref, {
          name: card.name,
          currencies: cleanCurrencies,
          min: typeof card.min === "number" ? card.min : 10,
          max: typeof card.max === "number" ? card.max : 1000,
        });
      });

      await batch.commit();
      toast({ title: "Saved", description: "Rates and currencies updated." });
    } catch (err) {
      console.error("Save error:", err);
      toast({
        title: "Error",
        description: err.message || "Save failed.",
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
          <div className="flex justify-end">
            <Dialog
              open={showCurrencyDialog}
              onOpenChange={setShowCurrencyDialog}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Manage Currencies
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage Currencies</DialogTitle>
                  <DialogDescription>
                    Add or remove currencies. Changes apply to all gift cards.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="New currency (e.g., KRW)"
                      value={newCurrency}
                      onChange={(e) => setNewCurrency(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddCurrency();
                        }
                      }}
                    />
                    <Button onClick={handleAddCurrency}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {currencies.map((cur) => (
                        <div
                          key={cur}
                          className="flex items-center justify-between bg-secondary/50 rounded px-3 py-2"
                        >
                          <span className="font-medium text-sm">{cur}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveCurrency(cur)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

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
                  {currencies.map((cur) => (
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
