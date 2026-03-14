import { z } from 'zod';

export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'textarea', 'email', 'phone', 'number', 'select', 'radio', 'checkbox', 'date']),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});

export const formSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/, 'スラッグ形式が不正です'),
  schema: z.array(formFieldSchema),
  settings: z.object({
    submitButtonText: z.string().default('送信'),
    successMessage: z.string().default('送信が完了しました'),
    notifyEmail: z.string().email().optional(),
    maxSubmissions: z.number().positive().optional(),
    closedMessage: z.string().optional(),
  }).default({
    submitButtonText: '送信',
    successMessage: '送信が完了しました',
  }),
});

export type FormInput = z.infer<typeof formSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
export type FormStatus = 'draft' | 'published' | 'closed' | 'archived';
