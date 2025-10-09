// import { NextResponse } from "next/server";
// import crypto from "crypto";
// import { adminDb } from "@/lib/firebaseAdmin";
// import admin from "firebase-admin";

// export async function POST(request) {
//   try {
//     const body = await request.text();
//     const hash = crypto
//       .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
//       .update(body)
//       .digest("hex");

//     const signature = request.headers.get("x-paystack-signature");

//     if (hash !== signature) {
//       console.error("Invalid signature from Paystack webhook");
//       return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
//     }

//     const event = JSON.parse(body);
//     console.log("Webhook event received:", event.event);

//     // Handle charge.success event
//     if (event.event === "charge.success") {
//       const data = event.data;
//       const reference = data.reference;
//       const userId = data.metadata?.userId;
//       const amountInNaira = data.amount / 100;

//       if (!userId) {
//         console.error("Missing userId in webhook metadata");
//         return NextResponse.json({ received: true }, { status: 200 });
//       }

//       console.log(
//         "Processing payment for user:",
//         userId,
//         "Amount:",
//         amountInNaira
//       );

//       // Check for duplicate transaction
//       const transactionsRef = adminDb
//         .collection("users")
//         .doc(userId)
//         .collection("transactions");

//       const existingTx = await transactionsRef
//         .where("paystackReference", "==", reference)
//         .limit(1)
//         .get();

//       if (!existingTx.empty) {
//         console.log("Transaction already processed:", reference);
//         return NextResponse.json({ received: true }, { status: 200 });
//       }

//       // Update wallet balance using transaction
//       const userRef = adminDb.collection("users").doc(userId);

//       await adminDb.runTransaction(async (transaction) => {
//         const userDoc = await transaction.get(userRef);

//         if (!userDoc.exists) {
//           transaction.set(userRef, {
//             walletBalance: amountInNaira,
//             email: data.customer.email,
//             updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//           });
//         } else {
//           const currentBalance = userDoc.data().walletBalance || 0;
//           transaction.update(userRef, {
//             walletBalance: currentBalance + amountInNaira,
//             updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//           });
//         }

//         // Create transaction record
//         const transactionData = {
//           userId,
//           description: "Wallet Funding via Paystack",
//           amount: amountInNaira,
//           type: "credit",
//           status: "Completed",
//           date: new Date().toLocaleDateString(),
//           createdAt: admin.firestore.FieldValue.serverTimestamp(),
//           paystackReference: reference,
//           paymentMethod: data.channel,
//           metadata: {
//             email: data.customer.email,
//             currency: data.currency,
//           },
//         };

//         transaction.set(transactionsRef.doc(), transactionData);
//       });

//       console.log("✅ Wallet updated successfully for user:", userId);
//     }

//     return NextResponse.json({ received: true }, { status: 200 });
//   } catch (error) {
//     console.error("Webhook error:", error);
//     return NextResponse.json({ received: true }, { status: 200 }); // Still return 200 to Paystack
//   }
// }
