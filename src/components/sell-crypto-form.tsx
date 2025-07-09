'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cryptoCurrencies } from '@/lib/data';
import { sellCrypto } from '@/app/(app)/sell-crypto/actions';

const formSchema = z.object({
  crypto: z.string().min(1, { message: 'Please select a cryptocurrency.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
});

export function SellCryptoForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [rate, setRate] = useState(68000); // Mock rate
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crypto: 'btc',
      amount: 0.01,
    },
  });

  const cryptoAmount = form.watch('amount');
  const amountInUSD = cryptoAmount * rate;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await sellCrypto(values);
      if (result.success) {
        toast({
          title: 'Sale Initiated',
          description: result.data.message,
        });
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to process sale.',
        });
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Sell Cryptocurrency</CardTitle>
        <CardDescription>Enter the amount of crypto you want to sell.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="crypto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cryptocurrency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a crypto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cryptoCurrencies.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Sell ({form.getValues('crypto').toUpperCase()})</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="e.g., 0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-4 bg-muted rounded-md text-sm">
                <p>You will receive approximately: <span className="font-bold text-primary">${amountInUSD.toFixed(2)}</span></p>
                <p className="text-xs text-muted-foreground">Rate: 1 {form.getValues('crypto').toUpperCase()} ≈ ${rate.toLocaleString()}. Final amount may vary.</p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sell Crypto
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
