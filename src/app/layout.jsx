import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { AuthProviderWrapper } from "@/contexts/AuthProviderWrapper";
import ClientLayoutWrapper from "@/components/shared/client-layout-wrapper";
import Script from "next/script"; // Import Script component

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
        </AuthProviderWrapper>

        {/* Tawk.to Live Chat */}
        <Script id="tawkto-chat" strategy="afterInteractive">
          {`
    var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
    (function(){
      var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
      s1.async=true;
      s1.src='https://embed.tawk.to/698bd77f813e191c30f8b1f4/default';
      s1.charset='UTF-8';
      s1.setAttribute('crossorigin','*');
      s0.parentNode.insertBefore(s1,s0);
    })();
  `}
        </Script>
      </body>
    </html>
  );
}
