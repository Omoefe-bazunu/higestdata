"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MessageSquare,
  Users,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BulkSMSPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("");
  const [sender, setSender] = useState("HighestData");
  const [pricePerSms, setPricePerSms] = useState(2);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch price per SMS
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
        }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold ">Bulk SMS Service</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Reach multiple recipients instantly with our reliable bulk SMS
            platform. Powered by VTU Africa for seamless delivery.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* SMS Form Section */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-blue-800 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <MessageSquare className="h-6 w-6" />
                Compose Message
              </CardTitle>
              <CardDescription className="text-blue-100">
                Send messages to multiple numbers at once
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Sender ID */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Sender ID
                </Label>
                <Input
                  maxLength={11}
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="Enter sender name (max 11 characters)"
                  className="h-12 text-base"
                />
                <p className="text-sm text-muted-foreground">
                  This will appear as the sender name on recipients' phones
                </p>
              </div>

              {/* Recipients */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recipients
                </Label>
                <Textarea
                  rows={4}
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="Enter phone numbers separated by commas...
Example: 08012345678, 09087654321, 08123456789"
                  className="resize-none text-xs"
                />
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="text-sm">
                    {recipientCount} valid numbers
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Numbers must be 10+ digits
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Message Content
                </Label>
                <Textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here...
Keep it concise for better delivery rates."
                  className="resize-none text-base"
                />
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="text-sm">
                    {characterCount} characters
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Standard SMS: 160 characters
                  </p>
                </div>
              </div>

              {/* Cost Summary */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Total Cost
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        ₦{totalCost.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        ₦{pricePerSms} × {recipientCount} recipients
                      </p>
                      <Badge variant="outline" className="mt-1">
                        Instant Delivery
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={loading || recipientCount === 0 || !message.trim()}
                className="w-full h-12 text-base font-semibold bg-blue-800  hover:bg-blue-900 "
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending Messages...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Send to {recipientCount} Recipients
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Features & Image Section */}
          <div className="space-y-6">
            {/* Background Image Card */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <div
                className="h-64 bg-cover bg-center rounded-t-lg"
                style={{
                  backgroundImage: "url('/bulksms.png')",
                }}
              />
              <CardContent className="p-6 bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                <h3 className="text-xl font-bold mb-3">
                  Why Choose Our Bulk SMS?
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <span className="text-sm">
                      Instant delivery to all networks
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <span className="text-sm">
                      Pay directly from your wallet
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-sm">
                      Unlimited recipients per message
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <span className="text-sm">Custom sender ID support</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start">
                  <span>
                    1. Keep messages under 160 characters for single SMS rates
                  </span>
                </div>
                <div className="flex items-start">
                  <span>2. Use commas to separate multiple phone numbers</span>
                </div>
                <div className="flex items-start">
                  <span>
                    3. Sender ID must be alphanumeric and 11 characters max
                  </span>
                </div>
                <div className="flex items-start">
                  <span>
                    4. Test with 1-2 numbers first before bulk sending
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
