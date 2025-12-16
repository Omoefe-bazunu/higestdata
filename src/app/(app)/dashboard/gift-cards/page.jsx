// "use client";

// import { useState, useEffect, useRef } from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Lightbulb, Loader, Upload, X, Plus } from "lucide-react";
// import {
//   collection,
//   getDocs,
//   addDoc,
//   updateDoc,
//   doc,
//   getDoc,
// } from "firebase/firestore";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { firestore, storage } from "@/lib/firebaseConfig";
// import { useToast } from "@/hooks/use-toast";
// import { getAuth } from "firebase/auth";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { CheckCircle, AlertTriangle } from "lucide-react";

// export default function GiftCardsPage() {
//   const [giftCards, setGiftCards] = useState([]);
//   const [currencies, setCurrencies] = useState([]);
//   const [authChecked, setAuthChecked] = useState(false);
//   const [user, setUser] = useState(null);
//   const [selectedCard, setSelectedCard] = useState("");
//   const [faceValue, setFaceValue] = useState("");
//   const [currency, setCurrency] = useState("");
//   const [cardCode, setCardCode] = useState("");
//   const [cardImages, setCardImages] = useState([]);
//   const [imagePreviews, setImagePreviews] = useState([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [formState, setFormState] = useState({});
//   const fileInputRef = useRef(null);
//   const { toast } = useToast();
//   const router = useRouter();

//   const MAX_IMAGES = 10;

//   // Auth check
//   useEffect(() => {
//     const auth = getAuth();
//     const unsub = auth.onAuthStateChanged((usr) => {
//       if (usr) {
//         setUser(usr);
//         setAuthChecked(true);
//       } else {
//         router.replace("/login");
//       }
//     });
//     return () => unsub();
//   }, [router]);

//   // Fetch gift card rates and currencies
//   useEffect(() => {
//     if (!authChecked || !user) return;

//     async function fetchData() {
//       try {
//         // Fetch currencies from config
//         const currenciesDoc = await getDoc(
//           doc(firestore, "config", "currencies")
//         );
//         if (currenciesDoc.exists()) {
//           const currenciesList = currenciesDoc.data().list || [];
//           setCurrencies(currenciesList);
//           // Set default currency to first one if available
//           if (currenciesList.length > 0 && !currency) {
//             setCurrency(currenciesList[0]);
//           }
//         }

//         // Fetch gift card rates with limits
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
//         setGiftCards(data);
//       } catch (err) {
//         toast({
//           title: "Error",
//           description: "Failed to load gift card rates.",
//           variant: "destructive",
//         });
//       }
//     }
//     fetchData();
//   }, [authChecked, user, toast]);

//   const selectedCardData = giftCards.find((c) => c.id === selectedCard);

//   // Find the appropriate limit based on face value
//   const getApplicableLimit = () => {
//     if (!selectedCardData || !faceValue) return null;
//     const value = parseFloat(faceValue);
//     if (isNaN(value)) return null;

//     // Find the limit range that contains this value
//     return selectedCardData.limits.find(
//       (limit) => value >= limit.min && value <= limit.max
//     );
//   };

//   const applicableLimit = getApplicableLimit();
//   const ratePerUnit = applicableLimit?.currencies?.[currency] || 0;
//   const payoutNaira =
//     faceValue && ratePerUnit ? parseFloat(faceValue) * ratePerUnit : 0;

//   const isValid =
//     selectedCard &&
//     faceValue &&
//     parseFloat(faceValue) > 0 &&
//     applicableLimit &&
//     cardImages.length > 0 &&
//     currency;

//   // Image handling
//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (cardImages.length + files.length > MAX_IMAGES) {
//       toast({
//         title: "Too Many",
//         description: `Max ${MAX_IMAGES} images.`,
//         variant: "destructive",
//       });
//       return;
//     }

//     const validFiles = [];
//     const validPreviews = [];
//     const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
//     const maxSize = 5 * 1024 * 1024;

//     files.forEach((file) => {
//       if (!validTypes.includes(file.type)) {
//         toast({
//           title: "Invalid Type",
//           description: `${file.name} not supported.`,
//           variant: "destructive",
//         });
//         return;
//       }
//       if (file.size > maxSize) {
//         toast({
//           title: "Too Large",
//           description: `${file.name} > 5MB.`,
//           variant: "destructive",
//         });
//         return;
//       }
//       validFiles.push(file);
//       const reader = new FileReader();
//       reader.onload = (ev) => {
//         validPreviews.push({
//           id: Date.now() + Math.random(),
//           url: ev.target.result,
//           name: file.name,
//         });
//         if (validPreviews.length === files.length)
//           setImagePreviews((p) => [...p, ...validPreviews]);
//       };
//       reader.readAsDataURL(file);
//     });

//     if (validFiles.length > 0) setCardImages((p) => [...p, ...validFiles]);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const removeImage = (i) => {
//     setCardImages((p) => p.filter((_, idx) => idx !== i));
//     setImagePreviews((p) => p.filter((_, idx) => idx !== i));
//   };

//   // Upload images
//   const uploadImages = async (files, userId, submissionId) => {
//     const promises = files.map(async (file, i) => {
//       const name = `${Date.now()}_${i}_${file.name}`;
//       const storageRef = ref(
//         storage,
//         `gift-cards/${userId}/${submissionId}/${name}`
//       );
//       const snap = await uploadBytes(storageRef, file);
//       const url = await getDownloadURL(snap.ref);
//       return { url, name, uploadedAt: new Date().toISOString() };
//     });
//     return Promise.all(promises);
//   };

//   // Submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!isValid || !user) return;

//     setIsSubmitting(true);
//     try {
//       const submission = {
//         userId: user.uid,
//         giftCardId: selectedCard,
//         giftCardName: selectedCardData.name,
//         faceValue: parseFloat(faceValue),
//         currency,
//         cardCode: cardCode || null,
//         payoutNaira,
//         ratePerUnit,
//         limitRange: applicableLimit
//           ? {
//               min: applicableLimit.min,
//               max: applicableLimit.max,
//               limitId: applicableLimit.id,
//             }
//           : null,
//         status: "pending",
//         submittedAt: new Date().toISOString(),
//         imageUrls: [],
//         imageCount: cardImages.length,
//       };

//       const docRef = await addDoc(
//         collection(firestore, "giftCardSubmissions"),
//         submission
//       );
//       const imageUrls = await uploadImages(cardImages, user.uid, docRef.id);
//       await updateDoc(doc(firestore, "giftCardSubmissions", docRef.id), {
//         imageUrls,
//       });

//       await addDoc(collection(firestore, "users", user.uid, "transactions"), {
//         userId: user.uid,
//         description: `${selectedCardData.name} ${currency} ${faceValue} gift card`,
//         amount: payoutNaira,
//         type: "credit",
//         status: "Pending",
//         date: new Date().toLocaleDateString(),
//         createdAt: new Date().toISOString(),
//         relatedSubmissionId: docRef.id,
//         relatedSubmissionType: "giftCard",
//       });

//       // Send notification
//       try {
//         const userDoc = await getDoc(doc(firestore, "users", user.uid));
//         await fetch("/api/giftcard-notify-admin", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             submissionId: docRef.id,
//             giftCardName: selectedCardData.name,
//             faceValue: parseFloat(faceValue),
//             currency: currency,
//             ratePerUnit: ratePerUnit,
//             payoutNaira,
//             userId: user.uid,
//             userEmail: userDoc.data()?.email,
//             imageCount: cardImages.length,
//           }),
//         });
//       } catch (err) {
//         console.error("Notification failed:", err);
//       }

//       setFormState({ message: "Submitted for verification (15–30 mins)." });
//       setSelectedCard("");
//       setFaceValue("");
//       setCurrency(currencies.length > 0 ? currencies[0] : "");
//       setCardCode("");
//       setCardImages([]);
//       setImagePreviews([]);
//     } catch (err) {
//       setFormState({ message: "Submission failed.", errors: true });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Toast on formState change
//   useEffect(() => {
//     if (formState.message) {
//       toast({
//         title: formState.errors ? "Failed" : "Success",
//         description: formState.message,
//         variant: formState.errors ? "destructive" : "default",
//       });
//     }
//   }, [formState, toast]);

//   if (!authChecked)
//     return (
//       <div className="flex justify-center items-center h-64">
//         <Loader className="h-8 w-8 animate-spin" />
//       </div>
//     );

//   return (
//     <div className="space-y-8 mt-4">
//       <div>
//         <h1 className="text-3xl font-bold font-headline">Trade Gift Cards</h1>
//         <p className="text-muted-foreground mt-2">
//           Submit gift card details for wallet payout. Processing: 15–30 mins.
//         </p>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>Gift Card Details</CardTitle>
//           <CardDescription>All submissions manually verified.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="space-y-2">
//               <Label>Gift Card Type</Label>
//               <Select value={selectedCard} onValueChange={setSelectedCard}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select type" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {giftCards.map((c) => (
//                     <SelectItem key={c.id} value={c.id}>
//                       {c.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label>Amount</Label>
//                 <Input
//                   type="number"
//                   value={faceValue}
//                   onChange={(e) => setFaceValue(e.target.value)}
//                   placeholder="e.g. 100"
//                   min="0"
//                   step="0.01"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label>Select Currency</Label>
//                 <Select
//                   value={currency}
//                   onValueChange={setCurrency}
//                   disabled={!selectedCard || currencies.length === 0}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select currency" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {currencies.map((c) => (
//                       <SelectItem key={c} value={c}>
//                         {c}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             {selectedCard &&
//               faceValue &&
//               ratePerUnit > 0 &&
//               applicableLimit && (
//                 <Alert className="bg-green-50 border-green-200">
//                   <CheckCircle className="h-4 w-4 text-green-600" />
//                   <AlertTitle>Payout</AlertTitle>
//                   <AlertDescription>
//                     You will receive:{" "}
//                     <strong>
//                       ₦
//                       {payoutNaira.toLocaleString(undefined, {
//                         minimumFractionDigits: 2,
//                       })}
//                     </strong>
//                     <br />
//                     Rate: 1 {currency} = ₦{ratePerUnit.toLocaleString()}
//                     <br />
//                     <span className="text-xs text-muted-foreground">
//                       Range: {applicableLimit.min} - {applicableLimit.max}
//                     </span>
//                   </AlertDescription>
//                 </Alert>
//               )}

//             {selectedCard &&
//               faceValue &&
//               parseFloat(faceValue) > 0 &&
//               !applicableLimit && (
//                 <Alert className="bg-yellow-50 border-yellow-200">
//                   <AlertTriangle className="h-4 w-4 text-yellow-600" />
//                   <AlertTitle>Invalid Amount</AlertTitle>
//                   <AlertDescription>
//                     The amount you entered doesn't match any available rate
//                     range for this card.
//                     <br />
//                     <span className="text-xs">
//                       Available ranges:{" "}
//                       {selectedCardData?.limits
//                         .map((l) => `${l.min}-${l.max}`)
//                         .join(", ")}
//                     </span>
//                   </AlertDescription>
//                 </Alert>
//               )}

//             <div className="space-y-2">
//               <Label>Card Code (Optional)</Label>
//               <Input
//                 value={cardCode}
//                 onChange={(e) => setCardCode(e.target.value)}
//                 placeholder="XXXX-XXXX-XXXX-XXXX"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>Card Images (Max {MAX_IMAGES})</Label>
//               {cardImages.length < MAX_IMAGES && (
//                 <div className="border-2 border-dashed rounded-lg p-4 text-center">
//                   <input
//                     ref={fileInputRef}
//                     type="file"
//                     accept="image/*"
//                     multiple
//                     onChange={handleImageChange}
//                     className="hidden"
//                   />
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => fileInputRef.current?.click()}
//                     className="w-full"
//                   >
//                     <Upload className="h-4 w-4 mr-2" /> Upload (
//                     {cardImages.length}/{MAX_IMAGES})
//                   </Button>
//                   <p className="text-xs text-muted-foreground mt-1">
//                     JPG, PNG, GIF ≤ 5MB
//                   </p>
//                 </div>
//               )}
//               {imagePreviews.length > 0 && (
//                 <div className="grid grid-cols-3 gap-2">
//                   {imagePreviews.map((p, i) => (
//                     <div key={p.id} className="relative border rounded">
//                       <Button
//                         type="button"
//                         size="icon"
//                         variant="ghost"
//                         className="absolute top-1 right-1 h-6 w-6"
//                         onClick={() => removeImage(i)}
//                       >
//                         <X className="h-3 w-3" />
//                       </Button>
//                       <img
//                         src={p.url}
//                         alt=""
//                         className="w-full h-24 object-cover rounded"
//                       />
//                       <p className="text-xs truncate px-1">{p.name}</p>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <Button
//               type="submit"
//               className="w-full"
//               disabled={!isValid || isSubmitting}
//             >
//               {isSubmitting ? <>Submitting...</> : "Submit"}
//             </Button>

//             {formState.message && (
//               <Alert variant={formState.errors ? "destructive" : "default"}>
//                 {formState.errors ? (
//                   <AlertTriangle className="h-4 w-4" />
//                 ) : (
//                   <CheckCircle className="h-4 w-4" />
//                 )}
//                 <AlertTitle>
//                   {formState.errors ? "Failed" : "Success"}
//                 </AlertTitle>
//                 <AlertDescription>{formState.message}</AlertDescription>
//               </Alert>
//             )}
//           </form>
//         </CardContent>
//       </Card>

//       <div className="bg-primary/10 hidden border-l-4 border-primary p-4 rounded-md">
//         <div className="flex">
//           <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
//           <div className="ml-3">
//             <p className="text-sm">
//               AI fraud detection may flag unusual transactions for manual
//               review.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Lightbulb, Loader, Upload, X, Plus, AlertCircle } from "lucide-react";
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
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [cardTypes, setCardTypes] = useState([]);
  const [globalLimits, setGlobalLimits] = useState([]);

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  // Form State
  const [selectedCardId, setSelectedCardId] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [selectedType, setSelectedType] = useState("");
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

  // 1. Auth Check
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

  // 2. Fetch Data (Cards + Global Configs)
  useEffect(() => {
    if (!authChecked || !user) return;

    async function fetchData() {
      try {
        // Fetch Configs
        const [currDoc, typeDoc, limitDoc] = await Promise.all([
          getDoc(doc(firestore, "config", "currencies")),
          getDoc(doc(firestore, "config", "card_types")),
          getDoc(doc(firestore, "config", "global_limits")),
        ]);

        const loadedCurrencies = currDoc.exists()
          ? currDoc.data().list
          : ["USD"];
        setCurrencies(loadedCurrencies);
        if (loadedCurrencies.length > 0)
          setSelectedCurrency(loadedCurrencies[0]);

        const loadedTypes = typeDoc.exists()
          ? typeDoc.data().list
          : ["Physical", "E-code"];
        setCardTypes(loadedTypes);
        if (loadedTypes.length > 0) setSelectedType(loadedTypes[0]);

        setGlobalLimits(limitDoc.exists() ? limitDoc.data().list : []);

        // Fetch Cards
        const snapshot = await getDocs(collection(firestore, "giftCardRates"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || doc.id,
          rates: doc.data().rates || {}, // Structure: [limitId][typeId][currency] -> {rate, tag}
        }));
        setGiftCards(data);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load data.",
          variant: "destructive",
        });
      }
    }
    fetchData();
  }, [authChecked, user, toast]);

  // 3. Logic: Find Applicable Rate
  const getCalculation = () => {
    if (!selectedCardId || !faceValue || !selectedType || !selectedCurrency)
      return null;

    const amount = parseFloat(faceValue);
    if (isNaN(amount) || amount <= 0) return null;

    // A. Find the global limit range that matches the amount
    const matchedLimit = globalLimits.find(
      (l) => amount >= l.min && amount <= l.max
    );

    if (!matchedLimit)
      return { error: "Amount not within any accepted limit range." };

    // B. Get the card data
    const card = giftCards.find((c) => c.id === selectedCardId);
    if (!card) return { error: "Card not found." };

    // C. Dig into the rates matrix
    // Path: card.rates -> [limitId] -> [type] -> [currency]
    const rateData =
      card.rates?.[matchedLimit.id]?.[selectedType]?.[selectedCurrency];

    if (!rateData || !rateData.rate || rateData.rate <= 0) {
      return { error: "No rate available for this combination." };
    }

    return {
      rate: rateData.rate,
      tag: rateData.tag,
      payout: amount * rateData.rate,
      limitRange: `${matchedLimit.min}-${matchedLimit.max}`,
    };
  };

  const calculation = getCalculation();
  const isValid = calculation && !calculation.error && cardImages.length > 0;
  const selectedCardData = giftCards.find((c) => c.id === selectedCardId);

  // --- Image Handlers (Standard) ---
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

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
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
          id: Math.random(),
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

  // --- Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || !user) return;
    setIsSubmitting(true);

    try {
      // 1. Create base submission doc
      const submission = {
        userId: user.uid,
        giftCardId: selectedCardId,
        giftCardName: selectedCardData.name,
        cardType: selectedType, // Physical/E-code
        faceValue: parseFloat(faceValue),
        currency: selectedCurrency,
        ratePerUnit: calculation.rate,
        payoutNaira: calculation.payout,
        rateTag: calculation.tag || null,
        limitRange: calculation.limitRange,
        cardCode: cardCode || null,
        status: "pending",
        submittedAt: new Date().toISOString(),
        imageCount: cardImages.length,
        imageUrls: [], // Placeholder
      };

      const docRef = await addDoc(
        collection(firestore, "giftCardSubmissions"),
        submission
      );

      // 2. Upload Images
      const uploadPromises = cardImages.map(async (file, i) => {
        const name = `${docRef.id}_${i}_${file.name}`;
        const storageRef = ref(
          storage,
          `gift-cards/${user.uid}/${docRef.id}/${name}`
        );
        const snap = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snap.ref);
        return { url, name, uploadedAt: new Date().toISOString() };
      });
      const imageUrls = await Promise.all(uploadPromises);

      // 3. Update doc with images
      await updateDoc(doc(firestore, "giftCardSubmissions", docRef.id), {
        imageUrls,
      });

      // 4. Create Transaction Record
      await addDoc(collection(firestore, "users", user.uid, "transactions"), {
        userId: user.uid,
        description: `${selectedCardData.name} (${selectedType}) ${selectedCurrency}${faceValue}`,
        amount: calculation.payout,
        type: "credit",
        status: "Pending",
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString(),
        relatedSubmissionId: docRef.id,
        relatedSubmissionType: "giftCard",
      });

      // 5. Notify Admin (API call omitted for brevity, standard fetch)
      try {
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        await fetch("/api/giftcard-notify-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...submission,
            userEmail: userDoc.data()?.email,
            submissionId: docRef.id,
          }),
        });
      } catch (e) {
        console.error("Notify failed", e);
      }

      setFormState({ message: "Submitted successfully!" });

      // Reset Form
      setFaceValue("");
      setCardCode("");
      setCardImages([]);
      setImagePreviews([]);
    } catch (err) {
      console.error(err);
      setFormState({ message: "Submission failed.", errors: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authChecked)
    return (
      <div className="flex justify-center p-12">
        <Loader className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6 mt-4">
      <div>
        <h1 className="text-3xl font-bold font-headline">Trade Gift Cards</h1>
        <p className="text-muted-foreground">
          Select your card configuration to see live rates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sell Gift Card</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Card Selection */}
            <div className="space-y-2">
              <Label>Gift Card Brand</Label>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Brand (e.g. Apple)" />
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
              {/* 2. Currency */}
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={setSelectedCurrency}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Card Type (Physical/Ecode) */}
              <div className="space-y-2">
                <Label>Card Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cardTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 4. Amount */}
            <div className="space-y-2">
              <Label>Amount ({selectedCurrency})</Label>
              <Input
                type="number"
                placeholder="e.g. 100"
                value={faceValue}
                onChange={(e) => setFaceValue(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            {/* 5. Live Calculation Feedback */}
            {selectedCardId && faceValue && (
              <div className="transition-all duration-300">
                {calculation && !calculation.error ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">
                      Offer Available
                    </AlertTitle>
                    <AlertDescription className="text-green-900 mt-2">
                      <div className="flex flex-col gap-1">
                        <div className="text-2xl font-bold">
                          ₦
                          {calculation.payout.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-sm">
                          Rate: ₦{calculation.rate} / {selectedCurrency}
                        </div>
                        {calculation.tag && (
                          <Badge
                            variant="outline"
                            className="w-fit bg-white text-xs mt-1 border-green-300 text-green-700"
                          >
                            {calculation.tag}
                          </Badge>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : calculation && calculation.error ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Rate Unavailable</AlertTitle>
                    <AlertDescription>{calculation.error}</AlertDescription>
                  </Alert>
                ) : null}
              </div>
            )}

            {/* 6. Uploads & Code */}
            <div className="space-y-2">
              <Label>Card Code (Optional)</Label>
              <Input
                value={cardCode}
                onChange={(e) => setCardCode(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label>Card Images (Required)</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition cursor-pointer"
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
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Click to Upload Images ({cardImages.length}/{MAX_IMAGES})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, GIF up to 5MB
                  </span>
                </div>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                  {imagePreviews.map((p, i) => (
                    <div key={p.id} className="relative group">
                      <img
                        src={p.url}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
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
              className="w-full h-12 text-lg"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? "Processing..." : "Submit Trade"}
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
