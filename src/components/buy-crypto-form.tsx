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
import { buyCrypto } from '@/app/(app)/buy-crypto/actions';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const formSchema = z.object({
  crypto: z.string().min(1, { message: 'Please select a cryptocurrency.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
  source: z.enum(['wallet', 'card'], { required_error: 'You need to select a payment source.' }),
});

export function BuyCryptoForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [rate, setRate] = useState(0.000015); // Mock rate
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crypto: 'btc',
      amount: 100,
      source: 'wallet',
    },
  });

  const amountInUSD = form.watch('amount');
  const cryptoAmount = amountInUSD * rate;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await buyCrypto(values);
      if (result.success) {
        toast({
          title: 'Purchase Initiated',
          description: result.data.message,
        });
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to process purchase.',
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
        <CardTitle>Buy Cryptocurrency</CardTitle>
        <CardDescription>Enter the amount you want to spend.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Spend (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>

            <div className="p-4 bg-muted rounded-md text-sm">
                <p>You will get approximately: <span className="font-bold text-primary">{cryptoAmount.toFixed(8)} {form.getValues('crypto').toUpperCase()}</span></p>
                <p className="text-xs text-muted-foreground">Rate: 1 USD ≈ {rate.toFixed(8)} {form.getValues('crypto').toUpperCase()}. Final amount may vary.</p>
            </div>

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Payment Source</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="wallet" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          From Wallet Balance ($1,250.75 available)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="card" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Pay with Card (Coming Soon)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buy Crypto
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
