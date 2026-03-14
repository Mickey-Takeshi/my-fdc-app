import { z } from 'zod';

export const customerSchema = z.object({
  company_name: z.string().optional(),
  contact_name: z.string().min(1, '名前は必須です'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive', 'lead']).default('active'),
  source: z.enum(['referral', 'website', 'event', 'cold', 'other']).optional(),
  notes: z.string().optional(),
  estimated_value: z.number().nonnegative().optional(),
  next_followup_at: z.string().datetime().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export interface CrmSearchFilters {
  query?: string;
  stages?: string[];
  tagIds?: string[];
  sources?: string[];
  followupOverdue?: boolean;
  hasNoTags?: boolean;
  sortBy?: 'name' | 'last_contact' | 'next_followup' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CrmDashboardStats {
  totalClients: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  upcomingFollowups: number;
  overdueFollowups: number;
  recentActivityCount: number;
  estimatedPipelineValue: number;
}
