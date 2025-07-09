
"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { buyData, getDataPlans } from "@/app/(app)/buy-data/actions";

const formSchema = z.object({
  serviceId: z.string().min(1, { message: "Please select a network." }),
  variationCode: z.string().min(1, { message: "Please select a data plan." }),
  phoneNumber: z.string().regex(/^0[789][01]\d{8}$/, { message: "Please enter a valid Nigerian phone number." }),
});

const networks = [
  { value: "mtn", label: "MTN" },
  { value: "glo", label: "Glo" },
  { value: "airtel", label: "Airtel" },
  { value: "9mobile", label: "9mobile" },
];

type DataPlan = { variation_code: string; name: string };

export function BuyDataForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPlans, setIsFetchingPlans] = useState(false);
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: "",
      variationCode: "",
      phoneNumber: "",
    },
  });

  const selectedNetwork = useWatch({
    control: form.control,
    name: "serviceId",
  });

  useEffect(() => {
    if (selectedNetwork) {
      setIsFetchingPlans(true);
      setDataPlans([]);
      form.setValue("variationCode", "");
      getDataPlans(selectedNetwork)
        .then(setDataPlans)
        .finally(() => setIsFetchingPlans(false));
    }
  }, [selectedNetwork, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await buyData(values);
      if (result.success) {
        toast({
          title: "Success",
          description: "Data bundle purchased successfully.",
        });
        form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to purchase data.",
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
        <CardTitle>Purchase Data Bundle</CardTitle>
        <CardDescription>
          Select a network and data plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="serviceId"
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
              name="variationCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Plan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedNetwork || isFetchingPlans}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isFetchingPlans ? "Loading plans..." : "Select a data plan"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dataPlans.map((plan) => (
                        <SelectItem key={plan.variation_code} value={plan.variation_code}>
                          {plan.name}
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
            
            <Button type="submit" disabled={isLoading || isFetchingPlans} className="w-full">
              {(isLoading || isFetchingPlans) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buy Data
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
