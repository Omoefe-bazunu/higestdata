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
import Image from "next/image";
import { CheckCircle } from "lucide-react";

function PurchaseForm({ type }) {
  return (
    <form className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="network">Network Provider</Label>
        <Select name="network">
          <SelectTrigger id="network">
            <SelectValue placeholder="Select Network" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mtn">MTN</SelectItem>
            <SelectItem value="glo">Glo</SelectItem>
            <SelectItem value="airtel">Airtel</SelectItem>
            <SelectItem value="9mobile">9mobile</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" name="phone" type="tel" placeholder="08012345678" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">
          {type === "Airtime" ? "Amount" : "Data Plan"}
        </Label>
        {type === "Airtime" ? (
          <Input
            id="amount"
            name="amount"
            type="number"
            placeholder="e.g., 1000"
          />
        ) : (
          <Select name="data-plan">
            <SelectTrigger id="data-plan">
              <SelectValue placeholder="Select Data Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1gb">1.5GB - 30 Days - ₦1,000</SelectItem>
              <SelectItem value="5gb">5GB - 30 Days - ₦2,500</SelectItem>
              <SelectItem value="10gb">12GB - 30 Days - ₦5,000</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        The amount will be deducted from your wallet balance.
      </p>

      <Button type="submit" className="w-full">
        Purchase {type}
      </Button>
    </form>
  );
}

export default function BuyAirtimePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Buy Airtime & Data</h1>
        <p className="text-muted-foreground">
          Instantly top up any phone number. It's fast, easy, and reliable.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <Tabs defaultValue="airtime" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="airtime">Airtime</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>
              <TabsContent value="airtime">
                <CardHeader className="px-0">
                  <CardTitle>Buy Airtime</CardTitle>
                  <CardDescription>
                    Enter details to top up airtime.
                  </CardDescription>
                </CardHeader>
                <PurchaseForm type="Airtime" />
              </TabsContent>
              <TabsContent value="data">
                <CardHeader className="px-0">
                  <CardTitle>Buy Data</CardTitle>
                  <CardDescription>
                    Choose a data plan that suits you.
                  </CardDescription>
                </CardHeader>
                <PurchaseForm type="Data" />
              </TabsContent>
            </Tabs>
          </div>
          <div className="bg-muted/50 p-8 md:p-12 flex flex-col justify-center">
            <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
              <Image
                src="https://placehold.co/600x400.png"
                alt="Mobile top-up illustration"
                fill
                style={{ objectFit: "cover" }}
                data-ai-hint="mobile payment"
              />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-secondary-foreground">
              Seamlessly Connected
            </h3>
            <p className="text-muted-foreground mb-4">
              Stay online and in touch. Our service is available 24/7, so you
              can recharge anytime, anywhere.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Instant delivery on all networks</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Secure payments from your wallet</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Competitive rates and data plans</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
