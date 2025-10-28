"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Lightbulb, Loader, Upload, X, Plus } from "lucide-react";
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
import { CheckCircle, AlertTriangle } from "lucide-react";

const CURRENCIES = [
  "USD",
  "GBP",
  "EUR",
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

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedCard, setSelectedCard] = useState("");
  const [faceValue, setFaceValue] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [cardCode, setCardCode] = useState("");
  const [cardImages, setCardImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({});
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const router = useRouter();

  const MAX_IMAGES = 10;

  // Auth check
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

  // Fetch gift card rates
  useEffect(() => {
    if (!authChecked || !user) return;

    async function fetchRates() {
      try {
        const snapshot = await getDocs(collection(firestore, "giftCardRates"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || doc.id,
          currencies: doc.data().currencies || {},
          min: doc.data().min || 10,
          max: doc.data().max || 1000,
        }));
        setGiftCards(data);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load gift card rates.",
          variant: "destructive",
        });
      }
    }
    fetchRates();
  }, [authChecked, user, toast]);

  const selectedCardData = giftCards.find((c) => c.id === selectedCard);
  const ratePerUnit = selectedCardData?.currencies?.[currency] || 0;
  const payoutNaira =
    faceValue && ratePerUnit ? parseFloat(faceValue) * ratePerUnit : 0;

  const isValid =
    selectedCard &&
    faceValue &&
    parseFloat(faceValue) > 0 &&
    cardImages.length > 0;

  // Image handling
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (cardImages.length + files.length > MAX_IMAGES) {
      toast({
        title: "Too Many",
        description: `Max ${MAX_IMAGES} images.`,
        variant: "destructive",
      });
      return;
    }

    const validFiles = [];
    const validPreviews = [];
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    const maxSize = 5 * 1024 * 1024;

    files.forEach((file) => {
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid Type",
          description: `${file.name} not supported.`,
          variant: "destructive",
        });
        return;
      }
      if (file.size > maxSize) {
        toast({
          title: "Too Large",
          description: `${file.name} > 5MB.`,
          variant: "destructive",
        });
        return;
      }
      validFiles.push(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        validPreviews.push({
          id: Date.now() + Math.random(),
          url: ev.target.result,
          name: file.name,
        });
        if (validPreviews.length === files.length)
          setImagePreviews((p) => [...p, ...validPreviews]);
      };
      reader.readAsDataURL(file);
    });

    if (validFiles.length > 0) setCardImages((p) => [...p, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (i) => {
    setCardImages((p) => p.filter((_, idx) => idx !== i));
    setImagePreviews((p) => p.filter((_, idx) => idx !== i));
  };

  // Upload images
  const uploadImages = async (files, userId, submissionId) => {
    const promises = files.map(async (file, i) => {
      const name = `${Date.now()}_${i}_${file.name}`;
      const storageRef = ref(
        storage,
        `gift-cards/${userId}/${submissionId}/${name}`
      );
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      return { url, name, uploadedAt: new Date().toISOString() };
    });
    return Promise.all(promises);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || !user) return;

    setIsSubmitting(true);
    try {
      const submission = {
        userId: user.uid,
        giftCardId: selectedCard,
        giftCardName: selectedCardData.name,
        faceValue: parseFloat(faceValue),
        currency,
        cardCode: cardCode || null,
        payoutNaira,
        ratePerUnit,
        status: "pending",
        submittedAt: new Date().toISOString(),
        imageUrls: [],
        imageCount: cardImages.length,
      };

      const docRef = await addDoc(
        collection(firestore, "giftCardSubmissions"),
        submission
      );
      const imageUrls = await uploadImages(cardImages, user.uid, docRef.id);
      await updateDoc(doc(firestore, "giftCardSubmissions", docRef.id), {
        imageUrls,
      });

      await addDoc(collection(firestore, "users", user.uid, "transactions"), {
        userId: user.uid,
        description: `${selectedCardData.name} ${currency} ${faceValue} gift card`,
        amount: payoutNaira,
        type: "credit",
        status: "Pending",
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString(),
        relatedSubmissionId: docRef.id,
        relatedSubmissionType: "giftCard",
      });

      // Send notification
      try {
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        await fetch("/api/giftcard-notify-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: docRef.id,
            giftCardName: selectedCardData.name,
            faceValue: parseFloat(faceValue),
            rate: ratePerUnit,
            payoutNaira,
            userId: user.uid,
            userEmail: userDoc.data()?.email,
            imageCount: cardImages.length,
          }),
        });
      } catch (err) {
        console.error("Notification failed:", err);
      }

      setFormState({ message: "Submitted for verification (15–30 mins)." });
      setSelectedCard("");
      setFaceValue("");
      setCurrency("USD");
      setCardCode("");
      setCardImages([]);
      setImagePreviews([]);
    } catch (err) {
      setFormState({ message: "Submission failed.", errors: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toast on formState change
  useEffect(() => {
    if (formState.message) {
      toast({
        title: formState.errors ? "Failed" : "Success",
        description: formState.message,
        variant: formState.errors ? "destructive" : "default",
      });
    }
  }, [formState, toast]);

  if (!authChecked)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-8 mt-4">
      <div>
        <h1 className="text-3xl font-bold font-headline">Trade Gift Cards</h1>
        <p className="text-muted-foreground mt-2">
          Submit gift card details for wallet payout. Processing: 15–30 mins.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gift Card Details</CardTitle>
          <CardDescription>All submissions manually verified.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Gift Card Type</Label>
              <Select value={selectedCard} onValueChange={setSelectedCard}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Face Value</Label>
                <Input
                  type="number"
                  value={faceValue}
                  onChange={(e) => setFaceValue(e.target.value)}
                  placeholder="e.g. 100"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Select Currency</Label>
                <Select
                  value={currency}
                  onValueChange={setCurrency}
                  disabled={!selectedCard}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedCard && faceValue && ratePerUnit > 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Payout</AlertTitle>
                <AlertDescription>
                  You will receive:{" "}
                  <strong>
                    ₦
                    {payoutNaira.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                  <br />
                  Rate: 1 {currency} = ₦{ratePerUnit.toLocaleString()}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Card Code (Optional)</Label>
              <Input
                value={cardCode}
                onChange={(e) => setCardCode(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label>Card Images (Max {MAX_IMAGES})</Label>
              {cardImages.length < MAX_IMAGES && (
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" /> Upload (
                    {cardImages.length}/{MAX_IMAGES})
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, GIF ≤ 5MB
                  </p>
                </div>
              )}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((p, i) => (
                    <div key={p.id} className="relative border rounded">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <img
                        src={p.url}
                        alt=""
                        className="w-full h-24 object-cover rounded"
                      />
                      <p className="text-xs truncate px-1">{p.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? <>Submitting...</> : "Submit"}
            </Button>

            {formState.message && (
              <Alert variant={formState.errors ? "destructive" : "default"}>
                {formState.errors ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {formState.errors ? "Failed" : "Success"}
                </AlertTitle>
                <AlertDescription>{formState.message}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="bg-primary/10 hidden border-l-4 border-primary p-4 rounded-md">
        <div className="flex">
          <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
          <div className="ml-3">
            <p className="text-sm">
              AI fraud detection may flag unusual transactions for manual
              review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
