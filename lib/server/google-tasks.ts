/**
 * lib/server/google-tasks.ts
 *
 * Phase 14: Google Tasks API クライアント
 */

import { callGoogleApi, GoogleApiCallOptions } from './google-api-base';
import type {
  GoogleTaskList,
  GoogleTaskListsResponse,
  GoogleTask,
  GoogleTasksResponse,
  GoogleTaskRequest,
} from '@/lib/types/google-tasks';

const TASKS_API_BASE = 'https://tasks.googleapis.com/tasks/v1';

/**
 * Google Tasks API を呼び出す
 */
async function callTasksApi<T>(
  userId: string,
  endpoint: string,
  options: GoogleApiCallOptions = {}
): Promise<T | null> {
  return callGoogleApi<T>(userId, TASKS_API_BASE, endpoint, options);
}

/**
 * タスクリスト一覧を取得
 */
export async function getTaskLists(userId: string): Promise<GoogleTaskList[]> {
  const response = await callTasksApi<GoogleTaskListsResponse>(
    userId,
    '/users/@me/lists'
  );

  return response?.items || [];
}

/**
 * デフォルトのタスクリストを取得（または作成）
 */
export async function getOrCreateDefaultTaskList(
  userId: string,
  listName: string = 'FDC Tasks'
): Promise<GoogleTaskList | null> {
  const lists = await getTaskLists(userId);

  // 既存のリストを探す
  const existing = lists.find((l) => l.title === listName);
  if (existing) {
    return existing;
  }

  // なければ作成
  const created = await callTasksApi<GoogleTaskList>(
    userId,
    '/users/@me/lists',
    {
      method: 'POST',
      body: { title: listName },
    }
  );

  return created;
}

/**
 * タスク一覧を取得
 */
export async function getTasks(
  userId: string,
  taskListId: string,
  options: {
    showCompleted?: boolean;
    showHidden?: boolean;
    maxResults?: number;
    updatedMin?: string;
  } = {}
): Promise<GoogleTask[]> {
  const params: Record<string, string> = {
    maxResults: String(options.maxResults || 100),
  };

  if (options.showCompleted !== undefined) {
    params.showCompleted = String(options.showCompleted);
  }
  if (options.showHidden !== undefined) {
    params.showHidden = String(options.showHidden);
  }
  if (options.updatedMin) {
    params.updatedMin = options.updatedMin;
  }

  const response = await callTasksApi<GoogleTasksResponse>(
    userId,
    `/lists/${taskListId}/tasks`,
    { params }
  );

  return response?.items || [];
}

/**
 * タスクを取得
 */
export async function getTask(
  userId: string,
  taskListId: string,
  taskId: string
): Promise<GoogleTask | null> {
  return callTasksApi<GoogleTask>(
    userId,
    `/lists/${taskListId}/tasks/${taskId}`
  );
}

/**
 * タスクを作成
 */
export async function createTask(
  userId: string,
  taskListId: string,
  task: GoogleTaskRequest
): Promise<GoogleTask | null> {
  return callTasksApi<GoogleTask>(
    userId,
    `/lists/${taskListId}/tasks`,
    {
      method: 'POST',
      body: task,
    }
  );
}

/**
 * タスクを更新
 */
export async function updateTask(
  userId: string,
  taskListId: string,
  taskId: string,
  task: Partial<GoogleTaskRequest>
): Promise<GoogleTask | null> {
  return callTasksApi<GoogleTask>(
    userId,
    `/lists/${taskListId}/tasks/${taskId}`,
    {
      method: 'PATCH',
      body: task,
    }
  );
}

/**
 * タスクを削除
 */
export async function deleteTask(
  userId: string,
  taskListId: string,
  taskId: string
): Promise<boolean> {
  await callTasksApi(
    userId,
    `/lists/${taskListId}/tasks/${taskId}`,
    { method: 'DELETE' }
  );
  return true;
}

/**
 * タスクを完了にする
 */
export async function completeTask(
  userId: string,
  taskListId: string,
  taskId: string
): Promise<GoogleTask | null> {
  return updateTask(userId, taskListId, taskId, {
    status: 'completed',
  });
}

/**
 * タスクを未完了に戻す
 */
export async function uncompleteTask(
  userId: string,
  taskListId: string,
  taskId: string
): Promise<GoogleTask | null> {
  return updateTask(userId, taskListId, taskId, {
    status: 'needsAction',
  });
}
