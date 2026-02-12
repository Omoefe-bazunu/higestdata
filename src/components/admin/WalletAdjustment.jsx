"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Search, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const API = process.env.NEXT_PUBLIC_API_URL;

const kycColor = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-800",
  not_started: "bg-gray-100 text-gray-600",
};

export default function WalletAdjustment() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [type, setType] = useState("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSelected(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${API}/api/admin/user-search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) setResults(data.data);
      else toast.error(data.error);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected || !amount || !type) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API}/api/admin/adjust-wallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selected.uid,
          amount: parseFloat(amount),
          type,
          note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Wallet ${type}ed successfully. New balance: ₦${data.newBalance.toLocaleString()}`,
        );
        // Update selected user's displayed balance
        setSelected((prev) => ({ ...prev, walletBalance: data.newBalance }));
        setAmount("");
        setNote("");
      } else {
        toast.error(data.error || "Operation failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-900 mb-2">
        Wallet Adjustment
      </h1>
      <p className="text-gray-500 mb-8">
        Search a user and manually credit or debit their wallet.
      </p>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={searching}
          className="bg-blue-900 hover:bg-blue-800 text-white"
        >
          <Search className="w-4 h-4 mr-2" />
          {searching ? "Searching..." : "Search"}
        </Button>
      </form>

      {/* Results */}
      {results.length > 0 && !selected && (
        <div className="space-y-2 mb-8">
          {results.map((u) => (
            <div
              key={u.uid}
              onClick={() => {
                setSelected(u);
                setResults([]);
              }}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 cursor-pointer hover:border-blue-400 hover:shadow transition-all"
            >
              <div>
                <p className="font-bold text-gray-900">{u.name}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  ₦{u.walletBalance.toLocaleString()}
                </p>
                <Badge
                  className={`text-xs ${kycColor[u.kycStatus] || kycColor.not_started}`}
                >
                  KYC: {u.kycStatus}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query && !searching && !selected && (
        <p className="text-gray-400 text-sm mb-6">
          No users found for "{query}"
        </p>
      )}

      {/* Selected User + Form */}
      {selected && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow p-6">
          {/* User Info */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div>
              <p className="text-lg font-black text-gray-900">
                {selected.name}
              </p>
              <p className="text-sm text-gray-500">{selected.email}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900">
                ₦{selected.walletBalance.toLocaleString()}
              </p>
              <Badge
                className={`text-xs ${kycColor[selected.kycStatus] || kycColor.not_started}`}
              >
                KYC: {selected.kycStatus}
              </Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type Toggle */}
            <div>
              <Label className="text-gray-700 font-semibold mb-2 block">
                Adjustment Type
              </Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setType("credit")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${
                    type === "credit"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Credit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setType("debit")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${
                    type === "debit"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  Debit (-)
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount" className="text-gray-700 font-semibold">
                Amount (₦)
              </Label>
              <Input
                id="amount"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
                required
                className="mt-1"
              />
            </div>

            {/* Note */}
            <div>
              <Label htmlFor="note" className="text-gray-700 font-semibold">
                Note{" "}
                <span className="text-gray-400 font-normal">
                  (shown to user)
                </span>
              </Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Bonus credit, Refund for failed transaction..."
                className="mt-1"
              />
            </div>

            {/* Preview */}
            {amount && (
              <div
                className={`rounded-xl p-4 text-sm font-medium ${type === "credit" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {type === "credit" ? "+" : "-"}₦
                {parseFloat(amount || 0).toLocaleString()} → New balance: ₦
                {(
                  selected.walletBalance +
                  (type === "credit" ? parseFloat(amount) : -parseFloat(amount))
                ).toLocaleString()}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting || !amount}
                className={`flex-1 font-bold text-white ${type === "credit" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {submitting
                  ? "Processing..."
                  : `Confirm ${type === "credit" ? "Credit" : "Debit"}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelected(null);
                  setAmount("");
                  setNote("");
                  setQuery("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
