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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { giftCardBrands } from '@/lib/data';
import { sellGiftCard } from '@/app/(app)/sell-gift-card/actions';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];


const formSchema = z.object({
  brand: z.string().min(1, { message: "Please select a brand." }),
  amount: z.coerce.number().positive({ message: "Please enter the card amount." }),
  cardCode: z.string().min(1, { message: "Please enter the gift card code." }),
  cardImage: z
    .any()
    .refine((file) => file, "Image is required.")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

export function SellGiftCardForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [rate, setRate] = useState(0.85); // Mock rate (you get 85% of face value)
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand: '',
      amount: 100,
      cardCode: '',
      cardImage: undefined,
    },
  });

  const amount = form.watch('amount');
  const cashValue = amount * rate;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const result = await sellGiftCard(formData);
      if (result.success) {
        toast({
          title: 'Submission Successful',
          description: result.data.message,
        });
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to submit gift card.',
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
        <CardTitle>Sell Your Gift Card</CardTitle>
        <CardDescription>Fill out the form to submit your card for verification.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormLabel>Amount on Card (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="e.g., 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="cardCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gift Card Code / Claim Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the full code from the card" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="cardImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Image of Card</FormLabel>
                    <FormControl>
                      <Input type="file" onChange={(e) => field.onChange(e.target.files?.[0])} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

             <div className="p-4 bg-muted rounded-md text-sm">
                <p>You will receive approximately: <span className="font-bold text-primary">${cashValue.toFixed(2)}</span></p>
                <p className="text-xs text-muted-foreground">Our current rate is {rate * 100}%. Final amount is subject to verification.</p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for Verification
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
