"use client";
import { useState } from "react";

export default function ScamAlertBanner() {
  const [visible, setVisible] = useState(true);

  // Set a different state key (e.g., hasDismissed) if you want
  // to remember the dismissal across sessions using localStorage.
  if (!visible) return null;

  return (
    // Outer container: fixed position at the bottom of the viewport
    // You can change 'bottom-0' to 'top-0' if you prefer it at the top.
    <div className="fixed bottom-8 left-0 w-full z-50 p-4">
      {/* Centered content container with max-width, red background, and rounded corners */}
      <div className="max-w-4xl mx-auto rounded-xl bg-[#cc3333] shadow-2xl relative">
        <div className="flex items-center p-4 sm:p-6">
          {/* Left side: Image and 'COPY' stamp - Simplified Visual Placeholder */}
          <div className="hidden sm:block w-1/4 pr-4">
            <div className="relative flex items-center justify-center h-28 w-full bg-white/20 rounded-lg">
              <div className="text-white text-xs font-sans"></div>
              <div
                className="absolute text-white font-bold text-lg p-2 border-2 border-white transform -rotate-12 bg-red-700/80 rounded"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%) rotate(-12deg)",
                  textShadow: "1px 1px 2px rgba[0,0,0,0.5]",
                }}
              >
                DISCLAIMER
              </div>
            </div>
          </div>

          {/* Right side: Text content */}
          <div className="w-full sm:w-3/4 text-white">
            <div className="flex items-center mb-2">
              {/* Alert Icon (Yellow/Orange) */}
              <span className="text-3xl mr-3 leading-none">
                <svg
                  className="w-8 h-8 text-yellow-400 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2V9h2v5z" />
                </svg>
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                SCAM ALERT
              </h1>
            </div>

            <p className="text-sm sm:text-base leading-relaxed mt-3">
              HIGHEST DATA FINTECH SOLUTIONS does not perform any of the
              services listed on this website on any external platform. Beware
              of SCAMMERS who might engage you with a cloned website or via
              other platforms like WhatsApp, Facebook, etc., using our name. We
              will not be held liable for any loss you incur if you engage in
              any trade outside this official website
            </p>
          </div>

          {/* Optional Close Button - Added back for the floating disclaimer pattern */}
          <button
            onClick={() => setVisible(false)}
            className="absolute top-2 right-4 text-white opacity-90 hover:opacity-100 text-3xl leading-none font-light p-1"
            aria-label="Close alert"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}
