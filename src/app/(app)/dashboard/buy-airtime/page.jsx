"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import Link from "next/link"; // Added for navigation
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import {
  CheckCircle,
  Loader,
  Smartphone,
  Globe,
  ShieldCheck,
  ChevronLeft, // Added for return arrow
} from "lucide-react";
import PurchaseForm from "@/components/PurchaseForm";

export default function BuyAirtimePage() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((usr) => {
      if (usr) {
        setUser(usr);
        setAuthChecked(true);
      } else {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader className="h-10 w-10 animate-spin text-blue-950" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header Section */}
        <div className="space-y-4">
          <Link
            href="/dashboard/tools"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-950 transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Services
          </Link>

          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-blue-950 font-headline">
              Top Up <span className="text-orange-400">Instantly</span>
            </h1>
            <p className="mt-2 text-slate-600 max-w-2xl">
              Fast, secure, and reliable airtime and data recharges.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden border-none shadow-2xl ring-1 ring-slate-200">
          <div className="grid md:grid-cols-5 lg:grid-cols-2">
            {/* Visual & Info - Now visible on mobile via 'flex' and positioned first */}
            <div className="flex flex-col md:col-span-2 lg:col-span-1 bg-blue-950 text-white p-8 md:p-10 justify-between relative overflow-hidden order-first md:order-last">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-orange-400 rounded-full opacity-10 blur-3xl"></div>

              <div className="relative z-10">
                <div className="relative aspect-video md:aspect-[4/3] mb-8 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                  <Image
                    src="/vtu.png"
                    alt="Mobile services illustration"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                <h3 className="text-xl md:text-2xl font-bold mb-4">
                  Stay Connected
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-orange-400 shrink-0" />
                    <span className="text-sm md:text-base text-slate-200">
                      Instant delivery on all networks
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-orange-400 shrink-0" />
                    <span className="text-sm md:text-base text-slate-200">
                      Secure wallet-to-service payment
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-6 md:p-10 md:col-span-3 lg:col-span-1 bg-white">
              <Tabs defaultValue="airtime" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 h-12">
                  <TabsTrigger
                    value="airtime"
                    className="data-[state=active]:bg-blue-950 data-[state=active]:text-white"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Airtime
                  </TabsTrigger>
                  <TabsTrigger
                    value="data"
                    className="data-[state=active]:bg-blue-950 data-[state=active]:text-white"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Data
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="airtime" className="mt-0">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-blue-950">
                      Airtime Top-up
                    </h2>
                    <p className="text-sm text-slate-500">
                      Enter details to recharge your line.
                    </p>
                  </div>
                  <PurchaseForm type="Airtime" user={user} router={router} />
                </TabsContent>

                <TabsContent value="data" className="mt-0">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-blue-950">
                      Data Bundle
                    </h2>
                    <p className="text-sm text-slate-500">
                      Select a plan to stay online.
                    </p>
                  </div>
                  <PurchaseForm type="Data" user={user} router={router} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
