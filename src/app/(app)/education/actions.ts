
"use server";

import { z } from "zod";

const formSchema = z.object({
  serviceId: z.string().min(1, { message: "Please select an exam body." }),
  variationCode: z.string().min(1, { message: "Please select a pin type." }),
  profileCode: z.string().min(1, { message: "Profile Code is required." }), // For JAMB
  phoneNumber: z.string().regex(/^0[789][01]\d{8}$/, { message: "Please enter a valid Nigerian phone number." }),
});

export async function educationPayment(
  input: z.infer<typeof formSchema>
) {
  const validatedInput = formSchema.safeParse(input);

  if (!validatedInput.success) {
    return { success: false, error: "Invalid input." };
  }
  
  const { serviceId, variationCode, profileCode, phoneNumber } = validatedInput.data;

  // TODO: Implement VTPass API call here.
  // This function should:
  // 1. Make the payment request to the VTPass Pay endpoint for education payments.
  //    - https://www.vtpass.com/documentation/education/
  // 2. The `billersCode` for VTPass would be the profileCode or other identifier.
  // 3. Handle the response, checking for success or failure.
  // 4. Return a meaningful response to the client.

  console.log("Simulating education payment with VTPass for:", { serviceId, variationCode, profileCode, phoneNumber });

  // Simulate a successful API call
  return { 
    success: true, 
    data: { 
      transactionId: `VT-EDU-${Math.random().toString(36).substring(2, 9)}`,
      pin: `WAEC-PIN-${Math.floor(Math.random() * 1e12)}`,
      details: `Successfully purchased ${variationCode} for ${serviceId}.`
    } 
  };
}
