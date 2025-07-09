
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
import { payBill } from "@/app/(app)/pay-bills/actions";

const formSchema = z.object({
  category: z.string().min(1, { message: "Please select a category." }),
  serviceId: z.string().min(1, { message: "Please select a provider." }),
  customerId: z.string().min(1, { message: "Customer ID is required." }),
  amount: z.coerce.number().positive().optional(),
  variationCode: z.string().min(1).optional(),
}).refine(data => {
    const isElectricity = ['ikeja-electric', 'eko-electric'].includes(data.serviceId);
    return !(isElectricity && !data.amount);
}, {
    message: "Amount is required for electricity bills.",
    path: ["amount"],
}).refine(data => {
    const isTv = ['dstv', 'gotv', 'startimes'].includes(data.serviceId);
    return !(isTv && !data.variationCode);
}, {
    message: "Plan/Bouquet is required for TV subscriptions.",
    path: ["variationCode"],
});


const billerCategories = [
    { value: 'electricity', label: 'Electricity' },
    { value: 'tv', label: 'TV Subscription' },
];

const providers: Record<string, { value: string; label: string }[]> = {
    electricity: [
        { value: 'ikeja-electric', label: 'IKEDC (Ikeja Electric)'},
        { value: 'eko-electric', label: 'EKEDC (Eko Electric)'},
    ],
    tv: [
        { value: 'dstv', label: 'DSTV'},
        { value: 'gotv', label: 'GOTV'},
        { value: 'startimes', label: 'StarTimes'},
    ]
}

// In a real app, these would be fetched from VTPass API
const tvPlans: Record<string, { variation_code: string; name: string }[]> = {
    dstv: [ { variation_code: 'dstv-padi', name: 'DStv Padi' } ],
    gotv: [ { variation_code: 'gotv-jolli', name: 'GOtv Jolli' } ],
    startimes: [ { variation_code: 'nova', name: 'Nova Bouquet' } ],
}

export function PayBillsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      serviceId: "",
      customerId: "",
    },
  });

  const category = useWatch({ control: form.control, name: "category" });
  const serviceId = useWatch({ control: form.control, name: "serviceId" });

  useEffect(() => {
    form.setValue("serviceId", "");
  }, [category, form]);

  useEffect(() => {
    form.setValue("variationCode", "");
  }, [serviceId, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await payBill(values);
      if (result.success) {
        toast({
          title: "Success",
          description: "Bill payment was successful.",
        });
        form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to pay bill.",
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
        <CardTitle>Bill Payment</CardTitle>
        <CardDescription>
          Choose a biller and enter payment details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {billerCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {category && (
                <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(providers[category] || []).map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {serviceId && (
                <>
                    <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{category === 'tv' ? 'Smart Card / IUC Number' : 'Meter Number'}</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter customer number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    {category === 'electricity' && (
                         <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Amount (₦)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 5000" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                     {category === 'tv' && (
                         <FormField
                            control={form.control}
                            name="variationCode"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Plan / Bouquet</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a plan" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {(tvPlans[serviceId] || []).map((plan) => (
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
                    )}
                </>
            )}
            
            <Button type="submit" disabled={isLoading || !serviceId} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Pay Bill
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
