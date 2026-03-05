/**
 * lib/types/commands.ts
 *
 * Command pattern type definitions (Phase 33)
 * Commands represent user intentions for data operations.
 * Each command is designed to be idempotent.
 */

// ---- Task commands ----
export type TaskCommand =
  | {
      type: 'CREATE_TASK';
      task: {
        title: string;
        description?: string;
        suit?: string | null;
        dueDate?: string | null;
      };
    }
  | {
      type: 'UPDATE_TASK';
      taskId: string;
      updates: {
        title?: string;
        description?: string;
        status?: string;
        suit?: string | null;
        dueDate?: string | null;
      };
    }
  | { type: 'DELETE_TASK'; taskId: string }
  | { type: 'COMPLETE_TASK'; taskId: string }
  | { type: 'UNCOMPLETE_TASK'; taskId: string };

// ---- Brand commands ----
export type BrandCommand =
  | { type: 'CREATE_BRAND'; name: string; tagline?: string }
  | {
      type: 'UPDATE_BRAND';
      brandId: string;
      updates: { name?: string; tagline?: string; story?: string };
    }
  | { type: 'DELETE_BRAND'; brandId: string };

// ---- OKR commands ----
export type OKRCommand =
  | { type: 'CREATE_OBJECTIVE'; title: string; description?: string }
  | {
      type: 'UPDATE_OBJECTIVE';
      objectiveId: string;
      updates: { title?: string; description?: string };
    }
  | { type: 'DELETE_OBJECTIVE'; objectiveId: string }
  | {
      type: 'CREATE_KEY_RESULT';
      objectiveId: string;
      title: string;
      targetValue: number;
    }
  | {
      type: 'UPDATE_KEY_RESULT';
      keyResultId: string;
      updates: { currentValue?: number; title?: string };
    };

// ---- CRM commands ----
export type CRMCommand =
  | {
      type: 'CREATE_LEAD';
      data: { companyName: string; contactName?: string; email?: string };
    }
  | { type: 'UPDATE_LEAD'; leadId: string; updates: Record<string, unknown> }
  | { type: 'CONVERT_LEAD'; leadId: string }
  | {
      type: 'CREATE_CLIENT';
      data: { companyName: string; contactName: string };
    }
  | {
      type: 'UPDATE_CLIENT';
      clientId: string;
      updates: Record<string, unknown>;
    };

// ---- Union type ----
export type DataCommand =
  | TaskCommand
  | BrandCommand
  | OKRCommand
  | CRMCommand;
