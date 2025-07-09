
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { convertAirtimeToCash } from "@/app/(app)/airtime-to-cash/actions";

const formSchema = z.object({
  network: z.string().min(1, { message: "Please select a network." }),
  phoneNumber: z.string().regex(/^0[789][01]\d{8}$/, { message: "Please enter a valid Nigerian phone number." }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
});

const networks = [
  { value: "mtn", label: "MTN" },
  { value: "glo", label: "Glo" },
  { value: "airtel", label: "Airtel" },
  { value: "9mobile", label: "9mobile" },
];

export function AirtimeToCashForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      network: "",
      phoneNumber: "",
      amount: 1000,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await convertAirtimeToCash(values);
      if (result.success) {
        toast({
          title: "Request Submitted",
          description: result.data.message,
        });
        form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to process request.",
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
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Conversion Details</CardTitle>
        <CardDescription>
          Enter the details for your airtime to cash conversion. A fee applies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="network"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Network</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a network" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {networks.map((network) => (
                        <SelectItem key={network.value} value={network.value}>
                          {network.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 08012345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Airtime Amount (₦)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Convert to Cash
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
