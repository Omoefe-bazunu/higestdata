import { useState, useEffect } from "react";
import { fetchLiveCryptoRates } from "@/lib/cryptoRates";
import { firestore } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Copy, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuth } from "firebase/auth";

export default function CryptoSettingsTab() {
  const [rates, setRates] = useState([]);
  const [customRates, setCustomRates] = useState({});
  const [wallets, setWallets] = useState({});
  const [loading, setLoading] = useState(true);
  const [newWalletSymbol, setNewWalletSymbol] = useState("");
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const { toast } = useToast();

  // Fetch live prices and Firestore settings
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch live crypto rates
        const liveData = await fetchLiveCryptoRates();
        setRates(liveData);

        // Fetch wallets
        const walletSnap = await getDoc(
          doc(firestore, "settings", "cryptoWallets")
        );
        if (walletSnap.exists()) setWallets(walletSnap.data());

        // Fetch margins
        const configSnap = await getDoc(
          doc(firestore, "settings", "cryptoConfig")
        );
        if (configSnap.exists()) {
          setCustomRates(configSnap.data().customRates || {});
        }
      } catch (err) {
        console.error("Error fetching crypto settings:", err);
        toast({
          title: "Error",
          description: "Failed to load crypto settings.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  // Save settings
  const handleSave = async () => {
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
      // Save wallet addresses
      await setDoc(doc(firestore, "settings", "cryptoWallets"), wallets, {
        merge: true,
      });

      // Save only per-coin custom margins and asset names
      const marginData = {};
      Object.keys(customRates).forEach((id) => {
        const coin = rates.find((r) => r.id === id);
        if (coin && customRates[id] !== undefined) {
          marginData[id] = {
            name: coin.name,
            symbol: coin.symbol,
            margin: customRates[id],
          };
        }
      });

      await setDoc(
        doc(firestore, "settings", "cryptoConfig"),
        { customRates: marginData },
        { merge: true }
      );

      toast({
        title: "Settings Saved",
        description: "Crypto settings and wallet addresses updated.",
      });
    } catch (err) {
      console.error("Error saving settings:", err);
      toast({
        title: "Error",
        description: "Could not save crypto settings.",
        variant: "destructive",
      });
    }
  };

  // Handle wallet changes
  const handleWalletChange = (id, address) => {
    setWallets((prev) => ({ ...prev, [id]: address }));
  };

  // Handle adding new wallet
  const handleAddWallet = () => {
    if (!newWalletSymbol || !newWalletAddress) {
      toast({
        title: "Missing info",
        description: "Please select a coin and enter a wallet address.",
        variant: "destructive",
      });
      return;
    }
    const coinToAdd = rates.find((coin) => coin.symbol === newWalletSymbol);
    if (!coinToAdd) {
      toast({
        title: "Invalid Coin",
        description: "Selected coin not found in live rates.",
        variant: "destructive",
      });
      return;
    }

    setWallets((prev) => ({
      ...prev,
      [coinToAdd.id]: newWalletAddress,
    }));
    setNewWalletSymbol("");
    setNewWalletAddress("");
    toast({
      title: "Wallet Added",
      description: `${coinToAdd.name} wallet saved locally. Don't forget to save settings.`,
    });
  };

  // Handle margin changes per coin
  const handleRateChange = (id, margin) => {
    setCustomRates((prev) => ({
      ...prev,
      [id]: parseFloat(margin) || 0,
    }));
  };

  // Calculate final sell price
  const calculateSellPrice = (id, marketPrice) => {
    const margin = customRates[id] || 0;
    return marketPrice * (1 + margin / 100);
  };

  // Calculate profit per unit
  const calculateProfit = (id, marketPrice) => {
    const finalPrice = calculateSellPrice(id, marketPrice);
    return finalPrice - marketPrice;
  };

  // Copy wallet address to clipboard
  const handleCopy = (address) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Wallet Addresses */}
      <Card>
        <CardHeader>
          <CardTitle>Company Wallet Addresses</CardTitle>
          <CardDescription>
            These wallet addresses are shown to users when selling crypto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(wallets).length === 0 && <p>No wallets set yet.</p>}
          {Object.entries(wallets).map(([id, address]) => {
            const coin = rates.find((r) => r.id === id);
            return (
              <div key={id} className="space-y-2">
                <Label>{coin?.name || id} Wallet Address</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={address}
                    onChange={(e) => handleWalletChange(id, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(address)}
                    disabled={!address}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Add New Wallet */}
          <div className="space-y-2 border-t pt-4">
            <Label>Add New Wallet</Label>
            <div className="flex items-center gap-2">
              <select
                value={newWalletSymbol}
                onChange={(e) => setNewWalletSymbol(e.target.value)}
                className="border rounded-md px-2 py-1"
              >
                <option value="">Select Coin</option>
                {rates.map((coin) => (
                  <option key={coin.id} value={coin.symbol}>
                    {coin.name} ({coin.symbol})
                  </option>
                ))}
              </select>
              <Input
                placeholder="Wallet address"
                value={newWalletAddress}
                onChange={(e) => setNewWalletAddress(e.target.value)}
              />
              <Button type="button" onClick={handleAddWallet}>
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crypto Rate Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cryptocurrency Rate Settings</CardTitle>
          <CardDescription>
            Adjust profit margins for each asset. Live prices are for reference
            only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Market Price (₦)</TableHead>
                <TableHead className="text-right">Margin (%)</TableHead>
                <TableHead className="text-right">Your Price (₦)</TableHead>
                <TableHead className="text-right">Profit (₦)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-20 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-20 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                : rates.map((coin) => (
                    <TableRow key={coin.id}>
                      <TableCell className="font-medium">{coin.name}</TableCell>
                      <TableCell className="text-right">
                        ₦{coin.price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={customRates[coin.id] ?? ""}
                          placeholder="0"
                          onChange={(e) =>
                            handleRateChange(coin.id, e.target.value)
                          }
                          className="w-20 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        ₦
                        {calculateSellPrice(coin.id, coin.price).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ₦
                        {calculateProfit(coin.id, coin.price).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
