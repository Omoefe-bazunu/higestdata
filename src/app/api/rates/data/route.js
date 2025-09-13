// import { firestore } from "@/lib/firebaseConfig";
// import { doc, setDoc } from "firebase/firestore";
// import { NextResponse } from "next/server";

// export async function POST(req) {
//   try {
//     const body = await req.json();
//     const { dataPlans } = body;

//     await Promise.all(
//       Object.keys(dataPlans).map((provider) =>
//         setDoc(doc(firestore, "rates", `data-${provider}`), {
//           plans: dataPlans[provider],
//         })
//       )
//     );

//     return NextResponse.json({ success: true });
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
