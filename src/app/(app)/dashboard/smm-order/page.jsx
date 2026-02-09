"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader,
  ChevronLeft,
  CheckCircleIcon,
  History,
  Link as LinkIcon,
  Layers,
  ArrowRight,
  RefreshCcw,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const SmmOrder = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("new");

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

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch(
        "https://higestdata-proxy.onrender.com/api/smm/services",
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

  const fetchHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        "https://higestdata-proxy.onrender.com/api/smm/orders",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) setOrderHistory(data.data);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "history") fetchHistory();
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    const filtered = services.filter((s) => s.category === cat);
    setFilteredServices(filtered);
    setSelectedService(null);
    setQuantity("");
    setTotalPrice(0);
  };

  const handleServiceChange = (serviceId) => {
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
        `Quantity must be between ${selectedService.min} and ${selectedService.max}`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
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
        },
      );
      const result = await res.json();
      if (result.success) {
        alert("Order Placed Successfully!");
        setLink("");
        setQuantity("");
        setTotalPrice(0);
        handleTabChange("history");
      } else {
        alert(result.error || "Order failed");
      }
    } catch (error) {
      alert("Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-slate-100 text-slate-800";
    const s = status.toLowerCase();
    if (s === "completed") return "bg-green-100 text-green-700";
    if (s === "processing" || s === "in progress")
      return "bg-blue-100 text-blue-700";
    if (s === "pending") return "bg-orange-100 text-orange-700";
    if (s === "canceled" || s === "failed") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-800";
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader className="h-10 w-10 animate-spin text-blue-950" />
        <p className="text-sm font-bold text-blue-950 uppercase tracking-widest">
          Loading Services...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="space-y-4">
          <Link
            href="/dashboard/tools"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-950 group"
          >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />{" "}
            Back to Services
          </Link>
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-blue-950">
              Social Media <span className="text-orange-400">Boost</span>
            </h1>
            <p className="mt-1 text-slate-600">
              Grow your presence across all major social platforms instantly.
            </p>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-200/50 p-1 rounded-xl h-12">
            <TabsTrigger
              value="new"
              className="rounded-lg font-bold data-[state=active]:bg-blue-950 data-[state=active]:text-white"
            >
              <CheckCircleIcon className="w-4 h-4 mr-2" /> New Order
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg font-bold data-[state=active]:bg-blue-950 data-[state=active]:text-white"
            >
              <History className="w-4 h-4 mr-2" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-0">
            <Card className="overflow-hidden border-none shadow-2xl ring-1 ring-slate-200">
              <div className="grid md:grid-cols-5 lg:grid-cols-2">
                {/* Branding Sidebar */}
                <div className="flex flex-col md:col-span-2 lg:col-span-1 bg-blue-950 text-white p-8 md:p-10 justify-between relative overflow-hidden order-first md:order-last">
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-orange-400 rounded-full opacity-10 blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="bg-orange-400/20 p-3 rounded-2xl w-fit mb-6">
                      <CheckCircleIcon className="h-8 w-8 text-orange-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Go Viral Faster</h3>
                    <p className="text-blue-200 text-sm leading-relaxed mb-8">
                      Select high-quality services for Instagram, Facebook,
                      TikTok, and more. Our automated system begins processing
                      your order immediately.
                    </p>
                    <div className="space-y-4">
                      {[
                        "Instant Processing",
                        "High Retention Rate",
                        "24/7 Support",
                      ].map((text, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 text-sm font-medium"
                        >
                          <ShieldCheck className="h-5 w-5 text-orange-400" />{" "}
                          {text}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="relative z-10 pt-10 border-t border-white/10 mt-10">
                    <p className="text-[10px] uppercase font-black tracking-widest text-blue-400">
                      Trusted SMM Provider
                    </p>
                  </div>
                </div>

                {/* Form Column */}
                <div className="p-6 md:p-10 md:col-span-3 lg:col-span-1 bg-white">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-blue-950 font-bold flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Platform Category
                      </Label>
                      <Select
                        value={selectedCategory}
                        onValueChange={handleCategoryChange}
                      >
                        <SelectTrigger className="h-12 border-slate-200 focus:ring-blue-950">
                          <SelectValue placeholder="Choose Platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat, idx) => (
                            <SelectItem key={idx} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCategory && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-blue-950 font-bold">
                          Service Package
                        </Label>
                        <Select onValueChange={handleServiceChange}>
                          <SelectTrigger className="h-12 border-slate-200">
                            <SelectValue placeholder="Select specific service" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredServices.map((s) => (
                              <SelectItem
                                key={s.service}
                                value={s.service.toString()}
                              >
                                {s.name} - ₦{s.user_rate}/1k
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedService && (
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-1 animate-in zoom-in-95">
                        <div className="flex justify-between text-xs font-black uppercase text-blue-400 tracking-tighter">
                          <span>Min: {selectedService.min}</span>
                          <span>Max: {selectedService.max}</span>
                        </div>
                        <p className="text-xs text-blue-900 font-medium leading-relaxed">
                          Rate:{" "}
                          <span className="font-bold text-blue-950">
                            ₦{selectedService.user_rate}
                          </span>{" "}
                          per 1,000 units.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-blue-950 font-bold flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" /> Link / URL
                      </Label>
                      <Input
                        type="url"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="https://instagram.com/p/..."
                        className="h-12 border-slate-200"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-blue-950 font-bold">
                        Quantity
                      </Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={handleQuantityChange}
                        placeholder="Enter number of units"
                        className="h-12 border-slate-200"
                        required
                      />
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex justify-between items-center shadow-inner">
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
                          Estimated Total
                        </p>
                        <p className="text-2xl font-black text-blue-950">
                          ₦
                          {totalPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200 font-bold">
                        Wallet Payment
                      </Badge>
                    </div>

                    <Button
                      type="submit"
                      disabled={
                        isSubmitting || !selectedService || totalPrice <= 0
                      }
                      className="w-full h-14 text-lg font-bold bg-blue-950 hover:bg-blue-900 shadow-xl shadow-blue-950/10 active:scale-[0.98] transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="mr-2 h-5 w-5 animate-spin" />{" "}
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-5 h-5 mr-2" /> Place
                          Order Now
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <Card className="border-none shadow-xl ring-1 ring-slate-200 overflow-hidden bg-white">
              <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
                <div>
                  <CardTitle className="text-blue-950 text-xl">
                    Order History
                  </CardTitle>
                  <CardDescription>
                    Track the status of your recent boosts.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchHistory}
                  className="border-blue-950 text-blue-950 hover:bg-blue-50"
                >
                  <RefreshCcw
                    className={`w-4 h-4 mr-2 ${historyLoading ? "animate-spin" : ""}`}
                  />{" "}
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {historyLoading ? (
                  <div className="p-20 text-center flex flex-col items-center gap-3">
                    <Loader className="h-8 w-8 animate-spin text-blue-950" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Updating History...
                    </p>
                  </div>
                ) : orderHistory.length === 0 ? (
                  <div className="p-20 text-center space-y-4">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                      <History className="text-slate-400 h-8 w-8" />
                    </div>
                    <p className="text-slate-500 font-medium">
                      No orders found.
                    </p>
                    <Button
                      onClick={() => setActiveTab("new")}
                      variant="link"
                      className="text-orange-400 font-bold uppercase text-xs"
                    >
                      Start your first boost{" "}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b">
                        <tr>
                          <th className="px-6 py-4">Service Details</th>
                          <th className="px-6 py-4">Quantity</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orderHistory.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <p
                                className="font-bold text-blue-950 line-clamp-1 max-w-[250px]"
                                title={order.serviceName}
                              >
                                {order.serviceName ||
                                  `Service #${order.serviceId}`}
                              </p>
                              <a
                                href={order.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-500 font-medium flex items-center gap-1 hover:underline mt-1"
                              >
                                <ExternalLink className="w-2 h-2" /> View Link
                              </a>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-600">
                              {order.quantity.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 font-black text-blue-950">
                              ₦{order.amountCharged?.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                className={`${getStatusColor(order.deliveryStatus || order.status)} border-none shadow-none font-bold text-[10px] uppercase`}
                              >
                                {order.deliveryStatus ||
                                  order.status ||
                                  "Pending"}
                              </Badge>
                              {order.remains && order.remains !== "0" && (
                                <p className="text-[9px] text-slate-400 mt-1 font-bold">
                                  REMAINS: {order.remains}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-slate-400 font-medium text-[11px]">
                              {order.createdAt?.seconds
                                ? new Date(
                                    order.createdAt.seconds * 1000,
                                  ).toLocaleDateString()
                                : "Just now"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SmmOrder;
