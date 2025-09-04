"use client";

import { useFormStatus } from "react-dom";
import { checkGiftCardFraud } from "@/lib/actions";
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
import { useEffect, useRef, useState, useActionState } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
      Check & Submit
    </Button>
  );
}

const CARD_OPTIONS = [
  {
    value: "amazon",
    label: "Amazon",
    icon: "https://logo.clearbit.com/amazon.com",
  },
  {
    value: "steam",
    label: "Steam",
    icon: "https://logo.clearbit.com/steamgames.com",
  },
  {
    value: "itunes",
    label: "iTunes",
    icon: "https://logo.clearbit.com/apple.com",
  },
  {
    value: "google-play",
    label: "Google Play",
    icon: "https://logo.clearbit.com/google.com",
  },
  { value: "other", label: "Other", icon: "" },
];

export default function FraudCheckForm() {
  const initialState = {};
  const [state, dispatch] = useActionState(checkGiftCardFraud, initialState);
  const formRef = useRef(null);
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState(undefined);

  const currentCard = CARD_OPTIONS.find((c) => c.value === selectedCard);

  useEffect(() => {
    if (state.message && !state.errors) {
      toast({
        title: state.isFraudulent
          ? "Transaction Flagged"
          : "Submission Successful",
        description: state.message,
        variant: state.isFraudulent ? "destructive" : "default",
      });
      if (!state.isFraudulent) {
        formRef.current?.reset();
        setSelectedCard(undefined);
      }
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={dispatch} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="cardType">Card Type</Label>
        <Select
          name="cardType"
          value={selectedCard}
          onValueChange={setSelectedCard}
        >
          <SelectTrigger id="cardType">
            <SelectValue placeholder="Select card type">
              {currentCard && currentCard.icon ? (
                <div className="flex items-center gap-2">
                  <Image
                    src={currentCard.icon}
                    alt={currentCard.label}
                    width={20}
                    height={20}
                  />
                  <span>{currentCard.label}</span>
                </div>
              ) : (
                currentCard?.label || "Select card type"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CARD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.icon && (
                    <Image
                      src={option.icon}
                      alt={option.label}
                      width={20}
                      height={20}
                    />
                  )}
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.errors?.cardType && (
          <p className="text-sm text-destructive">{state.errors.cardType[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardValue">Value (NGN)</Label>
        <Input
          id="cardValue"
          name="cardValue"
          type="number"
          placeholder="e.g., 25000"
        />
        {state.errors?.cardValue && (
          <p className="text-sm text-destructive">
            {state.errors.cardValue[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardCode">Card Code</Label>
        <Input
          id="cardCode"
          name="cardCode"
          placeholder="XXXX-XXXX-XXXX-XXXX"
        />
        {state.errors?.cardCode && (
          <p className="text-sm text-destructive">{state.errors.cardCode[0]}</p>
        )}
      </div>

      <SubmitButton />

      {state.fraudExplanation && (
        <Alert variant={state.isFraudulent ? "destructive" : "default"}>
          {state.isFraudulent ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertTitle>AI Fraud Analysis</AlertTitle>
          <AlertDescription>{state.fraudExplanation}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
