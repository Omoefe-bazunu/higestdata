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
import {
  PlusCircle,
  Trash2,
  X,
  Settings,
  Tag,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
  getDoc,
  addDoc,
  setDoc,
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
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GiftCardRatesTab() {
  const [rates, setRates] = useState({});
  const [cards, setCards] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [cardTypes, setCardTypes] = useState([]);
  const [newCardName, setNewCardName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  // Config Dialog State
  const [tempCurrencies, setTempCurrencies] = useState([]);
  const [tempTypes, setTempTypes] = useState([]);
  const [newCurrencyInput, setNewCurrencyInput] = useState("");
  const [newTypeInput, setNewTypeInput] = useState("");

  // Card-specific limits dialog
  const [showLimitsDialog, setShowLimitsDialog] = useState(false);
  const [activeLimitsCardId, setActiveLimitsCardId] = useState(null);
  const [tempCardLimits, setTempCardLimits] = useState([]);
  const [newLimitMin, setNewLimitMin] = useState("");
  const [newLimitMax, setNewLimitMax] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch global configs (currencies and types only)
      const [currDoc, typeDoc] = await Promise.all([
        getDoc(doc(firestore, "config", "currencies")),
        getDoc(doc(firestore, "config", "card_types")),
      ]);

      const loadedCurrencies = currDoc.exists()
        ? currDoc.data()?.list || []
        : [];
      const loadedTypes = typeDoc.exists() ? typeDoc.data()?.list || [] : [];

      setCurrencies(loadedCurrencies);
      setCardTypes(loadedTypes);
      setTempCurrencies(loadedCurrencies);
      setTempTypes(loadedTypes);

      // Fetch Cards with their card-specific limits
      const snapshot = await getDocs(collection(firestore, "giftCardRates"));

      const cardList = [];
      const nestedRates = {};

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const cardId = docSnap.id;

        // Get card-specific limits with validation
        const cardLimits = Array.isArray(data.limits) ? data.limits : [];

        // Validate and clean limits
        const validLimits = cardLimits.filter((l) => {
          return (
            l &&
            typeof l.id === "string" &&
            typeof l.min === "number" &&
            typeof l.max === "number" &&
            l.min < l.max
          );
        });

        cardList.push({
          id: cardId,
          name: data.name || cardId,
          limits: validLimits,
        });

        nestedRates[cardId] = {};

        // Parse rates safely
        if (Array.isArray(data.rates)) {
          data.rates.forEach((r) => {
            // Validate rate object
            if (
              !r ||
              typeof r.rate !== "number" ||
              !r.cardType ||
              !r.currency
            ) {
              return;
            }

            // Match rate to a card-specific limit by Value (Min/Max)
            const matchingLimit = validLimits.find(
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
      console.error("Fetch Error:", err);
      toast({
        title: "Error",
        description: "Failed to load data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Global Config Logic (Currencies & Types only)
  const addConfigItem = (list, setList, item) => {
    const trimmedItem = typeof item === "string" ? item.trim() : item;
    if (!trimmedItem || list.includes(trimmedItem)) return;
    setList([...list, trimmedItem]);
  };

  const removeConfigItem = (list, setList, item) => {
    setList(list.filter((i) => i !== item));
  };

  const saveConfigs = async () => {
    setSaving(true);
    try {
      const batch = writeBatch(firestore);

      // Use setDoc to create if not exists
      batch.set(
        doc(firestore, "config", "currencies"),
        {
          list: tempCurrencies,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      batch.set(
        doc(firestore, "config", "card_types"),
        {
          list: tempTypes,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      await batch.commit();

      setCurrencies(tempCurrencies);
      setCardTypes(tempTypes);
      setShowConfigDialog(false);
      toast({
        title: "Settings Saved",
        description: "Configuration updated successfully.",
      });

      // Refresh data to ensure consistency
      await fetchData();
    } catch (err) {
      console.error("Save Config Error:", err);
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Card-Specific Limits Logic
  const openLimitsDialog = (cardId) => {
    const card = cards.find((c) => c.id === cardId);
    setActiveLimitsCardId(cardId);
    setTempCardLimits([...(card?.limits || [])]);
    setNewLimitMin("");
    setNewLimitMax("");
    setShowLimitsDialog(true);
  };

  const addCardLimit = () => {
    const min = parseFloat(newLimitMin);
    const max = parseFloat(newLimitMax);

    if (isNaN(min) || isNaN(max)) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid numbers for Min and Max.",
        variant: "destructive",
      });
      return;
    }

    if (min >= max) {
      toast({
        title: "Invalid Range",
        description: "Min must be less than Max.",
        variant: "destructive",
      });
      return;
    }

    // Check for overlapping ranges
    const hasOverlap = tempCardLimits.some((l) => {
      return (
        (min >= l.min && min < l.max) ||
        (max > l.min && max <= l.max) ||
        (min <= l.min && max >= l.max)
      );
    });

    if (hasOverlap) {
      toast({
        title: "Overlapping Range",
        description: "This range overlaps with an existing limit.",
        variant: "destructive",
      });
      return;
    }

    const newLimit = {
      id: `limit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      min,
      max,
    };

    setTempCardLimits(
      [...tempCardLimits, newLimit].sort((a, b) => a.min - b.min)
    );
    setNewLimitMin("");
    setNewLimitMax("");
  };

  const removeCardLimit = (limitId) => {
    // Check if limit is being used
    const cardData = rates[activeLimitsCardId] || {};
    const limitHasRates =
      cardData[limitId] && Object.keys(cardData[limitId]).length > 0;

    if (limitHasRates) {
      if (
        !confirm(
          "This limit has rates configured. Deleting it will remove all associated rates. Continue?"
        )
      ) {
        return;
      }
    }

    setTempCardLimits(tempCardLimits.filter((l) => l.id !== limitId));
  };

  const saveCardLimits = async () => {
    if (!activeLimitsCardId) return;

    setSaving(true);
    try {
      const cardRef = doc(firestore, "giftCardRates", activeLimitsCardId);
      const cardDoc = await getDoc(cardRef);

      if (!cardDoc.exists()) {
        throw new Error("Card not found");
      }

      // Get existing rates
      const existingRates = cardDoc.data()?.rates || [];

      // Filter out rates for removed limits
      const updatedRates = existingRates.filter((rate) => {
        return tempCardLimits.some(
          (limit) => limit.min === rate.min && limit.max === rate.max
        );
      });

      // Update card document
      await setDoc(
        cardRef,
        {
          limits: tempCardLimits,
          rates: updatedRates,
          limitsUpdatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Update local state
      setCards(
        cards.map((c) =>
          c.id === activeLimitsCardId ? { ...c, limits: tempCardLimits } : c
        )
      );

      // Clean up rates state for removed limits
      const oldLimits =
        cards.find((c) => c.id === activeLimitsCardId)?.limits || [];
      const removedLimitIds = oldLimits
        .filter(
          (oldLimit) =>
            !tempCardLimits.find((newLimit) => newLimit.id === oldLimit.id)
        )
        .map((l) => l.id);

      if (removedLimitIds.length > 0) {
        setRates((prev) => {
          const cardRates = { ...(prev[activeLimitsCardId] || {}) };
          removedLimitIds.forEach((lid) => delete cardRates[lid]);
          return { ...prev, [activeLimitsCardId]: cardRates };
        });
      }

      setShowLimitsDialog(false);
      toast({
        title: "Limits Saved",
        description: "Card limits updated successfully.",
      });
    } catch (err) {
      console.error("Save Limits Error:", err);
      toast({
        title: "Error",
        description: "Failed to save limits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Card Logic
  const handleAddCard = async () => {
    const trimmedName = newCardName.trim();
    if (!trimmedName) {
      toast({
        title: "Invalid Name",
        description: "Please enter a card name.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate names
    if (cards.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast({
        title: "Duplicate Card",
        description: "A card with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    try {
      const docRef = await addDoc(collection(firestore, "giftCardRates"), {
        name: trimmedName,
        rates: [],
        limits: [],
        createdAt: new Date().toISOString(),
      });

      setCards((prev) => [
        { id: docRef.id, name: trimmedName, limits: [] },
        ...prev,
      ]);
      setRates((prev) => ({ ...prev, [docRef.id]: {} }));
      setNewCardName("");
      toast({
        title: "Card Added",
        description: `${trimmedName} has been added.`,
      });
    } catch (err) {
      console.error("Add Card Error:", err);
      toast({
        title: "Error",
        description: "Failed to add card. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCard = async (id) => {
    const card = cards.find((c) => c.id === id);
    if (
      !confirm(
        `Delete "${card?.name}" and all its rates? This action cannot be undone.`
      )
    )
      return;

    try {
      await deleteDoc(doc(firestore, "giftCardRates", id));
      setCards((prev) => prev.filter((c) => c.id !== id));
      const newRates = { ...rates };
      delete newRates[id];
      setRates(newRates);
      toast({
        title: "Card Deleted",
        description: "The card has been removed.",
      });
    } catch (err) {
      console.error("Delete Card Error:", err);
      toast({
        title: "Error",
        description: "Failed to delete card. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Rate Logic
  const updateRateData = (cardId, limitId, type, currency, field, value) => {
    setRates((prev) => {
      const cardRates = { ...(prev[cardId] || {}) };
      if (!cardRates[limitId]) cardRates[limitId] = {};
      if (!cardRates[limitId][type]) cardRates[limitId][type] = {};
      if (!cardRates[limitId][type][currency])
        cardRates[limitId][type][currency] = { rate: 0, tag: "" };

      if (field === "rate") {
        const numValue = value === "" ? "" : parseFloat(value);
        cardRates[limitId][type][currency].rate = numValue;
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
        title: "Authentication Required",
        description: "Please log in to save changes.",
        variant: "destructive",
      });
      return;
    }

    // Validate that there's something to save
    const hasRates = cards.some((card) => {
      const cardData = rates[card.id] || {};
      return Object.keys(cardData).length > 0;
    });

    if (!hasRates) {
      toast({
        title: "No Changes",
        description: "Please add some rates before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(firestore);
      let updatedCount = 0;

      cards.forEach((card) => {
        const cardRef = doc(firestore, "giftCardRates", card.id);
        const cardData = rates[card.id] || {};
        const rateArray = [];
        const cardLimits = card.limits || [];

        cardLimits.forEach((limit) => {
          const limitData = cardData[limit.id];
          if (!limitData) return;

          cardTypes.forEach((type) => {
            const typeData = limitData[type];
            if (!typeData) return;

            currencies.forEach((curr) => {
              const data = typeData[curr];
              if (data && typeof data.rate === "number" && data.rate > 0) {
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

        if (rateArray.length > 0) {
          batch.update(cardRef, {
            rates: rateArray,
            lastUpdated: new Date().toISOString(),
            updatedBy: user.email || user.uid,
          });
          updatedCount++;
        }
      });

      if (updatedCount === 0) {
        toast({
          title: "No Valid Rates",
          description: "Please enter valid rates before saving.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      await batch.commit();
      toast({
        title: "Changes Published",
        description: `${updatedCount} card(s) updated successfully. Rates are now live.`,
      });
    } catch (err) {
      console.error("Save All Error:", err);
      toast({
        title: "Save Failed",
        description: "An error occurred while saving. Please try again.",
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
          <CardDescription>
            Manage rates with card-specific limits.
          </CardDescription>
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
                Define card types and currencies. Limits are set per card.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Types */}
              <div className="border p-4 rounded-md space-y-3">
                <h3 className="font-semibold">Card Types</h3>
                <div className="flex gap-2">
                  <Input
                    value={newTypeInput}
                    onChange={(e) => setNewTypeInput(e.target.value)}
                    placeholder="e.g. Physical"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addConfigItem(tempTypes, setTempTypes, newTypeInput);
                        setNewTypeInput("");
                      }
                    }}
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
                    onChange={(e) =>
                      setNewCurrencyInput(e.target.value.toUpperCase())
                    }
                    placeholder="USD"
                    className="uppercase"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addConfigItem(
                          tempCurrencies,
                          setTempCurrencies,
                          newCurrencyInput.toUpperCase()
                        );
                        setNewCurrencyInput("");
                      }
                    }}
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
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCard();
              }
            }}
          />
          <Button onClick={handleAddCard} disabled={saving}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Card
          </Button>
        </div>

        {cards.length === 0 && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No gift cards added yet. Add a card above to get started.
            </AlertDescription>
          </Alert>
        )}

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
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{card.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {card.limits?.length || 0} Limits
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLimitsDialog(card.id);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-1" /> Limits
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(card.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>

                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-6">
                    {(!card.limits || card.limits.length === 0) && (
                      <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg bg-white">
                        <p>No limits defined for this card yet.</p>
                        <Button
                          variant="link"
                          onClick={() => openLimitsDialog(card.id)}
                        >
                          Click here to add limits
                        </Button>
                      </div>
                    )}

                    {card.limits?.map((limit) => (
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
                              No card types defined. Add them in Global
                              Settings.
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
                                    No currencies defined. Add them in Global
                                    Settings.
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
                                        step="0.01"
                                        min="0"
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
                                        maxLength={20}
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

        {cards.length > 0 && (
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
        )}
      </CardContent>

      {/* Card-Specific Limits Dialog */}
      <Dialog open={showLimitsDialog} onOpenChange={setShowLimitsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Limits -{" "}
              {cards.find((c) => c.id === activeLimitsCardId)?.name}
            </DialogTitle>
            <DialogDescription>
              Define value ranges for this specific card.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="border p-4 rounded-md space-y-3">
              <h3 className="font-semibold">Add Limit Range</h3>
              <div className="flex gap-2 items-end">
                <div className="space-y-1 flex-1">
                  <label className="text-xs text-muted-foreground">Min</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newLimitMin}
                    onChange={(e) => setNewLimitMin(e.target.value)}
                    placeholder="0"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCardLimit();
                      }
                    }}
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-xs text-muted-foreground">Max</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newLimitMax}
                    onChange={(e) => setNewLimitMax(e.target.value)}
                    placeholder="100"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCardLimit();
                      }
                    }}
                  />
                </div>
                <Button size="sm" onClick={addCardLimit}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium">Current Limits</h4>
                {tempCardLimits.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No limits set. Add one above.
                  </p>
                )}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {tempCardLimits.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between p-2 border rounded bg-slate-50"
                    >
                      <span className="font-medium">
                        {l.min} - {l.max}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCardLimit(l.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowLimitsDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={saveCardLimits}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Limits"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
