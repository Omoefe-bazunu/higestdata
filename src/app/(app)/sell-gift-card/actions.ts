"use server";

import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  brand: z.string().min(1, { message: "Please select a brand." }),
  amount: z.coerce.number().positive({ message: "Please enter the card amount." }),
  cardCode: z.string().min(1, { message: "Please enter the gift card code." }),
  cardImage: z
    .any()
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

export async function sellGiftCard(
  formData: FormData
) {
  const rawFormData = Object.fromEntries(formData.entries());
  const validatedInput = formSchema.safeParse(rawFormData);

  if (!validatedInput.success) {
    console.error(validatedInput.error.flatten().fieldErrors);
    return { success: false, error: "Invalid input.", errors: validatedInput.error.flatten().fieldErrors };
  }

  const { brand, amount, cardCode, cardImage } = validatedInput.data;
  
  // TODO: Implement Gift Card Selling Logic
  // 1. Upload the `cardImage` to Firebase Storage.
  //    - Get the download URL of the uploaded image.
  //    - You will need to install and configure Firebase Admin SDK for this.
  // 2. Save the transaction details to your database (e.g., Firestore).
  //    - Include user ID, brand, amount, code, image URL, and a 'pending' status.
  // 3. An admin will then review the submission from the admin panel.
  //    - They will verify the card balance and validity.
  // 4. If valid, the admin approves the transaction.
  //    - Your system then credits the user's wallet with the agreed-upon cash value.
  // 5. If invalid, the admin rejects the transaction.

  console.log("Simulating gift card sale:", { brand, amount, cardCode, fileName: cardImage.name });

  // Simulate a successful submission
  return { 
    success: true, 
    data: { 
      message: `Your ${brand} gift card has been submitted for verification. You will be notified once the process is complete.`
    } 
  };
}
