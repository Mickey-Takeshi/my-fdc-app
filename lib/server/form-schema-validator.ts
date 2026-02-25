/**
 * フォームスキーマバリデーター
 * 回答をスキーマ照合後に保存。未定義フィールド・型不一致は排除
 */

import type { FormField } from '@/lib/types/form';

export interface ValidationError {
  fieldId: string;
  message: string;
}

export function validateSubmission(
  schema: FormField[],
  answers: Record<string, unknown>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of schema) {
    const value = answers[field.id];
    const v = field.validation;

    // Required check
    if (v.required && (value === undefined || value === null || value === '')) {
      errors.push({ fieldId: field.id, message: `${field.label}は必須です` });
      continue;
    }

    if (value === undefined || value === null || value === '') continue;

    const strVal = String(value);

    // Type-specific validation
    switch (field.type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
          errors.push({ fieldId: field.id, message: '有効なメールアドレスを入力してください' });
        }
        break;
      case 'number': {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push({ fieldId: field.id, message: '数値を入力してください' });
        } else {
          if (v.min !== undefined && num < v.min) {
            errors.push({ fieldId: field.id, message: `${v.min}以上の値を入力してください` });
          }
          if (v.max !== undefined && num > v.max) {
            errors.push({ fieldId: field.id, message: `${v.max}以下の値を入力してください` });
          }
        }
        break;
      }
      case 'select':
      case 'radio':
        if (field.options && !field.options.includes(strVal)) {
          errors.push({ fieldId: field.id, message: '有効な選択肢を選んでください' });
        }
        break;
      case 'checkbox':
        if (typeof value !== 'boolean') {
          errors.push({ fieldId: field.id, message: '真偽値が必要です' });
        }
        break;
      default:
        break;
    }

    // String length validation
    if (typeof value === 'string') {
      if (v.minLength && strVal.length < v.minLength) {
        errors.push({ fieldId: field.id, message: `${v.minLength}文字以上入力してください` });
      }
      if (v.maxLength && strVal.length > v.maxLength) {
        errors.push({ fieldId: field.id, message: `${v.maxLength}文字以内で入力してください` });
      }
      if (v.pattern) {
        try {
          if (!new RegExp(v.pattern).test(strVal)) {
            errors.push({ fieldId: field.id, message: '入力形式が正しくありません' });
          }
        } catch {
          // Invalid regex pattern - skip validation
        }
      }
    }
  }

  // Strip unknown fields
  const validFieldIds = new Set(schema.map((f) => f.id));
  for (const key of Object.keys(answers)) {
    if (!validFieldIds.has(key)) {
      delete answers[key];
    }
  }

  return errors;
}
