"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Lightbulb,
  Loader,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "@/lib/firebaseConfig";
import { useToast } from "@/hooks/use-toast";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function GiftCardsPage() {
  // --- State ---
  const [giftCards, setGiftCards] = useState([]); // Stores all card data
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  // Form Selections
  const [selectedCardId, setSelectedCardId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [faceValue, setFaceValue] = useState("");
  const [cardCode, setCardCode] = useState("");

  // Image Upload State
  const [cardImages, setCardImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({});

  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const router = useRouter();
  const MAX_IMAGES = 10;

  // --- 1. Authentication Check ---
  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((usr) => {
      if (usr) {
        setUser(usr);
        setAuthChecked(true);
      } else {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  // --- 2. Fetch Gift Card Data ---
  useEffect(() => {
    if (!authChecked || !user) return;

    async function fetchData() {
      try {
        const snapshot = await getDocs(collection(firestore, "giftCardRates"));

        // Transform data into a clean structure
        // We expect doc.data().rates to be an ARRAY of rate objects
        // If your DB has it as a map, we convert it here to be safe.
        const data = snapshot.docs.map((doc) => {
          const rawData = doc.data();
          let cleanRates = [];

          if (Array.isArray(rawData.rates)) {
            // Perfect format
            cleanRates = rawData.rates;
          } else if (rawData.rates && typeof rawData.rates === "object") {
            // Handle legacy Map format if present, but Array is preferred
            // This attempts to flatten a nested object if that's what is currently in DB
            // Structure assumption: rates[limitId][type][currency] -> Object
            Object.values(rawData.rates).forEach((typeObj) => {
              if (typeof typeObj === "object") {
                Object.values(typeObj).forEach((currObj) => {
                  if (typeof currObj === "object") {
                    Object.values(currObj).forEach((rateDetail) => {
                      cleanRates.push(rateDetail);
                    });
                  }
                });
              }
            });
          }

          return {
            id: doc.id,
            name: rawData.name || doc.id,
            rates: cleanRates,
          };
        });

        setGiftCards(data);
      } catch (err) {
        console.error("Fetch Error:", err);
        toast({
          title: "Error",
          description: "Failed to load gift cards. Please refresh.",
          variant: "destructive",
        });
      }
    }
    fetchData();
  }, [authChecked, user, toast]);

  // --- 3. Cascading Dropdown Logic ---

  // A. Find selected card object
  const selectedCardData = useMemo(
    () => giftCards.find((c) => c.id === selectedCardId),
    [giftCards, selectedCardId]
  );

  // B. Derive Available Types for this Card
  const availableTypes = useMemo(() => {
    if (!selectedCardData?.rates) return [];
    // Extract unique cardTypes from the rates array
    const types = new Set(
      selectedCardData.rates.map((r) => r.cardType).filter(Boolean)
    );
    return Array.from(types);
  }, [selectedCardData]);

  // Reset Type if it's no longer valid
  useEffect(() => {
    if (selectedType && !availableTypes.includes(selectedType)) {
      setSelectedType("");
      setSelectedCurrency("");
    }
  }, [selectedCardId, availableTypes]); // Only depend on upstream changes

  // C. Derive Available Currencies for this Card + Type
  const availableCurrencies = useMemo(() => {
    if (!selectedCardData?.rates || !selectedType) return [];
    // Filter rates by selected Type, then extract unique currencies
    const currs = new Set(
      selectedCardData.rates
        .filter((r) => r.cardType === selectedType)
        .map((r) => r.currency)
        .filter(Boolean)
    );
    return Array.from(currs);
  }, [selectedCardData, selectedType]);

  // Reset Currency if no longer valid
  useEffect(() => {
    if (selectedCurrency && !availableCurrencies.includes(selectedCurrency)) {
      setSelectedCurrency("");
    }
  }, [selectedType, availableCurrencies]);

  // --- 4. Rate Calculation Logic ---
  const getCalculation = () => {
    if (!selectedCardId || !selectedType || !selectedCurrency || !faceValue)
      return null;

    const amount = parseFloat(faceValue);
    if (isNaN(amount) || amount <= 0) return null;

    // Filter rates for the specific combination
    const relevantRates = selectedCardData.rates.filter(
      (r) => r.cardType === selectedType && r.currency === selectedCurrency
    );

    // Find the rate where amount fits in range [min, max]
    const matchedRate = relevantRates.find(
      (r) => amount >= parseFloat(r.min) && amount <= parseFloat(r.max)
    );

    if (!matchedRate) {
      // Find what the valid ranges are to help the user
      const ranges = relevantRates.map((r) => `${r.min}-${r.max}`).join(", ");
      return {
        error: `Amount must be between: ${ranges || "N/A"}`,
      };
    }

    return {
      rate: matchedRate.rate,
      payout: amount * matchedRate.rate,
      tag:
        matchedRate.rateTag ||
        (matchedRate.rate > 0 ? "Active" : "Unavailable"),
      min: matchedRate.min,
      max: matchedRate.max,
    };
  };

  const calculation = getCalculation();
  const isValid = calculation && !calculation.error && cardImages.length > 0;

  // --- 5. Image Handling ---
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (cardImages.length + files.length > MAX_IMAGES) {
      toast({
        title: "Limit Exceeded",
        description: `Max ${MAX_IMAGES} images.`,
        variant: "destructive",
      });
      return;
    }

    const validFiles = [];
    const validPreviews = [];

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "Too Large",
          description: `${file.name} is over 5MB.`,
          variant: "destructive",
        });
        return;
      }
      validFiles.push(file);

      const reader = new FileReader();
      reader.onload = (ev) => {
        validPreviews.push({ id: Math.random(), url: ev.target.result });
        if (validPreviews.length === files.length) {
          setImagePreviews((prev) => [...prev, ...validPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (validFiles.length > 0)
      setCardImages((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index) => {
    setCardImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // --- 6. Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || !user) return;
    setIsSubmitting(true);
    setFormState({});

    try {
      // Create Base Record
      const submissionData = {
        userId: user.uid,
        giftCardId: selectedCardId,
        giftCardName: selectedCardData.name,
        cardType: selectedType,
        currency: selectedCurrency,
        faceValue: parseFloat(faceValue),
        ratePerUnit: calculation.rate,
        payoutNaira: calculation.payout,
        limitRange: `${calculation.min}-${calculation.max}`,
        cardCode: cardCode || null,
        status: "pending",
        submittedAt: new Date().toISOString(),
        imageCount: cardImages.length,
        imageUrls: [],
      };

      const docRef = await addDoc(
        collection(firestore, "giftCardSubmissions"),
        submissionData
      );

      // Upload Images
      const uploadPromises = cardImages.map(async (file, i) => {
        const storagePath = `gift-cards/${user.uid}/${
          docRef.id
        }/${Date.now()}_${i}`;
        const storageRef = ref(storage, storagePath);
        const snap = await uploadBytes(storageRef, file);
        return getDownloadURL(snap.ref);
      });

      const imageUrls = await Promise.all(uploadPromises);

      // Update Record with Images
      await updateDoc(doc(firestore, "giftCardSubmissions", docRef.id), {
        imageUrls,
      });

      // Create Transaction Record
      await addDoc(collection(firestore, "users", user.uid, "transactions"), {
        userId: user.uid,
        description: `Sold ${selectedCardData.name} ${selectedCurrency}${faceValue}`,
        amount: calculation.payout,
        type: "credit",
        status: "Pending",
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString(),
        relatedSubmissionId: docRef.id,
        relatedSubmissionType: "giftCard",
      });

      // Send Notification (Fire & Forget)
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      fetch("/api/giftcard-notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submissionData,
          submissionId: docRef.id,
          userEmail: userDoc.data()?.email,
          imageCount: imageUrls.length,
        }),
      }).catch((err) => console.error("Notify Error", err));

      // Success Reset
      setFormState({
        message:
          "Trade submitted successfully! Your order will be processed shortly.",
      });
      setFaceValue("");
      setCardCode("");
      setCardImages([]);
      setImagePreviews([]);
    } catch (err) {
      console.error(err);
      setFormState({
        message: "Submission failed. Please try again.",
        errors: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <div>
        <h1 className="text-3xl font-bold font-headline">Trade Gift Cards</h1>
        <p className="text-muted-foreground">
          Sell your gift cards instantly for cash.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sell Gift Card</CardTitle>
          <CardDescription>
            Select your card details to see the current rate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Card Selection */}
            <div className="space-y-2">
              <Label>Gift Card Brand</Label>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Brand" />
                </SelectTrigger>
                <SelectContent>
                  {giftCards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2. Type Selection (Dependent on Card) */}
              <div className="space-y-2">
                <Label>Card Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={setSelectedType}
                  disabled={!selectedCardId || availableTypes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedCardId ? "Select Brand First" : "Select Type"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Currency Selection (Dependent on Type) */}
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={setSelectedCurrency}
                  disabled={!selectedType || availableCurrencies.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedType ? "Select Type First" : "Select Currency"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 4. Amount Input */}
            <div className="space-y-2">
              <Label>
                Amount {selectedCurrency ? `(${selectedCurrency})` : ""}
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                value={faceValue}
                onChange={(e) => setFaceValue(e.target.value)}
                min="0"
                step="0.01"
                disabled={!selectedCurrency}
              />
            </div>

            {/* 5. Live Rate Display */}
            <div className="min-h-[100px]">
              {selectedCardId &&
                selectedType &&
                selectedCurrency &&
                faceValue && (
                  <div className="transition-all duration-300">
                    {calculation && !calculation.error ? (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800 font-semibold">
                          Offer Available
                        </AlertTitle>
                        <AlertDescription className="text-green-900 mt-2">
                          <div className="flex flex-col gap-1">
                            <div className="text-3xl font-bold">
                              ₦
                              {calculation.payout.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-sm font-medium opacity-80">
                              Rate: ₦{calculation.rate} / {selectedCurrency}
                            </div>
                            {calculation.tag && (
                              <Badge
                                variant="outline"
                                className="w-fit bg-white border-green-300 text-green-700 mt-1"
                              >
                                {calculation.tag}
                              </Badge>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ) : calculation?.error ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Invalid Amount</AlertTitle>
                        <AlertDescription>{calculation.error}</AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                )}
            </div>

            {/* 6. Card Code & Uploads */}
            <div className="space-y-2">
              <Label>E-code / Card details (Optional)</Label>
              <Input
                value={cardCode}
                onChange={(e) => setCardCode(e.target.value)}
                placeholder="Enter code here if applicable"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Upload Images <span className="text-red-500">*</span>
              </Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition cursor-pointer border-slate-300"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-slate-400" />
                  <div className="text-sm font-medium">
                    Click to Upload Images ({cardImages.length}/{MAX_IMAGES})
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Receipts, Physical Cards, Screenshots (Max 5MB)
                  </div>
                </div>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3">
                  {imagePreviews.map((p, i) => (
                    <div
                      key={p.id}
                      className="relative group rounded overflow-hidden border"
                    >
                      <img
                        src={p.url}
                        className="w-full h-20 object-cover"
                        alt="preview"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-0 right-0 p-1 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Submit Trade"
              )}
            </Button>

            {formState.message && (
              <Alert variant={formState.errors ? "destructive" : "default"}>
                <Info className="h-4 w-4" />
                <AlertDescription>{formState.message}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
