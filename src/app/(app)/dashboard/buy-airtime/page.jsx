"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { CheckCircle, Loader } from "lucide-react";
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
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-4">
      <div>
        <h1 className="text-3xl font-bold font-headline">Buy Airtime & Data</h1>
        <p className="text-muted-foreground">
          Instantly top up airtime or data plans. Fast, easy, and reliable.
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <Tabs defaultValue="airtime" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="airtime">Airtime</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>
              <TabsContent value="airtime" className="space-y-4">
                <CardHeader className="px-0">
                  <CardTitle>Buy Airtime</CardTitle>
                  <CardDescription>
                    Enter details to top up airtime
                  </CardDescription>
                </CardHeader>
                <PurchaseForm type="Airtime" user={user} router={router} />
              </TabsContent>
              <TabsContent value="data" className="space-y-4">
                <CardHeader className="px-0">
                  <CardTitle>Buy Data</CardTitle>
                  <CardDescription>
                    Choose a data plan that suits you.
                  </CardDescription>
                </CardHeader>
                <PurchaseForm type="Data" user={user} router={router} />
              </TabsContent>
            </Tabs>
          </div>
          <div className="bg-muted/50 p-8 md:p-12 flex flex-col justify-center">
            <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
              <Image
                src="/vtu.png"
                alt="Mobile services illustration"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-secondary-foreground">
              Seamlessly Connected.
            </h3>
            <p className="text-muted-foreground mb-4">
              Stay online with instant airtime and data recharges.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Instant delivery on all services</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Secure payments from your wallet</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Competitive rates and reliable plans</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
