'use server';

import { z } from 'zod';
import { flagGiftCardForFraud } from '@/ai/flows/flag-fraudulent-gift-cards';

const fraudCheckSchema = z.object({
  cardType: z.string().min(1, 'Card type is required.'),
  cardValue: z.string().min(1, 'Card value is required.'),
  cardCode: z.string().min(1, 'Card code is required.'),
});

export type FraudCheckState = {
  message?: string;
  isFraudulent?: boolean;
  fraudExplanation?: string;
  errors?: {
    cardType?: string[];
    cardValue?: string[];
    cardCode?: string[];
  };
};

export async function checkGiftCardFraud(
  prevState: FraudCheckState,
  formData: FormData
): Promise<FraudCheckState> {
  const validatedFields = fraudCheckSchema.safeParse({
    cardType: formData.get('cardType'),
    cardValue: formData.get('cardValue'),
    cardCode: formData.get('cardCode'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid form data.',
    };
  }
  
  const { cardType, cardValue, cardCode } = validatedFields.data;

  try {
    const giftCardDetails = `Card Type: ${cardType}, Value: ₦${cardValue}, Code: ${cardCode}`;
    const userTransactionHistory = "User has made 3 successful airtime purchases in the last month. No previous gift card uploads.";
    const uploadMetadata = `IP Address: 192.168.1.1, Time: ${new Date().toISOString()}, Device: Desktop Browser`;

    const result = await flagGiftCardForFraud({ giftCardDetails, userTransactionHistory, uploadMetadata });
    
    if (result.isFraudulent) {
       return { 
         message: "This transaction has been flagged for review.",
         isFraudulent: true,
         fraudExplanation: result.fraudExplanation
       };
    } else {
       return { 
         message: "Gift card submitted successfully.",
         isFraudulent: false,
         fraudExplanation: "This transaction appears to be legitimate."
       };
    }

  } catch (error) {
    console.error('Error checking for fraud:', error);
    return { message: 'An unexpected error occurred. Please try again.' };
  }
}
