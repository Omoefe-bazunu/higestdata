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
  ChevronLeft,
  DollarSign,
  Image as ImageIcon,
  Zap,
  ArrowRight,
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
import Link from "next/link";
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
import { Separator } from "@/components/ui/separator";

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  const [selectedCardId, setSelectedCardId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [faceValue, setFaceValue] = useState("");
  const [cardCode, setCardCode] = useState("");

  const [cardImages, setCardImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({});

  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const router = useRouter();
  const MAX_IMAGES = 10;

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

  useEffect(() => {
    if (!authChecked || !user) return;
    async function fetchData() {
      try {
        const snapshot = await getDocs(collection(firestore, "giftCardRates"));
        const data = snapshot.docs.map((doc) => {
          const rawData = doc.data();
          let cleanRates = [];
          if (Array.isArray(rawData.rates)) {
            cleanRates = rawData.rates;
          } else if (rawData.rates && typeof rawData.rates === "object") {
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
          description: "Failed to load gift cards.",
          variant: "destructive",
        });
      }
    }
    fetchData();
  }, [authChecked, user, toast]);

  const selectedCardData = useMemo(
    () => giftCards.find((c) => c.id === selectedCardId),
    [giftCards, selectedCardId],
  );

  const availableTypes = useMemo(() => {
    if (!selectedCardData?.rates) return [];
    const types = new Set(
      selectedCardData.rates.map((r) => r.cardType).filter(Boolean),
    );
    return Array.from(types);
  }, [selectedCardData]);

  useEffect(() => {
    if (selectedType && !availableTypes.includes(selectedType)) {
      setSelectedType("");
      setSelectedCurrency("");
    }
  }, [selectedCardId, availableTypes]);

  const availableCurrencies = useMemo(() => {
    if (!selectedCardData?.rates || !selectedType) return [];
    const currs = new Set(
      selectedCardData.rates
        .filter((r) => r.cardType === selectedType)
        .map((r) => r.currency)
        .filter(Boolean),
    );
    return Array.from(currs);
  }, [selectedCardData, selectedType]);

  useEffect(() => {
    if (selectedCurrency && !availableCurrencies.includes(selectedCurrency)) {
      setSelectedCurrency("");
    }
  }, [selectedType, availableCurrencies]);

  const getCalculation = () => {
    if (!selectedCardId || !selectedType || !selectedCurrency || !faceValue)
      return null;
    const amount = parseFloat(faceValue);
    if (isNaN(amount) || amount <= 0) return null;
    const relevantRates = selectedCardData.rates.filter(
      (r) => r.cardType === selectedType && r.currency === selectedCurrency,
    );
    const matchedRate = relevantRates.find(
      (r) => amount >= parseFloat(r.min) && amount <= parseFloat(r.max),
    );
    if (!matchedRate) {
      const ranges = relevantRates.map((r) => `${r.min}-${r.max}`).join(", ");
      return { error: `Amount must be between: ${ranges || "N/A"}` };
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
        submissionData,
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
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader className="h-10 w-10 animate-spin text-blue-950" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          <Link
            href="/dashboard/tools"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-950 group"
          >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />{" "}
            Back to Services
          </Link>
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-blue-950 font-headline">
              Trade Gift <span className="text-orange-400">Cards</span>
            </h1>
            <p className="mt-1 text-slate-600">
              Turn your unused gift cards into instant Naira in your wallet.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main Form Section */}
          <div className="lg:col-span-3">
            <Card className="border-none shadow-2xl ring-1 ring-slate-200 overflow-hidden bg-white">
              <CardHeader className="bg-blue-950 text-white pb-8">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-400" /> Card Details
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Select your card brand and type to view live rates.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 -mt-4 bg-white rounded-t-3xl space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Brand Selection */}
                  <div className="space-y-2">
                    <Label className="text-blue-950 font-bold">
                      Gift Card Brand
                    </Label>
                    <Select
                      value={selectedCardId}
                      onValueChange={setSelectedCardId}
                    >
                      <SelectTrigger className="h-12 border-slate-200 focus:ring-blue-950">
                        <SelectValue placeholder="Select Brand (e.g. iTunes, Amazon)" />
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-blue-950 font-bold">
                        Card Type
                      </Label>
                      <Select
                        value={selectedType}
                        onValueChange={setSelectedType}
                        disabled={
                          !selectedCardId || availableTypes.length === 0
                        }
                      >
                        <SelectTrigger className="h-12 border-slate-200">
                          <SelectValue
                            placeholder={
                              !selectedCardId
                                ? "Select Brand First"
                                : "Select Type"
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

                    <div className="space-y-2">
                      <Label className="text-blue-950 font-bold">
                        Currency
                      </Label>
                      <Select
                        value={selectedCurrency}
                        onValueChange={setSelectedCurrency}
                        disabled={
                          !selectedType || availableCurrencies.length === 0
                        }
                      >
                        <SelectTrigger className="h-12 border-slate-200">
                          <SelectValue
                            placeholder={
                              !selectedType
                                ? "Select Type First"
                                : "Select Currency"
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

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label className="text-blue-950 font-bold flex justify-between">
                      Face Value{" "}
                      {selectedCurrency && (
                        <span className="text-orange-400">
                          ({selectedCurrency})
                        </span>
                      )}
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="h-12 pl-10 border-slate-200 focus:ring-blue-950"
                        value={faceValue}
                        onChange={(e) => setFaceValue(e.target.value)}
                        disabled={!selectedCurrency}
                      />
                    </div>
                  </div>

                  {/* Rate & Payout Display */}
                  <div className="min-h-[100px] animate-in fade-in slide-in-from-top-2">
                    {calculation && !calculation.error ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-inner">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                              Expected Payout
                            </p>
                            <h2 className="text-3xl font-black text-blue-950 tracking-tighter">
                              ₦
                              {calculation.payout.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </h2>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-green-200 font-bold px-3 py-1">
                            {calculation.tag}
                          </Badge>
                        </div>
                        <Separator className="bg-slate-200 mb-4" />
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 font-medium">
                            Exchange Rate:
                          </span>
                          <span className="text-blue-950 font-bold">
                            ₦{calculation.rate} / {selectedCurrency}
                          </span>
                        </div>
                      </div>
                    ) : calculation?.error ? (
                      <Alert
                        variant="destructive"
                        className="bg-red-50 border-red-200 text-red-800"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="font-bold">
                          Outside Range
                        </AlertTitle>
                        <AlertDescription>{calculation.error}</AlertDescription>
                      </Alert>
                    ) : null}
                  </div>

                  <Separator className="bg-slate-100" />

                  {/* Security & Code */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-blue-950 font-bold">
                        E-code / Card Details (Optional)
                      </Label>
                      <Input
                        value={cardCode}
                        onChange={(e) => setCardCode(e.target.value)}
                        placeholder="Type details here if no image..."
                        className="h-12 border-slate-200"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-blue-950 font-bold flex items-center gap-2">
                        Upload Card Image(s){" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div
                        className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-orange-400 hover:bg-orange-50/30 transition-all cursor-pointer group"
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
                        <div className="flex flex-col items-center gap-3">
                          <div className="bg-slate-100 p-3 rounded-full group-hover:bg-orange-100 transition-colors">
                            <Upload className="h-6 w-6 text-slate-400 group-hover:text-orange-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-blue-950">
                              Click to upload files
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Receipts, Cards, or Screenshots (
                              {cardImages.length}/{MAX_IMAGES})
                            </p>
                          </div>
                        </div>
                      </div>

                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                          {imagePreviews.map((p, i) => (
                            <div
                              key={p.id}
                              className="relative group rounded-xl overflow-hidden aspect-square border-2 border-slate-100 shadow-sm"
                            >
                              <img
                                src={p.url}
                                className="w-full h-full object-cover"
                                alt="preview"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-bold bg-blue-950 hover:bg-blue-900 shadow-xl shadow-blue-950/10 active:scale-[0.98] transition-all"
                    disabled={isSubmitting || !isValid}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="mr-2 h-5 w-5 animate-spin" />{" "}
                        Processing Trade...
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Submit Trade</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>

                  {formState.message && (
                    <Alert
                      className={`${formState.errors ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"}`}
                    >
                      {formState.errors ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <AlertDescription className="font-medium">
                        {formState.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Guidelines Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-md ring-1 ring-slate-100 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-950 flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-orange-400" /> Trading
                  Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    1
                  </div>
                  <p>
                    Ensure the gift card is <strong>unredeemed</strong> and the
                    code is clearly visible in photos.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    2
                  </div>
                  <p>
                    If you have the <strong>purchase receipt</strong>, kindly
                    upload it alongside the card for faster verification.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    3
                  </div>
                  <p>
                    Average processing time is <strong>5-15 minutes</strong>.
                    Payments are credited directly to your wallet.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    4
                  </div>
                  <p>
                    Physical cards often carry higher rates than E-codes. Check
                    selection for accurate pricing.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-950 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 opacity-10 -mr-4 -mt-4">
                <ImageIcon className="h-24 w-24" />
              </div>
              <h4 className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-2">
                Security Note
              </h4>
              <p className="text-sm text-blue-100 leading-relaxed">
                All submissions are manually verified by our team. Fraudulent or
                already used cards will result in account suspension.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
