"use client";

import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";
import DisclaimerBanner from "@/components/DisclaimerBanner";

export default function ClientLayoutWrapper({ children }) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <DisclaimerBanner />
      <Header />
      <main className="">{children}</main>
      <Footer />
    </div>
  );
}
