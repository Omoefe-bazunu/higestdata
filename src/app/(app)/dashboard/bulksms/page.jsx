"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MessageSquare,
  Users,
  CreditCard,
  Smartphone,
  ChevronLeft,
  Send,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function BulkSMSPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("");
  const [sender, setSender] = useState("HighestData");
  const [pricePerSms, setPricePerSms] = useState(2);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRate = async () => {
      const snap = await getDoc(doc(firestore, "settings", "smsRates"));
      if (snap.exists()) setPricePerSms(snap.data().pricePerSms || 2);
    };
    fetchRate();
  }, []);

  const recipientCount = recipients
    .split(",")
    .filter((n) => n.trim().length >= 10).length;
  const totalCost = recipientCount * pricePerSms;
  const characterCount = message.length;

  const handleSend = async () => {
    if (recipientCount === 0)
      return toast({
        title: "Error",
        description: "Please add valid phone numbers",
        variant: "destructive",
      });
    if (!message.trim())
      return toast({
        title: "Error",
        description: "Message content is required",
        variant: "destructive",
      });

    setLoading(true);
    const ref = `SMS_${Date.now()}`;
    const token = await user.getIdToken();

    try {
      const res = await fetch(
        "https://higestdata-proxy.onrender.com/api/sms/purchase",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: message.trim(),
            sendto: recipients,
            sender: sender.slice(0, 11),
            ref,
          }),
        },
      );

      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Success!",
          description: `SMS sent to ${recipientCount} recipients. ₦${totalCost} charged from your wallet.`,
        });
        setMessage("");
        setRecipients("");
        setSender("HighestData");
      } else {
        toast({
          title: "Failed to Send",
          description: data.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link
            href="/dashboard/tools"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-950 transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Services
          </Link>

          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-blue-950">
              Bulk{" "}
              <span className="text-orange-400 text-nowrap">SMS Service</span>
            </h1>
            <p className="mt-1 text-slate-600">
              Broadcast messages to thousands of recipients with a single click.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden border-none shadow-2xl ring-1 ring-slate-200">
          <div className="grid md:grid-cols-5 lg:grid-cols-2">
            {/* Visual Branding Column (First on Mobile) */}
            <div className="flex flex-col md:col-span-2 lg:col-span-1 bg-blue-950 text-white p-8 md:p-10 justify-center relative overflow-hidden order-first md:order-last">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-orange-400 rounded-full opacity-10 blur-3xl"></div>

              <div className="relative z-10 border border-white/10 rounded-2xl overflow-hidden aspect-video shadow-2xl mb-8">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 to-transparent z-10"></div>
                <img
                  src="/bulksms.png"
                  alt="SMS Illustration"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                  <div className="bg-orange-400 p-1.5 rounded-full">
                    <Send className="h-4 w-4 text-blue-950" />
                  </div>
                  <span className="text-white font-bold text-sm tracking-wide uppercase">
                    Messaging Hub
                  </span>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <h3 className="text-xl font-bold text-white">
                  Why our Bulk SMS?
                </h3>
                <div className="space-y-4">
                  {[
                    "Instant delivery to all DND and non-DND numbers",
                    "Customized Sender ID for brand recognition",
                    "Detailed cost breakdown before sending",
                    "Automatic wallet deductions",
                  ].map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-blue-100 text-sm"
                    >
                      <CheckCircle2 className="h-5 w-5 text-orange-400 shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                <Alert className="bg-blue-900/40 border-blue-800 text-blue-100 mt-6">
                  <AlertDescription className="text-xs">
                    Test your message with 1-2 numbers before sending in bulk to
                    ensure content compliance.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Form Column */}
            <div className="p-6 md:p-10 md:col-span-3 lg:col-span-1 bg-white">
              <div className="space-y-6">
                {/* Sender ID */}
                <div className="space-y-2">
                  <Label className="text-blue-950 font-semibold">
                    Sender Name (Max 11 characters)
                  </Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      maxLength={11}
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                      placeholder="e.g. HighestData"
                      className="h-12 pl-10 border-slate-200 focus:ring-blue-950"
                    />
                  </div>
                </div>

                {/* Recipients */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <Label className="text-blue-950 font-semibold">
                      Recipients
                    </Label>
                    <Badge
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      {recipientCount} numbers detected
                    </Badge>
                  </div>
                  <Textarea
                    rows={4}
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    placeholder="08012345678, 09087654321..."
                    className="resize-none border-slate-200 focus:ring-blue-950 min-h-[100px]"
                  />
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider italic">
                    Separate numbers with commas (,)
                  </p>
                </div>

                {/* Message Content */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <Label className="text-blue-950 font-semibold">
                      Message Content
                    </Label>
                    <Badge
                      variant="secondary"
                      className="bg-blue-50 text-blue-700"
                    >
                      {characterCount} characters
                    </Badge>
                  </div>
                  <Textarea
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="resize-none border-slate-200 focus:ring-blue-950 min-h-[120px]"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    160 characters = 1 Page. Current:{" "}
                    {Math.ceil(characterCount / 160)} page(s)
                  </p>
                </div>

                {/* Cost Analysis */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 shadow-inner">
                  <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest">
                    <span>Rate Per SMS</span>
                    <span className="text-blue-950">
                      ₦{pricePerSms.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest">
                    <span>Recipients</span>
                    <span className="text-blue-950">{recipientCount}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-950" />
                      <span className="text-blue-950 font-bold">
                        Total Charge
                      </span>
                    </div>
                    <span className="text-2xl font-black text-blue-950 tracking-tighter">
                      ₦{totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={loading || recipientCount === 0 || !message.trim()}
                  className="w-full h-14 text-lg font-bold bg-blue-950 hover:bg-blue-900 shadow-lg shadow-blue-950/10 active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Broadcasting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Send Bulk SMS</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
