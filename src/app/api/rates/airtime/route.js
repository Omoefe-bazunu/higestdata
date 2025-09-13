// import { firestore } from "@/lib/firebaseConfig";
// import { doc, setDoc } from "firebase/firestore";
// import { NextResponse } from "next/server";

// export async function POST(req) {
//   try {
//     const body = await req.json();
//     const { providerDiscounts } = body;

//     await Promise.all(
//       Object.keys(providerDiscounts).map((key) =>
//         setDoc(
//           doc(firestore, "rates", `airtime-${key}`),
//           providerDiscounts[key]
//         )
//       )
//     );

//     return NextResponse.json({ success: true });
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
