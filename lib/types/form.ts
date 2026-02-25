import { z } from 'zod';

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date';

export type FormStatus = 'draft' | 'published' | 'closed' | 'archived';

export interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  validation: FormFieldValidation;
  options?: string[];
  order: number;
}

export interface FormSettings {
  requireEmail: boolean;
  requireName: boolean;
  allowMultipleSubmissions: boolean;
  confirmationMessage: string;
  notifyOnSubmission: boolean;
  notifyEmails: string[];
  maxSubmissions?: number;
  closedMessage?: string;
  webhookUrl?: string;
  ogImageUrl?: string;
}

export interface Form {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  slug: string;
  schema: FormField[];
  settings: FormSettings;
  status: FormStatus;
  template_id: string | null;
  created_by: string | null;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: number;
  form_id: string;
  respondent_email: string | null;
  respondent_name: string | null;
  answers: Record<string, unknown>;
  metadata: Record<string, unknown>;
  submitted_at: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: 'contact' | 'survey' | 'registration' | 'feedback';
  schema: FormField[];
  defaultSettings: Partial<FormSettings>;
}

export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text',
    'textarea',
    'email',
    'phone',
    'number',
    'select',
    'radio',
    'checkbox',
    'date',
  ]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  validation: z
    .object({
      required: z.boolean().default(false),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .default({ required: false }),
  options: z.array(z.string()).optional(),
  order: z.number(),
});

export const formCreateSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  slug: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/,
      'slugは英小文字・数字・ハイフンのみ（3-64文字）'
    ),
  fields: z.array(formFieldSchema).min(1, '1つ以上のフィールドが必要です'),
  settings: z
    .object({
      requireEmail: z.boolean().default(true),
      requireName: z.boolean().default(true),
      allowMultipleSubmissions: z.boolean().default(false),
      confirmationMessage: z.string().default('送信ありがとうございます'),
      notifyOnSubmission: z.boolean().default(false),
      notifyEmails: z.array(z.string().email()).default([]),
    })
    .default({
      requireEmail: true,
      requireName: true,
      allowMultipleSubmissions: false,
      confirmationMessage: '送信ありがとうございます',
      notifyOnSubmission: false,
      notifyEmails: [],
    }),
});
