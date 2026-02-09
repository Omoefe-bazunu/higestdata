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

        {/* ✅ Smartsupp Live Chat Integration */}
        <Script id="smartsupp-chat" strategy="afterInteractive">
          {`
            var _smartsupp = _smartsupp || {};
            _smartsupp.key = '6456ce9dd4d0875e98086283706bb7147cb179d3';
            window.smartsupp||(function(d) {
              var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
              s=d.getElementsByTagName('script')[0];c=d.createElement('script');
              c.type='text/javascript';c.charset='utf-8';c.async=true;
              c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
            })(document);
          `}
        </Script>
      </body>
    </html>
  );
}
