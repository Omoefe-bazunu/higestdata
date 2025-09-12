"use client";

import { useRef, useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
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
import { CheckCircle, AlertTriangle, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FraudCheckForm({ giftCards, exchangeRate }) {
  const [formState, setFormState] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const formRef = useRef(null);
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState("");
  const [faceValue, setFaceValue] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [isValid, setIsValid] = useState(false);

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

  // Validate form inputs
  useEffect(() => {
    const valid =
      selectedCard && faceValue && parseFloat(faceValue) > 0 && cardCode.trim();
    setIsValid(valid);
  }, [selectedCard, faceValue, cardCode]);

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
        // Clear form on success
        setSelectedCard("");
        setFaceValue("");
        setCardCode("");
        formRef.current?.reset();
      }
    }
    if (formState.errors) {
      console.log("Form submission errors:", formState.errors);
    }
  }, [formState, toast]);

  // Send email notification function
  const sendAdminNotification = async (submissionData) => {
    try {
      const response = await fetch("/api/send-notification", {
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
        }),
      });

      if (!response.ok) {
        console.error("Failed to send admin notification");
      } else {
        console.log("Admin notification sent successfully");
      }
    } catch (error) {
      console.error("Error sending admin notification:", error);
    }
  };

  // Handle form submission - everything client-side
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
        description: "Please fill all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate inputs
      const errors = {};
      if (!selectedCard) errors.cardType = ["Card type is required"];
      if (!faceValue || isNaN(faceValue) || parseFloat(faceValue) <= 0)
        errors.cardValue = ["Valid card value in USD is required"];
      if (!cardCode.trim()) errors.cardCode = ["Card code is required"];

      if (Object.keys(errors).length > 0) {
        setFormState({ message: "Validation failed.", errors });
        return;
      }

      // Get the selected card data
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

      // Save to Firestore (client-side with user authentication context)
      const submissionData = {
        userId: user.uid,
        giftCardId: selectedCard,
        giftCardName: selectedCardData.name,
        faceValue: parseFloat(faceValue),
        cardCode,
        payoutNaira,
        status: "pending",
        submittedAt: new Date().toISOString(),
      };

      console.log("Saving submission to Firestore:", submissionData);

      const docRef = await addDoc(
        collection(firestore, "giftCardSubmissions"),
        submissionData
      );

      console.log("Submission saved with ID:", docRef.id);

      // Create transaction record with updated format
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

      // Send admin notification
      try {
        await sendAdminNotification({
          submissionId: docRef.id,
          giftCardName: selectedCardData.name,
          faceValue: parseFloat(faceValue),
          rate,
          payoutNaira,
          userId: user.uid,
        });
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
        // Don't fail the submission if email fails
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
        <Label htmlFor="cardCode">Card Code</Label>
        <Input
          id="cardCode"
          name="cardCode"
          value={cardCode}
          onChange={(e) => setCardCode(e.target.value)}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          disabled={!isAuthenticated}
        />
        {formState.errors?.cardCode && (
          <p className="text-sm text-destructive">
            {formState.errors.cardCode[0]}
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
          giftCards.length === 0 ||
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
