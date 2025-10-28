// Frontend: /app/(app)/dashboard/kyc/page.jsx
"use client";
import { useState } from "react";

export default function KycPage() {
  const [formData, setFormData] = useState({
    account_number: "",
    bvn: "",
    bank_code: "",
    first_name: "",
    last_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/paystack/bvn-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          text: "Verification started. Result via webhook.",
          type: "success",
        });
      } else {
        setMessage({ text: data.message, type: "error" });
      }
    } catch {
      setMessage({ text: "Connection failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "account_number", label: "Account Number" },
    { name: "bvn", label: "BVN" },
    { name: "bank_code", label: "Bank Code" },
    { name: "first_name", label: "First Name" },
    { name: "last_name", label: "Last Name" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
          <h1 className="text-2xl font-semibold text-center">
            KYC Verification
          </h1>
          <p className="text-center text-slate-200 text-sm mt-1">
            Secure identity confirmation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {field.label}
                </label>
                <input
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 transition"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto md:min-w-48 mt-6 bg-slate-900 text-white py-3 px-8 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-60 transition mx-auto block"
          >
            {loading ? "Submitting..." : "Start Verification"}
          </button>
        </form>

        {message && (
          <div
            className={`mx-6 mb-6 p-4 rounded-lg text-sm font-medium flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            <span>{message.type === "success" ? "Success" : "Error"}</span>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
