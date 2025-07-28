'use client';

import { useFormStatus } from 'react-dom';
import { checkGiftCardFraud, type FraudCheckState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import { useEffect, useRef, useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
      Check & Submit
    </Button>
  );
}

export default function FraudCheckForm() {
  const initialState: FraudCheckState = {};
  const [state, dispatch] = useActionState(checkGiftCardFraud, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && !state.errors) {
        toast({
            title: state.isFraudulent ? "Transaction Flagged" : "Submission Successful",
            description: state.message,
            variant: state.isFraudulent ? "destructive" : "default",
        });
        if (!state.isFraudulent) {
          formRef.current?.reset();
        }
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={dispatch} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="cardType">Card Type</Label>
        <Select name="cardType">
          <SelectTrigger id="cardType">
            <SelectValue placeholder="Select card type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="amazon">Amazon</SelectItem>
            <SelectItem value="steam">Steam</SelectItem>
            <SelectItem value="itunes">iTunes</SelectItem>
            <SelectItem value="google-play">Google Play</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {state.errors?.cardType && <p className="text-sm text-destructive">{state.errors.cardType[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardValue">Value (USD)</Label>
        <Input id="cardValue" name="cardValue" type="number" placeholder="e.g., 50" />
         {state.errors?.cardValue && <p className="text-sm text-destructive">{state.errors.cardValue[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardCode">Card Code</Label>
        <Input id="cardCode" name="cardCode" placeholder="XXXX-XXXX-XXXX-XXXX" />
        {state.errors?.cardCode && <p className="text-sm text-destructive">{state.errors.cardCode[0]}</p>}
      </div>

      <SubmitButton />

      {state.fraudExplanation && (
        <Alert variant={state.isFraudulent ? 'destructive' : 'default'}>
            {state.isFraudulent ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertTitle>AI Fraud Analysis</AlertTitle>
          <AlertDescription>
            {state.fraudExplanation}
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
