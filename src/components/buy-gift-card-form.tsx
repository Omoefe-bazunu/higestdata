'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { giftCardBrands } from '@/lib/data';
import { buyGiftCard } from '@/app/(app)/buy-gift-card/actions';

const formSchema = z.object({
  brand: z.string().min(1, { message: 'Please select a brand.' }),
  amount: z.coerce.number().positive({ message: 'Please select an amount.' }),
});

const availableAmounts = [25, 50, 100, 200];

export function BuyGiftCardForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand: '',
      amount: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await buyGiftCard(values);
      if (result.success) {
        toast({
          title: 'Purchase Successful',
          description: result.data.message,
        });
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to purchase gift card.',
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
        <CardTitle>Buy a Gift Card</CardTitle>
        <CardDescription>Select a brand and amount to purchase.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gift Card Brand</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a brand" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {giftCardBrands.map((brand) => (
                        <SelectItem key={brand.value} value={brand.value}>
                          <div className="flex items-center gap-2">
                             <Image src={brand.image} alt={brand.label} width={32} height={20} className="rounded-sm" data-ai-hint={brand['data-ai-hint']} />
                            <span>{brand.label}</span>
                          </div>
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
                  <FormLabel>Amount (USD)</FormLabel>
                  <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an amount" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableAmounts.map((amount) => (
                        <SelectItem key={amount} value={String(amount)}>
                          ${amount}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buy Now
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
