import React, { useState } from "react";

const SmmAdmin = ({ userToken }) => {
  const [profit, setProfit] = useState(20); // Default 20%
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://higestdata-proxy.onrender.com/api/admin/smm-rates",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({ profitPercentage: parseFloat(profit) }),
        }
      );

      const data = await res.json();
      if (data.success) {
        alert("Rates updated successfully!");
      }
    } catch (error) {
      alert("Failed to update rates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-md">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        SMM Pricing Control
      </h3>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">
          Global Profit Margin (%)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={profit}
            onChange={(e) => setProfit(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span className="text-gray-500">%</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          This percentage is added to the base cost from OgaViral.
          <br />
          Example: If cost is ₦100 and margin is 20%, user pays ₦120.
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 transition-colors"
      >
        {loading ? "Saving..." : "Update Rates"}
      </button>
    </div>
  );
};

export default SmmAdmin;
