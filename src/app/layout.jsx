import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { AuthProviderWrapper } from "@/contexts/AuthProviderWrapper";
import ClientLayoutWrapper from "@/components/shared/client-layout-wrapper";

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
      <body className={cn("h-full font-body antialiased")}>
        <AuthProviderWrapper>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          <Toaster />
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
