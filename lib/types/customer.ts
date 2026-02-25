import { z } from 'zod';

export const customerSchema = z.object({
  company_name: z.string().optional(),
  contact_name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive', 'lead']).default('active'),
  source: z
    .enum(['referral', 'website', 'event', 'cold', 'other'])
    .optional(),
  notes: z.string().optional(),
  estimated_value: z.number().nonnegative().optional(),
  next_followup_at: z.string().datetime().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export type CustomerStatus = 'active' | 'inactive' | 'lead';
export type CustomerSource = 'referral' | 'website' | 'event' | 'cold' | 'other';

export interface Customer {
  id: string;
  workspace_id: string;
  company_name: string | null;
  contact_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: CustomerStatus;
  source: CustomerSource | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  last_contact_at: string | null;
  next_followup_at: string | null;
  estimated_value: number | null;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  tags?: CustomerTag[];
}

export interface CustomerTag {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmSearchFilters {
  query?: string;
  statuses?: CustomerStatus[];
  tagIds?: string[];
  sources?: CustomerSource[];
  followupOverdue?: boolean;
  hasNoTags?: boolean;
  sortBy?: 'name' | 'last_contact' | 'next_followup' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CrmSearchResult {
  customers: (Customer & { tags: CustomerTag[] })[];
  total: number;
  page: number;
  totalPages: number;
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
