
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
import { educationPayment } from "@/app/(app)/education/actions";

const formSchema = z.object({
  serviceId: z.string().min(1, { message: "Please select an exam body." }),
  variationCode: z.string().min(1, { message: "Please select a pin type." }),
  profileCode: z.string().optional(),
  phoneNumber: z.string().regex(/^0[789][01]\d{8}$/, { message: "Please enter a valid Nigerian phone number." }),
}).refine(data => !(data.serviceId === 'jamb' && !data.profileCode), {
  message: "Profile Code is required for JAMB",
  path: ["profileCode"],
});

const services = [
  { value: "waec-registration", label: "WAEC Registration PIN" },
  { value: "waec", label: "WAEC Result Checker PIN" },
  { value: "jamb", label: "JAMB PIN Vending" },
];

// In a real app, this would be fetched from the VTPass API
const variations: Record<string, any[]> = {
    'waec-registration': [{ variation_code: 'waec-registration', name: 'Registration PIN', variation_amount: '25000' }],
    'waec': [{ variation_code: 'waec', name: 'Result Checker PIN', variation_amount: '3500' }],
    'jamb': [{ variation_code: 'utme', name: 'UTME PIN', variation_amount: '7500' }, { variation_code: 'de', name: 'Direct Entry PIN', variation_amount: '7500' }],
}

export function EducationPaymentForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: "",
      variationCode: "",
      profileCode: "",
      phoneNumber: "",
    },
  });

  const serviceId = useWatch({ control: form.control, name: 'serviceId' });
  const variationCode = useWatch({ control: form.control, name: 'variationCode' });

  useEffect(() => {
    if(serviceId && variationCode) {
        const variation = variations[serviceId]?.find(v => v.variation_code === variationCode);
        if (variation) {
            setAmount(Number(variation.variation_amount));
        }
    } else {
        setAmount(0);
    }
  }, [serviceId, variationCode]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await educationPayment(values);
      if (result.success) {
        toast({
          title: "Success",
          description: `Payment successful. PIN: ${result.data.pin}`,
        });
        form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to complete payment.",
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
        <CardTitle>Education Payment</CardTitle>
        <CardDescription>
          Purchase pins for WAEC or JAMB.
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
                  <FormLabel>Service</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.value} value={service.value}>
                          {service.label}
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
                  <FormLabel>PIN Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!serviceId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a PIN type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(variations[serviceId] || []).map((v) => (
                        <SelectItem key={v.variation_code} value={v.variation_code}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serviceId === 'jamb' && (
                 <FormField
                  control={form.control}
                  name="profileCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>JAMB Profile Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your 10-digit profile code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g., 08012345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {amount > 0 && <div className="text-lg font-bold text-center">Amount: ₦{amount.toLocaleString()}</div>}
            
            <Button type="submit" disabled={isLoading || amount === 0} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Pay Now
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
