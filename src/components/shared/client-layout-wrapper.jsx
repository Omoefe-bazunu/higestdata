"use client";

import Header from "@/components/shared/header";
import Footer from "@/components/shared/footer";

export default function ClientLayoutWrapper({ children }) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <main className="">{children}</main>
      <Footer />
    </div>
  );
}
