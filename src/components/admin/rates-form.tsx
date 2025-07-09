'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateRates } from "@/app/admin/actions";
import { Separator } from "../ui/separator";

const formSchema = z.object({
    btcBuySpread: z.coerce.number(),
    btcSellSpread: z.coerce.number(),
    giftCardBuyRate: z.coerce.number().min(0).max(1),
});

export function RatesForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // In a real app, these values would be fetched from your database.
    const currentRates = {
        btcBuySpread: 1.5, // 1.5% above market rate
        btcSellSpread: 1.5, // 1.5% below market rate
        giftCardBuyRate: 0.85, // We buy at 85% of face value
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: currentRates,
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
          const result = await updateRates(values);
          if (result.success) {
            toast({
              title: "Success",
              description: "Service rates have been updated.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description: result.error || "Failed to update rates.",
            });
          }
        } catch (e) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "An unexpected error occurred.",
          });
        } finally {
          setIsLoading(false);
        }
    }


    return (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Cryptocurrency Rates</CardTitle>
                    <CardDescription>
                        Set the percentage spread for buying and selling crypto. This is applied to the market rate from your provider (e.g., Binance).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="btcBuySpread"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Buy Spread (%)</FormLabel>
                                    <FormControl>
                                    <Input type="number" step="0.1" placeholder="e.g., 1.5" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="btcSellSpread"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sell Spread (%)</FormLabel>
                                    <FormControl>
                                    <Input type="number" step="0.1" placeholder="e.g., 1.5" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Separator className="my-6" />
                             <CardTitle>Gift Card Rates</CardTitle>
                             <CardDescription>Set the percentage of face value you pay for gift cards.</CardDescription>
                             <FormField
                                control={form.control}
                                name="giftCardBuyRate"
                                render={({ field }) => (
                                <FormItem className="mt-4">
                                    <FormLabel>Buy Rate (e.g., 0.85 for 85%)</FormLabel>
                                    <FormControl>
                                    <Input type="number" step="0.01" placeholder="e.g., 0.85" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Rates
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle>How Rates Work</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-4">
                    <div>
                        <h4 className="font-semibold text-card-foreground">Crypto Buy Spread</h4>
                        <p>When a user buys crypto, their price is: <br /> <code className="bg-primary/10 text-primary p-1 rounded">Market Price + (Market Price * Buy Spread / 100)</code></p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-card-foreground">Crypto Sell Spread</h4>
                        <p>When a user sells crypto, their price is: <br /> <code className="bg-primary/10 text-primary p-1 rounded">Market Price - (Market Price * Sell Spread / 100)</code></p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-card-foreground">Gift Card Buy Rate</h4>
                        <p>When a user sells a $100 gift card, they receive: <br /> <code className="bg-primary/10 text-primary p-1 rounded">$100 * Buy Rate</code></p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
