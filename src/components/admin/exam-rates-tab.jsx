// ADMIN: Exam Card Rates - app/admin/exam-rates/page.jsx
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Loader, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function ExamCardRatesPage() {
  const [examRates, setExamRates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        loadRates();
        setAuthChecked(true);
      } else {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  const loadRates = async () => {
    try {
      setIsLoading(true);
      const ratesDoc = await getDoc(
        doc(firestore, "settings", "examCardRates")
      );

      if (ratesDoc.exists()) {
        setExamRates(ratesDoc.data().rates || {});
      }
    } catch (error) {
      console.error("Error loading rates:", error);
      toast({
        title: "Error",
        description: "Failed to load rates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFromNRP = async () => {
    try {
      setIsFetching(true);
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in.",
          variant: "destructive",
        });
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/exam-cards/fetch-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch products");
      }

      const newRates = {};
      result.products.forEach((product) => {
        const basePrice = parseFloat(product.unit_amount);
        const profit = 0;
        newRates[product.card_type_id] = {
          name: product.card_name,
          basePrice,
          profit,
          finalPrice: basePrice + profit,
          availability: product.availability,
        };
      });

      setExamRates(newRates);
      toast({
        title: "Success",
        description: "Products fetched from NaijaResultPins",
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const updateRate = (cardId, field, value) => {
    setExamRates((prev) => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        [field]: field === "name" ? value : parseFloat(value) || 0,
        finalPrice:
          field === "basePrice"
            ? (parseFloat(value) || 0) + (prev[cardId]?.profit || 0)
            : field === "profit"
            ? (prev[cardId]?.basePrice || 0) + (parseFloat(value) || 0)
            : prev[cardId]?.finalPrice || 0,
      },
    }));
  };

  const saveRates = async () => {
    try {
      setIsSaving(true);
      await setDoc(
        doc(firestore, "settings", "examCardRates"),
        {
          rates: examRates,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      toast({
        title: "Success",
        description: "Exam card rates saved successfully.",
      });
    } catch (error) {
      console.error("Error saving rates:", error);
      toast({
        title: "Error",
        description: "Failed to save rates.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!authChecked || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Exam Card Rates Management</h1>
          <p className="text-muted-foreground">
            Configure pricing for exam scratch cards
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <Button
            onClick={fetchFromNRP}
            disabled={isFetching}
            variant="outline"
          >
            {isFetching ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Fetch from NRP
              </>
            )}
          </Button>
          <Button onClick={saveRates} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Card Rates</CardTitle>
          <CardDescription>
            Set base prices and profit margins for exam cards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(examRates).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exam cards configured. Click "Fetch from NRP" to load products.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Card Name</TableHead>
                  <TableHead>Base Price (₦)</TableHead>
                  <TableHead>Profit (₦)</TableHead>
                  <TableHead>Final Price (₦)</TableHead>
                  <TableHead>Margin %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(examRates).map((cardId) => (
                  <TableRow key={cardId}>
                    <TableCell className="font-medium">
                      {examRates[cardId]?.name}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={examRates[cardId]?.basePrice || 0}
                        onChange={(e) =>
                          updateRate(cardId, "basePrice", e.target.value)
                        }
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={examRates[cardId]?.profit || 0}
                        onChange={(e) =>
                          updateRate(cardId, "profit", e.target.value)
                        }
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        ₦{(examRates[cardId]?.finalPrice || 0).toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {examRates[cardId]?.basePrice > 0
                          ? (
                              ((examRates[cardId]?.profit || 0) /
                                examRates[cardId]?.basePrice) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          examRates[cardId]?.availability === "In Stock"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {examRates[cardId]?.availability || "Unknown"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
          <CardDescription>Overview of current pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Total Products</h4>
              <p className="text-3xl font-bold">
                {Object.keys(examRates).length}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Avg. Profit Margin</h4>
              <p className="text-3xl font-bold">
                {Object.keys(examRates).length > 0
                  ? (
                      Object.values(examRates).reduce(
                        (sum, rate) =>
                          sum +
                          (rate.basePrice > 0
                            ? (rate.profit / rate.basePrice) * 100
                            : 0),
                        0
                      ) / Object.keys(examRates).length
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">In Stock</h4>
              <p className="text-3xl font-bold">
                {
                  Object.values(examRates).filter(
                    (rate) => rate.availability === "In Stock"
                  ).length
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
