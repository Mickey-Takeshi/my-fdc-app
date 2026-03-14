import { z } from 'zod';

export const paymentSchema = z.object({
  customer_id: z.string().uuid().optional(),
  amount: z.number().nonnegative(),
  currency: z.string().regex(/^[A-Z]{3}$/).default('JPY'),
  status: z.enum(['pending', 'completed', 'failed', 'refunded', 'cancelled']).default('pending'),
  payment_method: z.enum(['stripe', 'bank_transfer', 'cash', 'other']).optional(),
  invoice_number: z.string().optional(),
  description: z.string().optional(),
  due_date: z.string().optional(),
  expected_payer_name: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'stripe' | 'bank_transfer' | 'cash' | 'other';
