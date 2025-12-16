// "use client";

// import { useState, useEffect } from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Save, PlusCircle, Trash2, X } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import {
//   collection,
//   getDocs,
//   setDoc,
//   deleteDoc,
//   doc,
//   writeBatch,
//   getDoc,
// } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { firestore } from "@/lib/firebaseConfig";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";

// const DEFAULT_CURRENCIES = ["USD", "EUR", "GBP", "CAD"];

// export default function GiftCardRatesTab() {
//   const [rates, setRates] = useState([]);
//   const [currencies, setCurrencies] = useState([]);
//   const [newCardName, setNewCardName] = useState("");
//   const [newCurrency, setNewCurrency] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
//   const { toast } = useToast();

//   useEffect(() => {
//     async function fetchData() {
//       try {
//         setLoading(true);

//         // Fetch currencies configuration
//         const currenciesDoc = await getDoc(
//           doc(firestore, "config", "currencies")
//         );
//         if (currenciesDoc.exists()) {
//           const currenciesList =
//             currenciesDoc.data().list || DEFAULT_CURRENCIES;
//           setCurrencies(currenciesList);
//         } else {
//           setCurrencies(DEFAULT_CURRENCIES);
//         }

//         // Fetch gift card rates
//         const snapshot = await getDocs(collection(firestore, "giftCardRates"));
//         const data = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           name: doc.data().name || doc.id,
//           limits: doc.data().limits || [
//             {
//               id: `limit-${Date.now()}`,
//               min: 10,
//               max: 1000,
//               currencies: {},
//             },
//           ],
//         }));
//         setRates(data);
//       } catch (err) {
//         toast({
//           title: "Error",
//           description: "Failed to load rates.",
//           variant: "destructive",
//         });
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchData();
//   }, [toast]);

//   const updateLimitCurrencyRate = (cardId, limitId, currency, value) => {
//     const num = parseFloat(value);
//     if (isNaN(num) || num < 0) {
//       toast({
//         title: "Invalid",
//         description: "Rate must be ≥ 0.",
//         variant: "destructive",
//       });
//       return;
//     }
//     setRates((prev) =>
//       prev.map((card) =>
//         card.id === cardId
//           ? {
//               ...card,
//               limits: card.limits.map((limit) =>
//                 limit.id === limitId
//                   ? {
//                       ...limit,
//                       currencies: { ...limit.currencies, [currency]: num },
//                     }
//                   : limit
//               ),
//             }
//           : card
//       )
//     );
//   };

//   const updateLimitRange = (cardId, limitId, field, value) => {
//     const num = parseFloat(value);
//     if (isNaN(num) || num < 0) return;

//     setRates((prev) =>
//       prev.map((card) =>
//         card.id === cardId
//           ? {
//               ...card,
//               limits: card.limits.map((limit) =>
//                 limit.id === limitId ? { ...limit, [field]: num } : limit
//               ),
//             }
//           : card
//       )
//     );
//   };

//   const handleAddLimit = (cardId) => {
//     const card = rates.find((r) => r.id === cardId);
//     if (!card) return;

//     const lastLimit = card.limits[card.limits.length - 1];
//     const newMin = lastLimit ? lastLimit.max : 0;
//     const newMax = newMin + 500;

//     const currencyRates = {};
//     currencies.forEach((c) => (currencyRates[c] = 0));

//     setRates((prev) =>
//       prev.map((c) =>
//         c.id === cardId
//           ? {
//               ...c,
//               limits: [
//                 ...c.limits,
//                 {
//                   id: `limit-${Date.now()}`,
//                   min: newMin,
//                   max: newMax,
//                   currencies: currencyRates,
//                 },
//               ],
//             }
//           : c
//       )
//     );
//     toast({ title: "Limit Added", description: "Remember to save changes." });
//   };

//   const handleRemoveLimit = (cardId, limitId) => {
//     const card = rates.find((r) => r.id === cardId);
//     if (!card || card.limits.length <= 1) {
//       toast({
//         title: "Error",
//         description: "Must have at least one limit.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setRates((prev) =>
//       prev.map((c) =>
//         c.id === cardId
//           ? {
//               ...c,
//               limits: c.limits.filter((l) => l.id !== limitId),
//             }
//           : c
//       )
//     );
//   };

//   const handleAddCard = () => {
//     if (!newCardName.trim()) {
//       toast({
//         title: "Error",
//         description: "Card name required.",
//         variant: "destructive",
//       });
//       return;
//     }
//     const id = newCardName.toLowerCase().replace(/\s+/g, "-");
//     if (rates.some((r) => r.id === id)) {
//       toast({
//         title: "Duplicate",
//         description: "Card exists.",
//         variant: "destructive",
//       });
//       return;
//     }
//     const currencyRates = {};
//     currencies.forEach((c) => (currencyRates[c] = 0));
//     setRates((prev) => [
//       {
//         id,
//         name: newCardName,
//         limits: [
//           {
//             id: `limit-${Date.now()}`,
//             min: 10,
//             max: 1000,
//             currencies: currencyRates,
//           },
//         ],
//       },
//       ...prev,
//     ]);
//     setNewCardName("");
//     toast({ title: "Added", description: "Save to confirm." });
//   };

//   const handleDelete = async (id) => {
//     try {
//       await deleteDoc(doc(firestore, "giftCardRates", id));
//       setRates((prev) => prev.filter((r) => r.id !== id));
//       toast({ title: "Deleted" });
//     } catch {
//       toast({
//         title: "Error",
//         description: "Delete failed.",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleAddCurrency = () => {
//     const trimmed = newCurrency.trim().toUpperCase();
//     if (!trimmed) {
//       toast({
//         title: "Error",
//         description: "Currency name required.",
//         variant: "destructive",
//       });
//       return;
//     }
//     if (currencies.includes(trimmed)) {
//       toast({
//         title: "Duplicate",
//         description: "Currency already exists.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setCurrencies((prev) => [...prev, trimmed]);

//     setRates((prev) =>
//       prev.map((card) => ({
//         ...card,
//         limits: card.limits.map((limit) => ({
//           ...limit,
//           currencies: { ...limit.currencies, [trimmed]: 0 },
//         })),
//       }))
//     );

//     setNewCurrency("");
//     toast({
//       title: "Currency Added",
//       description: "Remember to save changes.",
//     });
//   };

//   const handleRemoveCurrency = (currencyToRemove) => {
//     if (currencies.length <= 1) {
//       toast({
//         title: "Error",
//         description: "Must have at least one currency.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setCurrencies((prev) => prev.filter((c) => c !== currencyToRemove));

//     setRates((prev) =>
//       prev.map((card) => ({
//         ...card,
//         limits: card.limits.map((limit) => {
//           const updatedCurrencies = { ...limit.currencies };
//           delete updatedCurrencies[currencyToRemove];
//           return {
//             ...limit,
//             currencies: updatedCurrencies,
//           };
//         }),
//       }))
//     );

//     toast({
//       title: "Currency Removed",
//       description: "Remember to save changes.",
//     });
//   };

//   const handleSave = async () => {
//     const user = getAuth().currentUser;
//     if (!user) {
//       toast({
//         title: "Auth Error",
//         description: "Login required.",
//         variant: "destructive",
//       });
//       return;
//     }
//     try {
//       setSaving(true);

//       // Save currencies configuration
//       const currenciesRef = doc(firestore, "config", "currencies");
//       await setDoc(currenciesRef, { list: currencies });

//       // Save gift card rates in batch
//       const batch = writeBatch(firestore);
//       rates.forEach((card) => {
//         const ref = doc(firestore, "giftCardRates", card.id);

//         const cleanLimits = card.limits.map((limit) => {
//           const cleanCurrencies = {};
//           Object.keys(limit.currencies).forEach((curr) => {
//             const val = parseFloat(limit.currencies[curr]);
//             cleanCurrencies[curr] = isNaN(val) ? 0 : val;
//           });

//           return {
//             id: limit.id,
//             min: typeof limit.min === "number" ? limit.min : 0,
//             max: typeof limit.max === "number" ? limit.max : 1000,
//             currencies: cleanCurrencies,
//           };
//         });

//         batch.set(ref, {
//           name: card.name,
//           limits: cleanLimits,
//         });
//       });

//       await batch.commit();
//       toast({ title: "Saved", description: "Rates and currencies updated." });
//     } catch (err) {
//       console.error("Save error:", err);
//       toast({
//         title: "Error",
//         description: err.message || "Save failed.",
//         variant: "destructive",
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <Card className="mt-4">
//       <CardHeader>
//         <CardTitle>Gift Card Rates</CardTitle>
//         <CardDescription>
//           Set exchange rates per unit (NGN) for each currency and limit range.
//         </CardDescription>
//       </CardHeader>
//       <CardContent>
//         <div className="space-y-6">
//           <div className="flex justify-end">
//             <Dialog
//               open={showCurrencyDialog}
//               onOpenChange={setShowCurrencyDialog}
//             >
//               <DialogTrigger asChild>
//                 <Button variant="outline" size="sm">
//                   Manage Currencies
//                 </Button>
//               </DialogTrigger>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Manage Currencies</DialogTitle>
//                   <DialogDescription>
//                     Add or remove currencies. Changes apply to all gift cards.
//                   </DialogDescription>
//                 </DialogHeader>
//                 <div className="space-y-4">
//                   <div className="flex gap-2">
//                     <Input
//                       placeholder="New currency (e.g., KRW)"
//                       value={newCurrency}
//                       onChange={(e) => setNewCurrency(e.target.value)}
//                       onKeyPress={(e) => {
//                         if (e.key === "Enter") {
//                           handleAddCurrency();
//                         }
//                       }}
//                     />
//                     <Button onClick={handleAddCurrency}>
//                       <PlusCircle className="mr-2 h-4 w-4" />
//                       Add
//                     </Button>
//                   </div>

//                   <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
//                     <div className="grid grid-cols-2 gap-2">
//                       {currencies.map((cur) => (
//                         <div
//                           key={cur}
//                           className="flex items-center justify-between bg-secondary/50 rounded px-3 py-2"
//                         >
//                           <span className="font-medium text-sm">{cur}</span>
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             className="h-6 w-6"
//                             onClick={() => handleRemoveCurrency(cur)}
//                           >
//                             <X className="h-3 w-3" />
//                           </Button>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               </DialogContent>
//             </Dialog>
//           </div>

//           {/* Add Card Form - Moved to Top */}
//           <div className="flex gap-2 p-4 border rounded-lg bg-secondary/20">
//             <Input
//               placeholder="New card name (e.g., Amazon)"
//               value={newCardName}
//               onChange={(e) => setNewCardName(e.target.value)}
//               disabled={saving}
//               onKeyPress={(e) => {
//                 if (e.key === "Enter") {
//                   handleAddCard();
//                 }
//               }}
//             />
//             <Button variant="default" onClick={handleAddCard} disabled={saving}>
//               <PlusCircle className="mr-2 h-4 w-4" />
//               Add Card
//             </Button>
//           </div>

//           {loading ? (
//             <div className="space-y-4">
//               {Array.from({ length: 3 }).map((_, i) => (
//                 <Skeleton key={i} className="h-32 w-full" />
//               ))}
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {rates.map((card) => (
//                 <div key={card.id} className="border rounded-lg p-4 bg-card">
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="font-semibold text-lg">{card.name}</h3>
//                     <div className="flex gap-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => handleAddLimit(card.id)}
//                         disabled={saving}
//                       >
//                         <PlusCircle className="mr-2 h-4 w-4" />
//                         Add Limit
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         onClick={() => handleDelete(card.id)}
//                         disabled={saving}
//                       >
//                         <Trash2 className="h-4 w-4 text-destructive" />
//                       </Button>
//                     </div>
//                   </div>

//                   <div className="space-y-3">
//                     {card.limits.map((limit, idx) => (
//                       <div
//                         key={limit.id}
//                         className="border rounded p-3 bg-secondary/10"
//                       >
//                         <div className="flex items-center justify-between mb-3">
//                           <div className="flex items-center gap-3">
//                             <span className="text-sm font-medium text-muted-foreground">
//                               Limit {idx + 1}:
//                             </span>
//                             <div className="flex items-center gap-2">
//                               <Input
//                                 type="number"
//                                 value={limit.min}
//                                 onChange={(e) =>
//                                   updateLimitRange(
//                                     card.id,
//                                     limit.id,
//                                     "min",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-8 w-24 text-sm"
//                                 min="0"
//                                 disabled={saving}
//                               />
//                               <span className="text-sm">to</span>
//                               <Input
//                                 type="number"
//                                 value={limit.max}
//                                 onChange={(e) =>
//                                   updateLimitRange(
//                                     card.id,
//                                     limit.id,
//                                     "max",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-8 w-24 text-sm"
//                                 min="0"
//                                 disabled={saving}
//                               />
//                             </div>
//                           </div>
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             className="h-7 w-7"
//                             onClick={() => handleRemoveLimit(card.id, limit.id)}
//                             disabled={saving || card.limits.length <= 1}
//                           >
//                             <Trash2 className="h-3 w-3 text-destructive" />
//                           </Button>
//                         </div>

//                         <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
//                           {currencies.map((cur) => (
//                             <div key={cur} className="flex flex-col gap-1">
//                               <label className="text-xs font-medium">
//                                 {cur}
//                               </label>
//                               <Input
//                                 type="number"
//                                 value={limit.currencies[cur] || 0}
//                                 onChange={(e) =>
//                                   updateLimitCurrencyRate(
//                                     card.id,
//                                     limit.id,
//                                     cur,
//                                     e.target.value
//                                   )
//                                 }
//                                 className="h-8 text-sm"
//                                 min="0"
//                                 step="0.01"
//                                 disabled={saving}
//                               />
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}

//           <div className="flex justify-end pt-4 border-t">
//             <Button onClick={handleSave} disabled={saving || loading}>
//               <Save className="mr-2 h-4 w-4" />
//               {saving ? "Saving..." : "Save All Changes"}
//             </Button>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

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

    setSaving(true);
    try {
      const batch = writeBatch(firestore);

      rates.forEach((card) => {
        const ref = doc(firestore, "giftCardRates", card.id);
        // Clean up empty objects before saving to save space
        batch.set(ref, {
          name: card.name,
          rates: card.rates,
        });
      });

      await batch.commit();
      toast({ title: "Saved", description: "All rates updated successfully." });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message,
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
          <Button size="lg" onClick={handleSaveRates} disabled={saving}>
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
