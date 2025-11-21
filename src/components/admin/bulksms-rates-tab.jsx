"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BulkSmsRate() {
  const [pricePerSms, setPricePerSms] = useState(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const docRef = doc(firestore, "settings", "smsRates");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setPricePerSms(snap.data().pricePerSms || 2);
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(firestore, "settings", "smsRates"),
        { pricePerSms: Number(pricePerSms) },
        { merge: true }
      );
      toast({ title: "Saved", description: "Bulk SMS rate updated" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  if (loading)
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bulk SMS Pricing</CardTitle>
        <CardDescription>
          Set price per SMS (users pay this amount)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Label htmlFor="price" className="w-32">
            Price per SMS (₦)
          </Label>
          <Input
            id="price"
            type="number"
            min="1"
            step="0.5"
            value={pricePerSms}
            onChange={(e) => setPricePerSms(e.target.value)}
            className="w-32"
          />
        </div>
        <Button onClick={save} disabled={saving} className="w-fit">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Rate
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
