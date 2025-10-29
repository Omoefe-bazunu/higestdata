import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { AuthProviderWrapper } from "@/contexts/AuthProviderWrapper";
import ClientLayoutWrapper from "@/components/shared/client-layout-wrapper";
import { FaWhatsapp } from "react-icons/fa";

export const metadata = {
  title: "Highest Data",
  description: "Manage your digital assets and services seamlessly.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body className={cn("h-full font-body antialiased relative")}>
        <AuthProviderWrapper>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          <Toaster />

          {/* ✅ Floating WhatsApp Icon with Hover Tooltip */}
          <div className="fixed bottom-6 right-6 z-50 group">
            {/* Tooltip */}
            <div className="absolute bottom-16 right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none whitespace-nowrap">
              Chat live with support on WhatsApp
            </div>

            {/* WhatsApp Icon */}
            <a
              href="https://wa.me/2347038911469"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-xl flex items-center justify-center transition-transform duration-300 hover:scale-110"
              aria-label="Chat with us on WhatsApp"
            >
              <FaWhatsapp className="text-3xl" />
            </a>
          </div>
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
