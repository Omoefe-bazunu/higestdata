import { useState, useEffect } from "react";
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
import { Save, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firestore } from "@/lib/firebaseConfig";
import { Skeleton } from "@/components/ui/skeleton";

export default function GiftCardRatesTab() {
  const [rates, setRates] = useState([]);
  const [newCardName, setNewCardName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Fetch gift card rates
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const ratesSnapshot = await getDocs(
          collection(firestore, "giftCardRates")
        );
        const ratesData = ratesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRates(ratesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast({
          title: "Error",
          description: "Failed to load gift card rates.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  // Update rate locally with validation
  const handleRateChange = (id, newRate) => {
    const parsedRate = parseInt(newRate);
    if (isNaN(parsedRate) || parsedRate < 0) {
      toast({
        title: "Invalid Rate",
        description: "Rate must be a non-negative number.",
        variant: "destructive",
      });
      return;
    }
    setRates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, rate: parsedRate } : r))
    );
  };

  // Add a new card with duplicate ID check
  const handleAddNewCard = () => {
    if (!newCardName.trim()) {
      toast({
        title: "Invalid Input",
        description: "Card name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    const newId = newCardName.toLowerCase().replace(/\s+/g, "-");
    if (rates.some((r) => r.id === newId)) {
      toast({
        title: "Duplicate Card",
        description: "A card with this name already exists.",
        variant: "destructive",
      });
      return;
    }
    const newCard = {
      id: newId,
      name: newCardName,
      rate: 50,
      min: 10,
      max: 100,
    };
    setRates((prev) => [...prev, newCard]);
    setNewCardName("");
    toast({
      title: "Card Added",
      description: `${newCardName} added locally. Save to confirm.`,
    });
  };

  // Remove card from Firestore and update local state
  const handleRemoveCard = async (id) => {
    try {
      await deleteDoc(doc(firestore, "giftCardRates", id));
      setRates((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Deleted", description: "Gift card removed." });
    } catch (err) {
      console.error("Error removing card:", err);
      toast({
        title: "Error",
        description: "Failed to remove gift card.",
        variant: "destructive",
      });
    }
  };

  // Save all changes to Firestore using batch
  const handleSaveChanges = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to save changes.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSaving(true);
      const batch = writeBatch(firestore);

      // Save gift card rates
      for (const card of rates) {
        const docRef = doc(firestore, "giftCardRates", card.id);
        batch.set(docRef, {
          name: card.name,
          rate: card.rate,
          min: card.min,
          max: card.max,
        });
      }

      await batch.commit();
      toast({
        title: "Changes Saved",
        description: "Gift card rates updated.",
      });
    } catch (err) {
      console.error("Error saving changes:", err);
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Gift Card Rate Settings</CardTitle>
        <CardDescription>
          Manage percentage rates for gift cards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card Type</TableHead>
                <TableHead className="w-48">Rate (%)</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-6 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                : rates.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">{card.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={card.rate}
                          onChange={(e) =>
                            handleRateChange(card.id, e.target.value)
                          }
                          className="max-w-xs"
                          min="0"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCard(card.id)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="New card name (e.g., eBay)"
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              disabled={saving}
            />
            <Button
              variant="outline"
              onClick={handleAddNewCard}
              disabled={saving}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveChanges} disabled={saving || loading}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
