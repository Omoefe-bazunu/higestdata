
"use server";

import { z } from "zod";

const formSchema = z.object({
  serviceId: z.string().min(1, { message: "Please select a network." }),
  variationCode: z.string().min(1, { message: "Please select a data plan." }),
  phoneNumber: z.string().regex(/^0[789][01]\d{8}$/, { message: "Please enter a valid Nigerian phone number." }),
});

// In a real app, you would fetch this from the VTPass API
const dataVariations: Record<string, any[]> = {
  mtn: [
    { variation_code: 'MTN-500', name: '500MB - ₦500 (30 days)' },
    { variation_code: 'MTN-1GB', name: '1GB - ₦1000 (30 days)' },
  ],
  glo: [
    { variation_code: 'GLO-1.35', name: '1.35GB - ₦1000 (30 days)' },
  ],
  airtel: [
    { variation_code: 'AIRTEL-750', name: '750MB - ₦500 (14 days)' },
  ],
  '9mobile': [
    { variation_code: '9MOBILE-1GB', name: '1GB - ₦1000 (30 days)' },
  ]
};

export async function getDataPlans(serviceId: string) {
  // TODO: Replace with a live API call to VTPass
  // https://www.vtpass.com/documentation/data-subscription/
  // This endpoint fetches the available data plans for a given provider.
  return dataVariations[serviceId] || [];
}


export async function buyData(
  input: z.infer<typeof formSchema>
) {
  const validatedInput = formSchema.safeParse(input);

  if (!validatedInput.success) {
    return { success: false, error: "Invalid input." };
  }
  
  const { serviceId, phoneNumber, variationCode } = validatedInput.data;

  // TODO: Implement VTPass API call here.
  // This function should:
  // 1. Make the payment request to the VTPass Pay endpoint for data.
  //    - https://www.vtpass.com/documentation/data-subscription/
  // 2. Handle the response, checking for success or failure.
  // 3. Return a meaningful response to the client.

  console.log("Simulating data purchase with VTPass for:", { serviceId, phoneNumber, variationCode });

  // Simulate a successful API call
  return { 
    success: true, 
    data: { 
      transactionId: `VT-DATA-${Math.random().toString(36).substring(2, 9)}`,
      details: `Successfully purchased data plan ${variationCode} for ${phoneNumber}.`
    } 
  };
}
