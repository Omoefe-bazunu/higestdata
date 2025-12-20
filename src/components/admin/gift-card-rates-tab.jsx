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
  Save,
  PlusCircle,
  Trash2,
  X,
  Settings,
  ChevronDown,
  ChevronRight,
  Tag,
} from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// Default configurations to initialize DB if empty
const DEFAULT_CURRENCIES = ["USD", "EUR", "GBP", "CAD"];
const DEFAULT_TYPES = ["Physical", "E-code"];
const DEFAULT_LIMITS = [
  { id: "l1", min: 10, max: 100 },
  { id: "l2", min: 101, max: 500 },
];

export default function GiftCardRatesTab() {
  const [rates, setRates] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [cardTypes, setCardTypes] = useState([]);
  const [globalLimits, setGlobalLimits] = useState([]);

  const [newCardName, setNewCardName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  // Config State for Dialog
  const [tempCurrencies, setTempCurrencies] = useState([]);
  const [tempTypes, setTempTypes] = useState([]);
  const [tempLimits, setTempLimits] = useState([]);

  // Inputs for Config
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

      // 1. Fetch Configs (Currencies, Types, Limits)
      const configRefs = [
        getDoc(doc(firestore, "config", "currencies")),
        getDoc(doc(firestore, "config", "card_types")),
        getDoc(doc(firestore, "config", "global_limits")),
      ];

      const [currDoc, typeDoc, limitDoc] = await Promise.all(configRefs);

      const loadedCurrencies = currDoc.exists()
        ? currDoc.data().list
        : DEFAULT_CURRENCIES;
      const loadedTypes = typeDoc.exists()
        ? typeDoc.data().list
        : DEFAULT_TYPES;
      const loadedLimits = limitDoc.exists()
        ? limitDoc.data().list
        : DEFAULT_LIMITS;

      setCurrencies(loadedCurrencies);
      setCardTypes(loadedTypes);
      setGlobalLimits(loadedLimits);

      // Initialize temp states for the modal
      setTempCurrencies(loadedCurrencies);
      setTempTypes(loadedTypes);
      setTempLimits(loadedLimits);

      // 2. Fetch Gift Cards
      const snapshot = await getDocs(collection(firestore, "giftCardRates"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || doc.id,
        // structure: rates[limitId][typeId][currency] = { rate: 0, tag: "" }
        rates: doc.data().rates || {},
      }));
      setRates(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Configuration Management ---

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
      batch.set(doc(firestore, "config", "currencies"), {
        list: tempCurrencies,
      });
      batch.set(doc(firestore, "config", "card_types"), { list: tempTypes });
      batch.set(doc(firestore, "config", "global_limits"), {
        list: tempLimits,
      });

      await batch.commit();

      // Update local state
      setCurrencies(tempCurrencies);
      setCardTypes(tempTypes);
      setGlobalLimits(tempLimits);
      setShowConfigDialog(false);

      toast({
        title: "Settings Saved",
        description: "Global configurations updated.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save configs",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // --- Card Management ---

  const handleAddCard = () => {
    if (!newCardName.trim()) return;
    const id = newCardName.toLowerCase().replace(/\s+/g, "-");

    if (rates.some((r) => r.id === id)) {
      toast({
        title: "Duplicate",
        description: "Card exists.",
        variant: "destructive",
      });
      return;
    }

    setRates((prev) => [{ id, name: newCardName, rates: {} }, ...prev]);
    setNewCardName("");
    toast({ title: "Added", description: "Remember to save changes." });
  };

  const handleDeleteCard = async (id) => {
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

  // --- Rate Updates ---

  const updateRateData = (cardId, limitId, type, currency, field, value) => {
    setRates((prevRates) =>
      prevRates.map((card) => {
        if (card.id !== cardId) return card;

        const newRates = { ...card.rates };
        if (!newRates[limitId]) newRates[limitId] = {};
        if (!newRates[limitId][type]) newRates[limitId][type] = {};
        if (!newRates[limitId][type][currency])
          newRates[limitId][type][currency] = { rate: 0, tag: "" };

        if (field === "rate") {
          const num = parseFloat(value);
          newRates[limitId][type][currency].rate = isNaN(num) ? 0 : num;
        } else {
          newRates[limitId][type][currency].tag = value;
        }

        return { ...card, rates: newRates };
      })
    );
  };

  const handleSaveRates = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      toast({
        title: "Auth Error",
        description: "Login required.",
        variant: "destructive",
      });
      return;
    }

    // CRITICAL: Prevent saving if data hasn't loaded to avoid wiping the DB
    if (loading || rates.length === 0) {
      toast({
        title: "Wait",
        description: "Please wait for data to load before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(firestore);

      rates.forEach((card) => {
        const ref = doc(firestore, "giftCardRates", card.id);

        // Use { merge: true } to prevent accidental erasures of other fields
        // and ensure we are only updating the 'name' and specific 'rates' matrix.
        batch.set(
          ref,
          {
            name: card.name,
            rates: card.rates,
            lastUpdated: new Date().toISOString(), // Good for debugging
            updatedBy: user.email,
          },
          { merge: true }
        );
      });

      await batch.commit();
      toast({ title: "Saved", description: "All rates updated successfully." });
    } catch (err) {
      console.error("Save Rates Error:", err);
      toast({
        title: "Error",
        description: "Failed to save rates: " + err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  // --- Render Helpers ---

  const getRateValue = (card, limitId, type, cur, field) => {
    return (
      card.rates?.[limitId]?.[type]?.[cur]?.[field] ||
      (field === "rate" ? 0 : "")
    );
  };

  if (loading)
    return (
      <div className="p-4">
        <Skeleton className="h-48 w-full" />
      </div>
    );

  return (
    <Card className="mt-4 shadow-md border-t-4 border-t-primary">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gift Card Rate Matrix</CardTitle>
          <CardDescription>
            Manage global settings and set rates per Limit, Type, and Currency.
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
                Define Limits, Card Types, and Currencies applicable to ALL
                cards.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Global Limits */}
              <div className="border p-4 rounded-md space-y-3">
                <h3 className="font-semibold flex items-center">
                  Global Limits (Range)
                </h3>
                <div className="flex gap-2 items-end">
                  <div className="grid gap-1.5">
                    <span className="text-xs">Min</span>
                    <Input
                      type="number"
                      className="w-24"
                      value={newLimitMin}
                      onChange={(e) => setNewLimitMin(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <span className="text-xs">Max</span>
                    <Input
                      type="number"
                      className="w-24"
                      value={newLimitMax}
                      onChange={(e) => setNewLimitMax(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                  <Button size="sm" onClick={addLimit}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tempLimits.map((l) => (
                    <Badge
                      key={l.id}
                      variant="secondary"
                      className="px-3 py-1 gap-2"
                    >
                      {l.min} - {l.max}
                      <X
                        className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-red-500"
                        onClick={() => removeLimit(l.id)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Global Types */}
              <div className="border p-4 rounded-md space-y-3">
                <h3 className="font-semibold">
                  Card Types (e.g., Physical, E-code)
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={newTypeInput}
                    onChange={(e) => setNewTypeInput(e.target.value)}
                    placeholder="New Type"
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
                  {tempTypes.map((t) => (
                    <Badge key={t} variant="outline" className="gap-2">
                      {t}
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

              {/* Global Currencies */}
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
                  {tempCurrencies.map((c) => (
                    <Badge key={c} className="gap-2 bg-slate-800">
                      {c}
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
        {/* Add New Card */}
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="New Gift Card Name (e.g., Apple iTunes)"
            value={newCardName}
            onChange={(e) => setNewCardName(e.target.value)}
          />
          <Button onClick={handleAddCard} disabled={saving}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Card
          </Button>
        </div>

        {/* Cards List */}
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {rates.map((card) => (
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
                  {/* The Rate Matrix */}
                  <div className="space-y-6">
                    {globalLimits.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        No limits defined in Global Settings.
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
                          {cardTypes.map((type) => (
                            <div
                              key={type}
                              className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 items-start border-b last:border-0 pb-4 last:pb-0"
                            >
                              <div className="font-semibold text-sm pt-2 text-slate-700">
                                {type}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                                          card,
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
                                        placeholder="Tag (e.g. Slow)"
                                        value={getRateValue(
                                          card,
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
            onClick={handleSaveRates}
            disabled={saving || loading} // Added loading check here
          >
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
