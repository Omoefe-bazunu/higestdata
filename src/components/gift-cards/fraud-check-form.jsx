import { useRef, useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "@/lib/firebaseConfig";
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
import {
  CheckCircle,
  AlertTriangle,
  Loader,
  Upload,
  X,
  Image,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FraudCheckForm({ giftCards, exchangeRate }) {
  const [formState, setFormState] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const formRef = useRef(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState("");
  const [faceValue, setFaceValue] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [cardImages, setCardImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isValid, setIsValid] = useState(false);

  const MAX_IMAGES = 10;

  // Check authentication status
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsAuthenticated(!!user);
      console.log("Auth status:", user ? `User ${user.uid}` : "No user");
    });
    return () => unsubscribe();
  }, []);

  const selectedCardData = giftCards.find((card) => card.id === selectedCard);
  const rate = selectedCardData ? selectedCardData.rate : 0;
  const payoutNaira =
    faceValue && rate && exchangeRate
      ? (parseFloat(faceValue) * rate * exchangeRate) / 100
      : 0;

  // Validate form inputs (cardCode is now optional)
  useEffect(() => {
    const valid =
      selectedCard &&
      faceValue &&
      parseFloat(faceValue) > 0 &&
      cardImages.length > 0;
    setIsValid(valid);
  }, [selectedCard, faceValue, cardImages]);

  // Handle multiple image selection
  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);

    if (cardImages.length + files.length > MAX_IMAGES) {
      toast({
        title: "Too Many Images",
        description: `You can upload a maximum of ${MAX_IMAGES} images. Currently you have ${cardImages.length} image(s).`,
        variant: "destructive",
      });
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validFiles = [];
    const validPreviews = [];

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `File "${file.name}" is not a valid image type. Please upload JPG, PNG, or GIF files.`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `File "${file.name}" is larger than 5MB. Please choose a smaller file.`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            url: e.target.result,
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    if (validFiles.length > 0) {
      setCardImages((prev) => [...prev, ...validFiles]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove specific image
  const removeImage = (index) => {
    setCardImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle submission feedback
  useEffect(() => {
    if (formState.message) {
      toast({
        title: formState.errors ? "Submission Failed" : "Submission Received",
        description: formState.errors
          ? formState.message
          : `${formState.message} Your request will be manually verified within 15–30 minutes.`,
        variant: formState.errors ? "destructive" : "default",
      });
      if (!formState.errors) {
        setSelectedCard("");
        setFaceValue("");
        setCardCode("");
        setCardImages([]);
        setImagePreviews([]);
        formRef.current?.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
    if (formState.errors) {
      console.log("Form submission errors:", formState.errors);
    }
  }, [formState, toast]);

  // Upload multiple images to Firebase Storage
  const uploadImages = async (files, userId, submissionId) => {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${index}_${file.name}`;
        const storageRef = ref(
          storage,
          `gift-cards/${userId}/${submissionId}/${fileName}`
        );
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return {
          url: downloadURL,
          name: file.name,
          uploadedAt: new Date().toISOString(),
        };
      });

      const imageUrls = await Promise.all(uploadPromises);
      return imageUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw error;
    }
  };

  // Send email notification function
  const sendAdminNotification = async (submissionData) => {
    try {
      const userDocRef = doc(firestore, "users", submissionData.userId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists() || !userDoc.data().email) {
        console.error("User email not found");
        return;
      }
      const userEmail = userDoc.data().email;

      const response = await fetch("/api/giftcard-notify-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: submissionData.submissionId,
          giftCardName: submissionData.giftCardName,
          faceValue: submissionData.faceValue,
          rate: submissionData.rate,
          payoutNaira: submissionData.payoutNaira,
          userId: submissionData.userId,
          userEmail,
          imageCount: submissionData.imageCount,
        }),
      });

      if (!response.ok) {
        console.error("Failed to send notification");
      } else {
        console.log("Notification sent successfully");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit a gift card.",
        variant: "destructive",
      });
      return;
    }

    if (!isValid) {
      toast({
        title: "Invalid Input",
        description:
          "Please fill all required fields correctly and upload at least one card image.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const errors = {};
      if (!selectedCard) errors.cardType = ["Card type is required"];
      if (!faceValue || isNaN(faceValue) || parseFloat(faceValue) <= 0)
        errors.cardValue = ["Valid card value in USD is required"];
      if (cardImages.length === 0)
        errors.cardImages = ["At least one card image is required"];

      if (Object.keys(errors).length > 0) {
        setFormState({ message: "Validation failed.", errors });
        return;
      }

      const selectedCardData = giftCards.find(
        (card) => card.id === selectedCard
      );
      if (!selectedCardData) {
        setFormState({
          message: "Selected gift card type does not exist.",
          errors: { cardType: ["Selected gift card type does not exist"] },
        });
        return;
      }

      const rate = selectedCardData.rate;
      const payoutNaira = (parseFloat(faceValue) * rate * exchangeRate) / 100;

      const submissionData = {
        userId: user.uid,
        giftCardId: selectedCard,
        giftCardName: selectedCardData.name,
        faceValue: parseFloat(faceValue),
        cardCode: cardCode || null, // Card code is optional
        payoutNaira,
        status: "pending",
        submittedAt: new Date().toISOString(),
        imageUrls: [],
        imageCount: cardImages.length,
        exchangeRate,
        ratePercentage: rate,
      };

      console.log("Saving submission to Firestore:", submissionData);

      const docRef = await addDoc(
        collection(firestore, "giftCardSubmissions"),
        submissionData
      );

      console.log("Submission saved with ID:", docRef.id);

      let imageUrls = [];
      try {
        imageUrls = await uploadImages(cardImages, user.uid, docRef.id);
        console.log("Images uploaded successfully:", imageUrls);

        await updateDoc(doc(firestore, "giftCardSubmissions", docRef.id), {
          imageUrls: imageUrls,
        });
      } catch (imageError) {
        console.error("Failed to upload images:", imageError);
        throw new Error("Failed to upload card images");
      }

      const transactionData = {
        userId: user.uid,
        description: `${selectedCardData.name} gift-card-sales-order`,
        amount: payoutNaira,
        type: "credit",
        status: "Pending",
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString(),
        relatedSubmissionId: docRef.id,
        relatedSubmissionType: "giftCard",
      };

      await addDoc(
        collection(firestore, "users", user.uid, "transactions"),
        transactionData
      );
      console.log("Transaction record created");

      try {
        await sendAdminNotification({
          submissionId: docRef.id,
          giftCardName: selectedCardData.name,
          faceValue: parseFloat(faceValue),
          rate,
          payoutNaira,
          userId: user.uid,
          imageUrls: imageUrls,
          imageCount: cardImages.length,
        });
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }

      setFormState({
        message: "Gift card submitted successfully for manual verification.",
      });
    } catch (err) {
      console.error("Submission error:", err);

      if (err.code === "permission-denied") {
        setFormState({
          message:
            "Permission denied. Please ensure you're properly authenticated.",
          errors: {
            server: [
              "You don't have permission to submit gift cards. Please sign in again.",
            ],
          },
        });
      } else {
        setFormState({
          message: "Failed to process submission.",
          errors: { server: ["An unexpected error occurred: " + err.message] },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {!isAuthenticated && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to submit a gift card.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="cardType">Gift Card Type</Label>
        <Select
          name="cardType"
          value={selectedCard}
          onValueChange={setSelectedCard}
          disabled={!isAuthenticated}
        >
          <SelectTrigger id="cardType">
            <SelectValue placeholder="Select card type" />
          </SelectTrigger>
          <SelectContent>
            {giftCards.length === 0 || exchangeRate === null ? (
              <SelectItem value="loading" disabled>
                Loading...
              </SelectItem>
            ) : (
              giftCards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name} (Rate: {card.rate}%)
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {formState.errors?.cardType && (
          <p className="text-sm text-destructive">
            {formState.errors.cardType[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardValue">Face Value (USD)</Label>
        <Input
          id="cardValue"
          name="cardValue"
          type="number"
          value={faceValue}
          onChange={(e) => setFaceValue(e.target.value)}
          placeholder="e.g., 100"
          min="0"
          step="0.01"
          disabled={!isAuthenticated}
        />
        {formState.errors?.cardValue && (
          <p className="text-sm text-destructive">
            {formState.errors.cardValue[0]}
          </p>
        )}
      </div>

      {selectedCard && faceValue && exchangeRate !== null && (
        <div className="text-sm text-muted-foreground">
          <p>Exchange Rate: 1 USD = ₦{exchangeRate.toLocaleString()}</p>
          <p>Rate: {rate}%</p>
          <p>
            You will receive: ₦{payoutNaira.toLocaleString()} (Naira equivalent
            of ${faceValue} at {rate}% rate)
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="cardCode">Card Code (Optional)</Label>
        <Input
          id="cardCode"
          name="cardCode"
          value={cardCode}
          onChange={(e) => setCardCode(e.target.value)}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          disabled={!isAuthenticated}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardImages">
          Card Images * (Maximum {MAX_IMAGES} images)
        </Label>
        <div className="space-y-4">
          {cardImages.length < MAX_IMAGES && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                id="cardImages"
                name="cardImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                disabled={!isAuthenticated}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isAuthenticated}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Card Images ({cardImages.length}/{MAX_IMAGES})
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                PNG, JPG or GIF up to 5MB each. You can select multiple images
                at once.
              </p>
            </div>
          )}

          {imagePreviews.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Uploaded Images ({imagePreviews.length}/{MAX_IMAGES})
                </Label>
                {cardImages.length < MAX_IMAGES && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isAuthenticated}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add More
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={preview.id}
                    className="relative border rounded-lg p-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground truncate">
                        {preview.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(index)}
                        disabled={!isAuthenticated}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <img
                      src={preview.url}
                      alt={`Card preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <div className="text-xs text-center mt-1 text-muted-foreground">
                      Image {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {formState.errors?.cardImages && (
          <p className="text-sm text-destructive">
            {formState.errors.cardImages[0]}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={
          !isValid ||
          isSubmitting ||
          !isAuthenticated ||
          !giftCards?.length ||
          exchangeRate === null
        }
      >
        {isSubmitting ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Check & Submit"
        )}
      </Button>

      {formState.message && (
        <Alert variant={formState.errors ? "destructive" : "default"}>
          {formState.errors ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {formState.errors ? "Submission Failed" : "Submission Received"}
          </AlertTitle>
          <AlertDescription>{formState.message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
