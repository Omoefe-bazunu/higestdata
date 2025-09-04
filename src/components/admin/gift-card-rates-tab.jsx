"use client";

import { useState } from "react";
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

const initialRates = [
  { id: "amazon", name: "Amazon", rate: 75, min: 10, max: 500 },
  { id: "steam", name: "Steam", rate: 80, min: 5, max: 200 },
  { id: "itunes", name: "iTunes", rate: 70, min: 10, max: 100 },
  { id: "google-play", name: "Google Play", rate: 65, min: 10, max: 100 },
];

export default function GiftCardRatesTab() {
  const [rates, setRates] = useState(initialRates);
  const [newCardName, setNewCardName] = useState("");
  const { toast } = useToast();

  const handleRateChange = (id, newRate) => {
    setRates(rates.map((r) => (r.id === id ? { ...r, rate: newRate } : r)));
  };

  const handleAddNewCard = () => {
    if (!newCardName.trim()) return;
    const newCard = {
      id: newCardName.toLowerCase().replace(/\s+/g, "-"),
      name: newCardName,
      rate: 50, // default rate
      min: 10,
      max: 100,
    };
    setRates([...rates, newCard]);
    setNewCardName("");
  };

  const handleRemoveCard = (id) => {
    setRates(rates.filter((r) => r.id !== id));
  };

  const handleSaveChanges = () => {
    // Simulate saving to a backend
    console.log("Saving gift card rates:", rates);
    toast({
      title: "Rates Saved",
      description: `Gift card rates have been updated.`,
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Gift Card Rate Settings</CardTitle>
        <CardDescription>
          Set the percentage rate for different gift cards.
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
              {rates.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-medium">{card.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={card.rate}
                      onChange={(e) =>
                        handleRateChange(card.id, parseInt(e.target.value))
                      }
                      className="max-w-xs"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCard(card.id)}
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
            />
            <Button variant="outline" onClick={handleAddNewCard}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveChanges}>
            <Save className="mr-2 h-4 w-4" />
            Save All Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
