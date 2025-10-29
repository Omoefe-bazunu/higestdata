"use client";
import { useState } from "react";

export default function DisclaimerBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white text-blue-950 px-6 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-50">
      <div className="relative max-w-6xl mx-auto text-center">
        <h1 className="text-sm text-red-700 font-bold mb-1">DISCLAIMER:</h1>
        <p className="text-xs leading-relaxed">
          HIGHEST DATA FINTECH SOLUTIONS does not perform any of the services
          listed on this website on any external platform. Beware of SCAMMERS
          who might engage you with a cloned website or via other platforms like
          WhatsApp, Facebook, etc., using our name. We will not be held liable
          for any loss you incur if you engage in any trade outside this
          official website.
        </p>

        {/* Close Button */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-1 right-2 text-red-700 font-bold text-lg leading-none"
          aria-label="Close disclaimer"
        >
          ×
        </button>
      </div>
    </div>
  );
}
