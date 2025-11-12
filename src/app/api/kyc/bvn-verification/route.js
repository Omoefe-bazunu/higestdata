// app/api/bvn-verification/route.js
import { NextResponse } from "next/server";

// Helper function to normalize strings for comparison
function normalizeString(str) {
  return str?.toString().toLowerCase().trim().replace(/\s+/g, " ") || "";
}

// Helper function to check name match (allowing partial matches)
function namesMatch(provided, bvnName) {
  const providedNorm = normalizeString(provided);
  const bvnNorm = normalizeString(bvnName);

  // Exact match
  if (providedNorm === bvnNorm) return true;

  // One contains the other
  if (providedNorm.includes(bvnNorm) || bvnNorm.includes(providedNorm))
    return true;

  // Check if all words in provided name exist in BVN name
  const providedWords = providedNorm.split(" ");
  const bvnWords = bvnNorm.split(" ");

  return providedWords.every((word) =>
    bvnWords.some((bvnWord) => bvnWord.includes(word) || word.includes(bvnWord))
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { bvn, firstName, lastName, middleName, phone, gender } = body;

    // Validate BVN
    if (!bvn) {
      return NextResponse.json(
        { success: false, message: "BVN is required" },
        { status: 400 }
      );
    }

    // Validate BVN format (11 digits)
    if (!/^\d{11}$/.test(bvn)) {
      return NextResponse.json(
        { success: false, message: "BVN must be exactly 11 digits" },
        { status: 400 }
      );
    }

    // Check environment variables
    const appId = process.env.DOJAH_APP_ID;
    const secretKey = process.env.DOJAH_SECRET_KEY;
    const baseUrl = process.env.DOJAH_BASE_URL || "https://api.dojah.io";

    if (!appId || !secretKey) {
      console.error("Missing Dojah credentials");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    console.log("🔍 Attempting BVN verification...");
    console.log("BVN (last 4 digits):", bvn.slice(-4));
    console.log("User provided:", {
      firstName,
      lastName,
      middleName,
      phone, // still logged & can be stored
      gender, // still logged & can be stored
    });

    // Call Dojah API
    const dojahUrl = `${baseUrl}/api/v1/kyc/bvn/full?bvn=${bvn}`;

    const response = await fetch(dojahUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        AppId: appId,
        Authorization: secretKey,
      },
    });

    const data = await response.json();

    // Log response for debugging
    console.log("📥 Dojah Response Status:", response.status);
    console.log("📥 Dojah Response Body:", JSON.stringify(data, null, 2));

    // Check for successful response from Dojah
    if (!response.ok || !data?.entity?.bvn) {
      console.error("❌ BVN verification failed");
      const errorMessage =
        data?.error || data?.message || "BVN verification failed";

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          details: data,
        },
        { status: response.status || 400 }
      );
    }

    // BVN found - now validate user-provided data against BVN records
    const bvnData = data.entity;
    const validationErrors = [];

    console.log("🔍 Validating user data against BVN records...");

    // 1. Validate First Name
    if (firstName && bvnData.first_name) {
      if (!namesMatch(firstName, bvnData.first_name)) {
        console.error("❌ First name mismatch:", {
          provided: firstName,
          bvn: bvnData.first_name,
        });
        validationErrors.push("First name does not match BVN records");
      } else {
        console.log("✅ First name matched");
      }
    }

    // 2. Validate Last Name
    if (lastName && bvnData.last_name) {
      if (!namesMatch(lastName, bvnData.last_name)) {
        console.error("❌ Last name mismatch:", {
          provided: lastName,
          bvn: bvnData.last_name,
        });
        validationErrors.push("Last name does not match BVN records");
      } else {
        console.log("✅ Last name matched");
      }
    }

    // 3. Validate Middle Name (optional - only if provided by user)
    if (middleName && bvnData.middle_name) {
      if (!namesMatch(middleName, bvnData.middle_name)) {
        console.warn("⚠️ Middle name mismatch:", {
          provided: middleName,
          bvn: bvnData.middle_name,
        });
        // Don't fail on middle name mismatch, just warn
      } else {
        console.log("✅ Middle name matched");
      }
    }

    // 🚨 Removed phone and gender checks (but values still logged & available for Firestore)

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      console.error("❌ Validation failed with errors:", validationErrors);
      return NextResponse.json(
        {
          success: false,
          message: "Personal information does not match BVN records",
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // All validations passed
    console.log("✅ All validations passed - BVN verification successful");
    return NextResponse.json({
      success: true,
      data: bvnData,
      message: "BVN verified successfully",
    });
  } catch (error) {
    console.error("❌ BVN Verification Error:", error);
    console.error("Error details:", error.message);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
