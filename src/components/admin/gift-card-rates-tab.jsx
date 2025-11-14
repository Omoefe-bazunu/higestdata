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

const DEFAULT_CURRENCIES = ["USD", "EUR", "GBP", "CAD"];

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
          setCurrencies(DEFAULT_CURRENCIES);
        }

        // Fetch gift card rates
        const snapshot = await getDocs(collection(firestore, "giftCardRates"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || doc.id,
          limits: doc.data().limits || [
            {
              id: `limit-${Date.now()}`,
              min: 10,
              max: 1000,
              currencies: {},
            },
          ],
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

  const updateLimitCurrencyRate = (cardId, limitId, currency, value) => {
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
              limits: card.limits.map((limit) =>
                limit.id === limitId
                  ? {
                      ...limit,
                      currencies: { ...limit.currencies, [currency]: num },
                    }
                  : limit
              ),
            }
          : card
      )
    );
  };

  const updateLimitRange = (cardId, limitId, field, value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;

    setRates((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? {
              ...card,
              limits: card.limits.map((limit) =>
                limit.id === limitId ? { ...limit, [field]: num } : limit
              ),
            }
          : card
      )
    );
  };

  const handleAddLimit = (cardId) => {
    const card = rates.find((r) => r.id === cardId);
    if (!card) return;

    const lastLimit = card.limits[card.limits.length - 1];
    const newMin = lastLimit ? lastLimit.max : 0;
    const newMax = newMin + 500;

    const currencyRates = {};
    currencies.forEach((c) => (currencyRates[c] = 0));

    setRates((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              limits: [
                ...c.limits,
                {
                  id: `limit-${Date.now()}`,
                  min: newMin,
                  max: newMax,
                  currencies: currencyRates,
                },
              ],
            }
          : c
      )
    );
    toast({ title: "Limit Added", description: "Remember to save changes." });
  };

  const handleRemoveLimit = (cardId, limitId) => {
    const card = rates.find((r) => r.id === cardId);
    if (!card || card.limits.length <= 1) {
      toast({
        title: "Error",
        description: "Must have at least one limit.",
        variant: "destructive",
      });
      return;
    }

    setRates((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              limits: c.limits.filter((l) => l.id !== limitId),
            }
          : c
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
      {
        id,
        name: newCardName,
        limits: [
          {
            id: `limit-${Date.now()}`,
            min: 10,
            max: 1000,
            currencies: currencyRates,
          },
        ],
      },
      ...prev,
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

    setCurrencies((prev) => [...prev, trimmed]);

    setRates((prev) =>
      prev.map((card) => ({
        ...card,
        limits: card.limits.map((limit) => ({
          ...limit,
          currencies: { ...limit.currencies, [trimmed]: 0 },
        })),
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

    setCurrencies((prev) => prev.filter((c) => c !== currencyToRemove));

    setRates((prev) =>
      prev.map((card) => ({
        ...card,
        limits: card.limits.map((limit) => {
          const updatedCurrencies = { ...limit.currencies };
          delete updatedCurrencies[currencyToRemove];
          return {
            ...limit,
            currencies: updatedCurrencies,
          };
        }),
      }))
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

      // Save currencies configuration
      const currenciesRef = doc(firestore, "config", "currencies");
      await setDoc(currenciesRef, { list: currencies });

      // Save gift card rates in batch
      const batch = writeBatch(firestore);
      rates.forEach((card) => {
        const ref = doc(firestore, "giftCardRates", card.id);

        const cleanLimits = card.limits.map((limit) => {
          const cleanCurrencies = {};
          Object.keys(limit.currencies).forEach((curr) => {
            const val = parseFloat(limit.currencies[curr]);
            cleanCurrencies[curr] = isNaN(val) ? 0 : val;
          });

          return {
            id: limit.id,
            min: typeof limit.min === "number" ? limit.min : 0,
            max: typeof limit.max === "number" ? limit.max : 1000,
            currencies: cleanCurrencies,
          };
        });

        batch.set(ref, {
          name: card.name,
          limits: cleanLimits,
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
          Set exchange rates per unit (NGN) for each currency and limit range.
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

          {/* Add Card Form - Moved to Top */}
          <div className="flex gap-2 p-4 border rounded-lg bg-secondary/20">
            <Input
              placeholder="New card name (e.g., Amazon)"
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              disabled={saving}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddCard();
                }
              }}
            />
            <Button variant="default" onClick={handleAddCard} disabled={saving}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {rates.map((card) => (
                <div key={card.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{card.name}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddLimit(card.id)}
                        disabled={saving}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Limit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(card.id)}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {card.limits.map((limit, idx) => (
                      <div
                        key={limit.id}
                        className="border rounded p-3 bg-secondary/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground">
                              Limit {idx + 1}:
                            </span>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={limit.min}
                                onChange={(e) =>
                                  updateLimitRange(
                                    card.id,
                                    limit.id,
                                    "min",
                                    e.target.value
                                  )
                                }
                                className="h-8 w-24 text-sm"
                                min="0"
                                disabled={saving}
                              />
                              <span className="text-sm">to</span>
                              <Input
                                type="number"
                                value={limit.max}
                                onChange={(e) =>
                                  updateLimitRange(
                                    card.id,
                                    limit.id,
                                    "max",
                                    e.target.value
                                  )
                                }
                                className="h-8 w-24 text-sm"
                                min="0"
                                disabled={saving}
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleRemoveLimit(card.id, limit.id)}
                            disabled={saving || card.limits.length <= 1}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                          {currencies.map((cur) => (
                            <div key={cur} className="flex flex-col gap-1">
                              <label className="text-xs font-medium">
                                {cur}
                              </label>
                              <Input
                                type="number"
                                value={limit.currencies[cur] || 0}
                                onChange={(e) =>
                                  updateLimitCurrencyRate(
                                    card.id,
                                    limit.id,
                                    cur,
                                    e.target.value
                                  )
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving || loading}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
