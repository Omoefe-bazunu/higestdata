"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext"; // Import Auth Context

const SmmOrder = () => {
  // Get user from context
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("new"); // 'new' or 'history'

  // -- Data States --
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);

  // -- Form States --
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Initial Data Load (Services don't need auth usually, but good practice)
  useEffect(() => {
    fetchServices();
  }, []);

  // 2. Fetch Services
  const fetchServices = async () => {
    try {
      const res = await fetch(
        "https://higestdata-proxy.onrender.com/api/smm/services"
      );
      const data = await res.json();
      if (data.success) {
        setServices(data.data);
        const uniqueCategories = [
          ...new Set(data.data.map((item) => item.category)),
        ];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Failed to load services", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch History (Now gets token internally)
  const fetchHistory = async () => {
    if (!user) return; // Guard clause

    setHistoryLoading(true);
    try {
      const token = await user.getIdToken(); // Get fresh token
      const res = await fetch(
        "https://higestdata-proxy.onrender.com/api/smm/orders",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setOrderHistory(data.data);
      }
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // -- Event Handlers --

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "history") {
      fetchHistory();
    }
  };

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    const filtered = services.filter((s) => s.category === cat);
    setFilteredServices(filtered);
    setSelectedService(null);
    setQuantity("");
    setTotalPrice(0);
  };

  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    const service = services.find((s) => s.service == serviceId);
    setSelectedService(service);
    calculatePrice(quantity, service);
  };

  const handleQuantityChange = (e) => {
    const qty = e.target.value;
    setQuantity(qty);
    calculatePrice(qty, selectedService);
  };

  const calculatePrice = (qty, service) => {
    if (!qty || !service) {
      setTotalPrice(0);
      return;
    }
    const price = (parseFloat(service.user_rate) * parseInt(qty)) / 1000;
    setTotalPrice(price);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to place an order");
      return;
    }
    if (!selectedService || !link || !quantity) return;

    if (
      quantity < parseInt(selectedService.min) ||
      quantity > parseInt(selectedService.max)
    ) {
      alert(
        `Quantity must be between ${selectedService.min} and ${selectedService.max}`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Get fresh token right before request
      const token = await user.getIdToken();

      const res = await fetch(
        "https://higestdata-proxy.onrender.com/api/smm/order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            serviceId: selectedService.service,
            serviceName: selectedService.name,
            categoryName: selectedService.category,
            link: link,
            quantity: parseInt(quantity),
          }),
        }
      );

      const result = await res.json();

      if (result.success) {
        alert("Order Placed Successfully! View status in 'Order History'.");
        setLink("");
        setQuantity("");
        setTotalPrice(0);
        handleTabChange("history");
      } else {
        alert(result.error || "Order failed");
      }
    } catch (error) {
      console.error(error);
      alert("Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    const s = status.toLowerCase();
    if (s === "completed") return "bg-green-100 text-green-800";
    if (s === "processing" || s === "in progress")
      return "bg-blue-100 text-blue-800";
    if (s === "pending") return "bg-yellow-100 text-yellow-800";
    if (s === "canceled" || s === "failed") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading Services...</div>
    );

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => handleTabChange("new")}
          className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
            activeTab === "new"
              ? "bg-white text-blue-600 border-b-2 border-blue-600"
              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
          }`}
        >
          New Order
        </button>
        <button
          onClick={() => handleTabChange("history")}
          className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
            activeTab === "history"
              ? "bg-white text-blue-600 border-b-2 border-blue-600"
              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
          }`}
        >
          📜 Order History
        </button>
      </div>

      {activeTab === "new" && (
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            Boost Your Presence 🚀
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Select a platform and package to start.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform / Category
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedCategory}
                onChange={handleCategoryChange}
                required
              >
                <option value="">-- Choose Category --</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Package
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={handleServiceChange}
                  required
                >
                  <option value="">-- Choose Service --</option>
                  {filteredServices.map((s) => (
                    <option key={s.service} value={s.service}>
                      {s.name} - ₦{s.user_rate}/1k
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedService && (
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 animate-in fade-in duration-300">
                <div className="flex justify-between mb-1">
                  <span>
                    Min Quantity: <strong>{selectedService.min}</strong>
                  </span>
                  <span>
                    Max Quantity: <strong>{selectedService.max}</strong>
                  </span>
                </div>
                <div className="text-xs opacity-75">
                  Rate: ₦{selectedService.user_rate} per 1,000 units
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link (Post/Profile URL)
              </label>
              <input
                type="url"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 1000"
                value={quantity}
                onChange={handleQuantityChange}
                required
              />
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border">
              <span className="text-gray-600 font-medium">Total Cost:</span>
              <span className="text-2xl font-bold text-green-600">
                ₦
                {totalPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedService || totalPrice <= 0}
              className={`w-full py-4 rounded-lg text-white font-bold text-lg transition-all
                ${
                  isSubmitting || totalPrice <= 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                }`}
            >
              {isSubmitting ? "Processing..." : "Place Order Now"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "history" && (
        <div className="p-0">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Recent Orders</h3>
            <button
              onClick={fetchHistory}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              🔄 Refresh
            </button>
          </div>

          {historyLoading ? (
            <div className="p-8 text-center text-gray-500">
              Updating status...
            </div>
          ) : orderHistory.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p>No orders found.</p>
              <button
                onClick={() => setActiveTab("new")}
                className="mt-2 text-blue-600 text-sm hover:underline"
              >
                Place your first order
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="p-4 font-medium">Service</th>
                    <th className="p-4 font-medium">Qty</th>
                    <th className="p-4 font-medium">Cost</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orderHistory.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <div
                          className="font-medium text-gray-900 truncate max-w-[200px]"
                          title={order.serviceName}
                        >
                          {order.serviceName || `Service #${order.serviceId}`}
                        </div>
                        <a
                          href={order.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-500 hover:underline truncate max-w-[150px] block"
                        >
                          {order.link}
                        </a>
                      </td>
                      <td className="p-4 text-gray-600">{order.quantity}</td>
                      <td className="p-4 font-medium text-gray-900">
                        ₦{order.amountCharged?.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            order.deliveryStatus || order.status
                          )}`}
                        >
                          {order.deliveryStatus || order.status || "Pending"}
                        </span>
                        {order.remains && order.remains !== "0" && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            Remains: {order.remains}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right text-gray-500 text-xs">
                        {order.createdAt?.seconds
                          ? new Date(
                              order.createdAt.seconds * 1000
                            ).toLocaleDateString()
                          : "Just now"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmmOrder;
