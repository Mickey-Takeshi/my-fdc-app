/**
 * CSV インポートロジックのカスタムフック
 */

import { useCallback } from 'react';
import {
  parseUnifiedCSV,
  extractMVV,
  extractOKR,
  extractActionMap,
  extractLeanCanvas,
  extractProspects,
  extractClients,
  extractTemplates,
} from '@/lib/csv';
import { useMVVViewModel } from '@/lib/hooks/useMVVViewModel';
import { useOKRViewModel } from '@/lib/hooks/useOKRViewModel';
import { useActionMapViewModel } from '@/lib/hooks/useActionMapViewModel';
import { useLeadsViewModel } from '@/lib/hooks/useLeadsViewModel';
import { useTemplatesViewModel } from '@/lib/hooks/useTemplatesViewModel';
import { useLeanCanvasViewModel } from '@/lib/hooks/useLeanCanvasViewModel';
import { useWorkspaceData } from '@/lib/hooks/useWorkspaceData';
import type { ImportResult } from '../types';

export function useCSVImport() {
  const mvv = useMVVViewModel();
  const okr = useOKRViewModel();
  const actionMap = useActionMapViewModel();
  const leads = useLeadsViewModel();
  const templates = useTemplatesViewModel();
  const leanCanvas = useLeanCanvasViewModel();
  const { data: workspaceData, saveData } = useWorkspaceData();

  const importBusinessCSV = useCallback(
    async (file: File): Promise<ImportResult> => {
      try {
        const text = await file.text();
        const result = parseUnifiedCSV(text);

        if (!result.success) {
          return { type: 'error', message: result.errors.join(', ') };
        }

        const imported: string[] = [];

        // MVV
        const mvvData = extractMVV(result.sections);
        if (mvvData && (mvvData.mission || mvvData.vision || mvvData.value)) {
          mvv.updateMVV(mvvData);
          imported.push('MVV');
        }

        // OKR
        const okrData = extractOKR(result.sections);
        if (okrData && okrData.objectives.length > 0) {
          for (const obj of okrData.objectives) {
            const objectiveId = await okr.addObjective({
              title: obj.title,
              scope: obj.scope as 'company' | 'team' | 'individual',
              description: '',
            });

            const relatedKRs = okrData.keyResults.filter(
              (kr) => kr.objectiveTitle === obj.title
            );
            for (const kr of relatedKRs) {
              await okr.addKeyResult(objectiveId, {
                title: kr.title,
                targetValue: kr.target,
                unit: kr.unit,
                currentValue: 0,
              });
            }
          }
          imported.push(`OKR(${okrData.objectives.length}目標)`);
        }

        // ActionMap
        const actionMapData = extractActionMap(result.sections);
        if (actionMapData && actionMapData.maps.length > 0) {
          for (const map of actionMapData.maps) {
            const mapId = await actionMap.addActionMap({
              title: map.title,
              description: '',
            });

            const relatedItems = actionMapData.items.filter(
              (item) => item.mapTitle === map.title
            );
            for (const item of relatedItems) {
              await actionMap.addActionItem(mapId, {
                title: item.title,
                priority: item.priority as 'low' | 'medium' | 'high',
                status: item.status as 'not_started' | 'in_progress' | 'blocked' | 'done',
              });
            }
          }
          imported.push(`ActionMap(${actionMapData.maps.length}施策)`);
        }

        // LeanCanvas
        const leanCanvasData = extractLeanCanvas(result.sections);
        if (leanCanvasData && Object.keys(leanCanvasData).length > 0) {
          // スネークケース → キャメルケースにマッピング
          const mappedData = {
            customerSegment: leanCanvasData.customer_segment || '',
            problem: leanCanvasData.problem || '',
            uniqueValue: leanCanvasData.unique_value || '',
            solution: leanCanvasData.solution || '',
            channels: leanCanvasData.channels || '',
            revenueStreams: leanCanvasData.revenue_streams || '',
            costStructure: leanCanvasData.cost_structure || '',
            keyMetrics: leanCanvasData.key_metrics || '',
            unfairAdvantage: leanCanvasData.unfair_advantage || '',
          };
          await leanCanvas.updateLeanCanvas(mappedData);
          imported.push('LeanCanvas');
        }

        if (imported.length > 0) {
          return {
            type: 'success',
            message: `インポート完了: ${imported.join(', ')}`,
          };
        } else {
          return {
            type: 'warning',
            message: 'インポート可能なデータが見つかりませんでした',
          };
        }
      } catch (error) {
        return {
          type: 'error',
          message: error instanceof Error ? error.message : 'インポートに失敗しました',
        };
      }
    },
    [mvv, okr, actionMap, leanCanvas]
  );

  const importSalesCSV = useCallback(
    async (file: File): Promise<ImportResult> => {
      try {
        const text = await file.text();
        const result = parseUnifiedCSV(text);

        if (!result.success) {
          return { type: 'error', message: result.errors.join(', ') };
        }

        const imported: string[] = [];

        // Prospects
        const prospectsData = extractProspects(result.sections);
        if (prospectsData && prospectsData.length > 0) {
          for (const prospect of prospectsData) {
            await leads.addProspect({
              name: prospect.name,
              company: prospect.company,
              contact: prospect.contact,
              status: prospect.status as 'uncontacted' | 'responded' | 'negotiating' | 'won' | 'lost',
              channel: prospect.channel as 'real' | 'hp' | 'mail' | 'messenger' | 'x' | 'phone' | 'webapp',
              memo: prospect.memo,
            });
          }
          imported.push(`見込み客(${prospectsData.length}件)`);
        }

        // Clients - workspaceDataを直接更新
        const clientsData = extractClients(result.sections);
        if (clientsData && clientsData.length > 0) {
          const now = new Date().toISOString();
          const baseId = Date.now();
          const newClients = clientsData.map((client, index) => ({
            id: baseId + index,
            name: client.name,
            company: client.company,
            contact: client.contact,
            status: 'client',
            memo: client.memo || '',
            contractDeadline: client.contractDate || null,
            nextMeeting: null,
            tags: client.tags || [],
            history: [{
              date: now,
              action: 'CSVインポート',
              note: '',
            }],
            createdAt: now,
            convertedAt: now,
          }));

          const existingClients = workspaceData?.clients || [];
          await saveData({ clients: [...existingClients, ...newClients] });
          imported.push(`既存客(${clientsData.length}件)`);
        }

        // Templates
        const templatesData = extractTemplates(result.sections);
        if (templatesData && templatesData.length > 0) {
          for (const template of templatesData) {
            await templates.addTemplate({
              type: template.type as 'messenger' | 'email' | 'proposal' | 'closing',
              name: template.name,
              subject: template.subject,
              body: template.body.replace(/\\n/g, '\n'),
              notes: template.notes,
            });
          }
          imported.push(`テンプレート(${templatesData.length}件)`);
        }

        if (imported.length > 0) {
          return {
            type: 'success',
            message: `インポート完了: ${imported.join(', ')}`,
          };
        } else {
          return {
            type: 'warning',
            message: 'インポート可能なデータが見つかりませんでした',
          };
        }
      } catch (error) {
        return {
          type: 'error',
          message: error instanceof Error ? error.message : 'インポートに失敗しました',
        };
      }
    },
    [leads, templates, workspaceData, saveData]
  );

  return {
    importBusinessCSV,
    importSalesCSV,
  };
}
