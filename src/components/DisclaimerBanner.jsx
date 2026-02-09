"use client";

export default function DisclaimerBanner() {
  const alertText =
    "SCAM ALERT: HIGHEST DATA FINTECH SOLUTIONS does not perform any of the services listed on this website on any external platform. Beware of scammers who might engage you with a cloned website or via platforms like WhatsApp, Facebook, etc. We will not be held liable for any loss you incur outside this official website.";

  return (
    <div className="fixed top-0 left-0 w-full z-[60] bg-[#cc3333] text-white overflow-hidden h-10 border-b border-white/10">
      <div className="flex items-center h-full relative">
        {/* Static Warning Label */}
        <div className="z-20 bg-[#cc3333] flex items-center px-4 h-full border-r border-white/20 shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
          <svg
            className="w-4 h-4 text-yellow-400 fill-current mr-2 flex-shrink-0"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2V9h2v5z" />
          </svg>
          <span className="font-bold whitespace-nowrap text-[10px] sm:text-xs uppercase tracking-widest">
            Disclaimer
          </span>
        </div>

        {/* Infinite Scrolling Content */}
        <div className="flex-1 overflow-hidden h-full flex items-center">
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-xs sm:text-sm font-medium px-8 inline-block">
              {alertText}
            </span>
            {/* Duplicate span for seamless loop */}
            <span className="text-xs sm:text-sm font-medium px-8 inline-block">
              {alertText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
