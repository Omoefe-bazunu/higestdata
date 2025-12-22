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
import { PlusCircle, Trash2, X, Settings, Tag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
  getDoc,
  addDoc,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export default function GiftCardRatesTab() {
  // --- State ---
  const [rates, setRates] = useState({});
  const [cards, setCards] = useState([]);

  // Start with empty arrays - NO defaults
  const [currencies, setCurrencies] = useState([]);
  const [cardTypes, setCardTypes] = useState([]);
  const [globalLimits, setGlobalLimits] = useState([]);

  const [newCardName, setNewCardName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  // Config Dialog State
  const [tempCurrencies, setTempCurrencies] = useState([]);
  const [tempTypes, setTempTypes] = useState([]);
  const [tempLimits, setTempLimits] = useState([]);
  const [newCurrencyInput, setNewCurrencyInput] = useState("");
  const [newTypeInput, setNewTypeInput] = useState("");
  const [newLimitMin, setNewLimitMin] = useState("");
  const [newLimitMax, setNewLimitMax] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Configs
      const [currDoc, typeDoc, limitDoc] = await Promise.all([
        getDoc(doc(firestore, "config", "currencies")),
        getDoc(doc(firestore, "config", "card_types")),
        getDoc(doc(firestore, "config", "global_limits")),
      ]);

      // If document exists, use data. If not, use empty array.
      const loadedCurrencies = currDoc.exists()
        ? currDoc.data().list || []
        : [];
      const loadedTypes = typeDoc.exists() ? typeDoc.data().list || [] : [];
      const loadedLimits = limitDoc.exists() ? limitDoc.data().list || [] : [];

      setCurrencies(loadedCurrencies);
      setCardTypes(loadedTypes);
      setGlobalLimits(loadedLimits);

      // Initialize Temp State for the modal
      setTempCurrencies(loadedCurrencies);
      setTempTypes(loadedTypes);
      setTempLimits(loadedLimits);

      // 2. Fetch Cards
      const snapshot = await getDocs(collection(firestore, "giftCardRates"));

      const cardList = [];
      const nestedRates = {};

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const cardId = docSnap.id;

        cardList.push({ id: cardId, name: data.name || cardId });

        // Initialize nested structure
        nestedRates[cardId] = {};

        // Parse rates if they exist
        if (Array.isArray(data.rates)) {
          data.rates.forEach((r) => {
            // Match rate to a global limit by Value (Min/Max), not ID
            const matchingLimit = loadedLimits.find(
              (l) => l.min === r.min && l.max === r.max
            );

            if (matchingLimit) {
              const lid = matchingLimit.id;
              if (!nestedRates[cardId][lid]) nestedRates[cardId][lid] = {};
              if (!nestedRates[cardId][lid][r.cardType])
                nestedRates[cardId][lid][r.cardType] = {};

              nestedRates[cardId][lid][r.cardType][r.currency] = {
                rate: r.rate,
                tag: r.rateTag || "",
              };
            }
          });
        }
      });

      setCards(cardList);
      setRates(nestedRates);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Configuration Logic ---
  const addConfigItem = (list, setList, item) => {
    if (!item || list.includes(item)) return;
    setList([...list, item]);
  };

  const removeConfigItem = (list, setList, item) => {
    setList(list.filter((i) => i !== item));
  };

  const addLimit = () => {
    const min = parseFloat(newLimitMin);
    const max = parseFloat(newLimitMax);
    if (isNaN(min) || isNaN(max) || min >= max) {
      toast({
        title: "Invalid Range",
        description: "Min must be less than Max",
        variant: "destructive",
      });
      return;
    }
    const newLimit = { id: `limit_${Date.now()}`, min, max };
    setTempLimits([...tempLimits, newLimit]);
    setNewLimitMin("");
    setNewLimitMax("");
  };

  const removeLimit = (id) => {
    setTempLimits(tempLimits.filter((l) => l.id !== id));
  };

  const saveConfigs = async () => {
    setSaving(true);
    try {
      const batch = writeBatch(firestore);
      // We save "list" field. If doc doesn't exist, set() creates it.
      batch.set(doc(firestore, "config", "currencies"), {
        list: tempCurrencies,
      });
      batch.set(doc(firestore, "config", "card_types"), { list: tempTypes });
      batch.set(doc(firestore, "config", "global_limits"), {
        list: tempLimits,
      });

      await batch.commit();

      setCurrencies(tempCurrencies);
      setCardTypes(tempTypes);
      setGlobalLimits(tempLimits);
      setShowConfigDialog(false);
      toast({ title: "Settings Saved", description: "Configuration updated." });

      // Refresh to ensure IDs match
      fetchData();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save config.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // --- Card Logic ---
  const handleAddCard = async () => {
    if (!newCardName.trim()) return;
    try {
      const docRef = await addDoc(collection(firestore, "giftCardRates"), {
        name: newCardName,
        rates: [],
      });
      setCards((prev) => [{ id: docRef.id, name: newCardName }, ...prev]);
      setRates((prev) => ({ ...prev, [docRef.id]: {} }));
      setNewCardName("");
      toast({ title: "Added", description: "Card added." });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to add card.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCard = async (id) => {
    if (!confirm("Delete this card and all its rates?")) return;
    try {
      await deleteDoc(doc(firestore, "giftCardRates", id));
      setCards((prev) => prev.filter((c) => c.id !== id));
      const newRates = { ...rates };
      delete newRates[id];
      setRates(newRates);
      toast({ title: "Deleted" });
    } catch {
      toast({
        title: "Error",
        description: "Delete failed.",
        variant: "destructive",
      });
    }
  };

  // --- Rate Logic ---
  const updateRateData = (cardId, limitId, type, currency, field, value) => {
    setRates((prev) => {
      const cardRates = { ...(prev[cardId] || {}) };
      if (!cardRates[limitId]) cardRates[limitId] = {};
      if (!cardRates[limitId][type]) cardRates[limitId][type] = {};
      if (!cardRates[limitId][type][currency])
        cardRates[limitId][type][currency] = { rate: 0, tag: "" };

      if (field === "rate") {
        cardRates[limitId][type][currency].rate =
          value === "" ? "" : parseFloat(value);
      } else {
        cardRates[limitId][type][currency].tag = value;
      }
      return { ...prev, [cardId]: cardRates };
    });
  };

  const handleSaveAll = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      toast({
        title: "Auth Error",
        description: "Please login.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(firestore);

      cards.forEach((card) => {
        const cardRef = doc(firestore, "giftCardRates", card.id);
        const cardData = rates[card.id] || {};
        const rateArray = [];

        globalLimits.forEach((limit) => {
          const limitData = cardData[limit.id];
          if (!limitData) return;

          cardTypes.forEach((type) => {
            const typeData = limitData[type];
            if (!typeData) return;

            currencies.forEach((curr) => {
              const data = typeData[curr];
              if (data && data.rate > 0) {
                rateArray.push({
                  min: limit.min,
                  max: limit.max,
                  cardType: type,
                  currency: curr,
                  rate: parseFloat(data.rate),
                  rateTag: data.tag || "Fast",
                });
              }
            });
          });
        });

        batch.update(cardRef, {
          rates: rateArray,
          lastUpdated: new Date().toISOString(),
          updatedBy: user.email,
        });
      });

      await batch.commit();
      toast({ title: "Published", description: "Rates are live." });
    } catch (err) {
      console.error("Save Error:", err);
      toast({
        title: "Error",
        description: "Save failed.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getRateValue = (cardId, limitId, type, cur, field) => {
    return rates[cardId]?.[limitId]?.[type]?.[cur]?.[field] ?? "";
  };

  if (loading)
    return (
      <div className="p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );

  return (
    <Card className="mt-4 shadow-md border-t-4 border-t-primary">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gift Card Rate Matrix</CardTitle>
          <CardDescription>Manage rates live.</CardDescription>
        </div>
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" /> Global Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Global Configuration</DialogTitle>
              <DialogDescription>
                Define your Limits, Types, and Currencies here.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Limits */}
              <div className="border p-4 rounded-md space-y-3">
                <h3 className="font-semibold">Limits (Range)</h3>
                <div className="flex gap-2 items-end">
                  <Input
                    type="number"
                    className="w-24"
                    value={newLimitMin}
                    onChange={(e) => setNewLimitMin(e.target.value)}
                    placeholder="Min"
                  />
                  <Input
                    type="number"
                    className="w-24"
                    value={newLimitMax}
                    onChange={(e) => setNewLimitMax(e.target.value)}
                    placeholder="Max"
                  />
                  <Button size="sm" onClick={addLimit}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tempLimits.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      No limits set. Add one above.
                    </span>
                  )}
                  {tempLimits.map((l) => (
                    <Badge
                      key={l.id}
                      variant="secondary"
                      className="px-3 py-1 gap-2"
                    >
                      {l.min} - {l.max}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => removeLimit(l.id)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Types */}
              <div className="border p-4 rounded-md space-y-3">
                <h3 className="font-semibold">Card Types</h3>
                <div className="flex gap-2">
                  <Input
                    value={newTypeInput}
                    onChange={(e) => setNewTypeInput(e.target.value)}
                    placeholder="e.g. Physical"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      addConfigItem(tempTypes, setTempTypes, newTypeInput);
                      setNewTypeInput("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tempTypes.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      No types set.
                    </span>
                  )}
                  {tempTypes.map((t) => (
                    <Badge key={t} variant="outline" className="gap-2">
                      {t}{" "}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() =>
                          removeConfigItem(tempTypes, setTempTypes, t)
                        }
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Currencies */}
              <div className="border p-4 rounded-md space-y-3">
                <h3 className="font-semibold">Currencies</h3>
                <div className="flex gap-2">
                  <Input
                    value={newCurrencyInput}
                    onChange={(e) => setNewCurrencyInput(e.target.value)}
                    placeholder="USD"
                    className="uppercase"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      addConfigItem(
                        tempCurrencies,
                        setTempCurrencies,
                        newCurrencyInput.toUpperCase()
                      );
                      setNewCurrencyInput("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tempCurrencies.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      No currencies set.
                    </span>
                  )}
                  {tempCurrencies.map((c) => (
                    <Badge key={c} className="gap-2 bg-slate-800">
                      {c}{" "}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-400"
                        onClick={() =>
                          removeConfigItem(tempCurrencies, setTempCurrencies, c)
                        }
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={saveConfigs}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="New Gift Card Name"
            value={newCardName}
            onChange={(e) => setNewCardName(e.target.value)}
          />
          <Button onClick={handleAddCard} disabled={saving}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Card
          </Button>
        </div>

        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {cards.map((card) => (
              <AccordionItem
                key={card.id}
                value={card.id}
                className="border rounded-lg px-4 bg-slate-50/50"
              >
                <div className="flex items-center justify-between py-2">
                  <AccordionTrigger className="hover:no-underline py-2">
                    <span className="font-bold text-lg">{card.name}</span>
                  </AccordionTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCard(card.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>

                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-6">
                    {globalLimits.length === 0 && (
                      <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg bg-white">
                        <p>No limits defined yet.</p>
                        <Button
                          variant="link"
                          onClick={() => setShowConfigDialog(true)}
                        >
                          Open Global Settings to add Limits.
                        </Button>
                      </div>
                    )}

                    {globalLimits.map((limit) => (
                      <div
                        key={limit.id}
                        className="border rounded-md bg-white overflow-hidden shadow-sm"
                      >
                        <div className="bg-slate-100 px-4 py-2 border-b flex items-center gap-2 font-medium">
                          <span className="text-sm bg-primary text-primary-foreground px-2 py-0.5 rounded">
                            Limit
                          </span>
                          {limit.min} - {limit.max}
                        </div>

                        <div className="p-4 grid gap-6">
                          {cardTypes.length === 0 && (
                            <div className="text-sm text-muted-foreground">
                              No card types defined in settings.
                            </div>
                          )}
                          {cardTypes.map((type) => (
                            <div
                              key={type}
                              className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 items-start border-b last:border-0 pb-4 last:pb-0"
                            >
                              <div className="font-semibold text-sm pt-2 text-slate-700">
                                {type}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {currencies.length === 0 && (
                                  <div className="text-sm text-muted-foreground">
                                    No currencies defined in settings.
                                  </div>
                                )}
                                {currencies.map((cur) => (
                                  <div
                                    key={cur}
                                    className="flex flex-col gap-1.5 p-2 bg-slate-50 rounded border"
                                  >
                                    <div className="flex justify-between items-center">
                                      <label className="text-xs font-bold text-slate-500">
                                        {cur}
                                      </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">
                                        Rate:
                                      </span>
                                      <Input
                                        type="number"
                                        className="h-7 text-sm"
                                        placeholder="0.00"
                                        value={getRateValue(
                                          card.id,
                                          limit.id,
                                          type,
                                          cur,
                                          "rate"
                                        )}
                                        onChange={(e) =>
                                          updateRateData(
                                            card.id,
                                            limit.id,
                                            type,
                                            cur,
                                            "rate",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Tag className="h-3 w-3 text-muted-foreground" />
                                      <Input
                                        className="h-7 text-xs"
                                        placeholder="Tag"
                                        value={getRateValue(
                                          card.id,
                                          limit.id,
                                          type,
                                          cur,
                                          "tag"
                                        )}
                                        onChange={(e) =>
                                          updateRateData(
                                            card.id,
                                            limit.id,
                                            type,
                                            cur,
                                            "tag",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="sticky bottom-4 flex justify-end mt-6 bg-white/90 p-4 border rounded shadow-xl backdrop-blur-sm z-10">
          <Button
            size="lg"
            onClick={handleSaveAll}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save All Changes"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
