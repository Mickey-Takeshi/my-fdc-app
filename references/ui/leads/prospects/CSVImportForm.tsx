'use client';

import { useState, useCallback } from 'react';
import { Upload, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
import { parseFlexibleCSV, type FlexibleParseResult } from '@/lib/csv';
import type { Lead } from '@/lib/hooks/useLeads';

interface CSVImportFormProps {
  onCancel: () => void;
  onImport: (leads: Partial<Lead>[]) => Promise<void>;
}

// ステータスマッピング
const STATUS_MAP: Record<string, Lead['status']> = {
  'uncontacted': 'UNCONTACTED',
  'responded': 'RESPONDED',
  'negotiating': 'NEGOTIATION',
  'won': 'WON',
  'lost': 'LOST',
};

// チャネルマッピング
const CHANNEL_MAP: Record<string, Lead['channel']> = {
  'real': 'REAL',
  'hp': 'HP',
  'mail': 'MAIL_MAGAZINE',
  'messenger': 'MESSENGER',
  'x': 'X',
  'phone': 'PHONE_SMS',
  'webapp': 'WEB_APP',
};

export function CSVImportForm({ onCancel, onImport }: CSVImportFormProps) {
  const [parseResult, setParseResult] = useState<FlexibleParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const result = parseFlexibleCSV(text);
      setParseResult(result);
      setImportComplete(false);
    } catch (err) {
      setParseResult({
        success: false,
        data: [],
        errors: [`ファイルの読み込みに失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`],
        warnings: [],
        totalRows: 0,
        importedRows: 0,
        skippedRows: 0,
      });
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = '';
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleImport = useCallback(async () => {
    if (!parseResult || parseResult.data.length === 0) return;

    setImporting(true);

    try {
      const leads: Partial<Lead>[] = parseResult.data.map(item => ({
        companyName: item.company || item.name,
        contactPerson: item.name,
        email: item.contact.includes('@') ? item.contact : null,
        phone: !item.contact.includes('@') ? item.contact : null,
        status: STATUS_MAP[item.status] || 'UNCONTACTED',
        channel: CHANNEL_MAP[item.channel] || 'MAIL_MAGAZINE',
        memo: item.memo || null,
      }));

      await onImport(leads);
      setImportComplete(true);
    } catch (err) {
      setParseResult(prev => prev ? {
        ...prev,
        errors: [...prev.errors, `インポート中にエラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`],
      } : null);
    } finally {
      setImporting(false);
    }
  }, [parseResult, onImport]);

  return (
    <div className="card" style={{
      marginBottom: '20px',
      background: 'linear-gradient(135deg, var(--primary-alpha-05) 0%, var(--primary-alpha-10) 100%)',
      borderLeft: '4px solid var(--primary)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <Upload size={20} />
          CSVインポート
        </h3>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {!importComplete ? (
        <>
          <div style={{ padding: '15px', background: 'white', borderRadius: '8px', marginBottom: '15px' }}>
            <p style={{ marginBottom: '10px', color: 'var(--text-light)', fontSize: '14px' }}>
              <strong>対応形式:</strong> Googleコンタクト、メルマガ購読者リスト、汎用CSV<br />
              <strong>自動認識:</strong> 姓・名の統合、類似項目のマッピング<br />
              <strong>文字コード:</strong> UTF-8（BOM付き推奨）
            </p>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                position: 'relative',
                padding: '30px',
                border: `2px dashed ${dragOver ? 'var(--primary)' : '#ccc'}`,
                borderRadius: '8px',
                background: dragOver ? 'var(--primary-alpha-10)' : 'white',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <FileText size={40} style={{ color: 'var(--primary)', marginBottom: '10px' }} />
              <p style={{ margin: 0, color: 'var(--text-medium)' }}>
                CSVファイルをドラッグ＆ドロップ<br />
                または<span style={{ color: 'var(--primary)', fontWeight: 600 }}>クリックして選択</span>
              </p>
            </div>
          </div>

          {/* パース結果表示 */}
          {parseResult && (
            <div style={{ marginBottom: '15px' }}>
              {/* 警告 */}
              {parseResult.warnings.length > 0 && (
                <div style={{
                  padding: '10px 15px',
                  background: '#FFF3CD',
                  border: '1px solid #FFE69C',
                  borderRadius: '8px',
                  marginBottom: '10px',
                }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#856404', fontSize: '14px' }}>
                    ⚠️ 注意事項
                  </p>
                  {parseResult.warnings.map((warning, i) => (
                    <p key={i} style={{ margin: '5px 0 0', color: '#856404', fontSize: '13px' }}>
                      {warning}
                    </p>
                  ))}
                </div>
              )}

              {/* エラー */}
              {parseResult.errors.length > 0 && (
                <div style={{
                  padding: '10px 15px',
                  background: '#F8D7DA',
                  border: '1px solid #F5C6CB',
                  borderRadius: '8px',
                  marginBottom: '10px',
                }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#721C24', fontSize: '14px' }}>
                    <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    エラー
                  </p>
                  {parseResult.errors.map((error, i) => (
                    <p key={i} style={{ margin: '5px 0 0', color: '#721C24', fontSize: '13px' }}>
                      {error}
                    </p>
                  ))}
                </div>
              )}

              {/* 成功結果 */}
              {parseResult.data.length > 0 && (
                <div style={{
                  padding: '10px 15px',
                  background: '#D4EDDA',
                  border: '1px solid #C3E6CB',
                  borderRadius: '8px',
                }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#155724', fontSize: '14px' }}>
                    <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    {parseResult.importedRows}件のデータを読み込みました
                  </p>
                  <p style={{ margin: '5px 0 0', color: '#155724', fontSize: '13px' }}>
                    総行数: {parseResult.totalRows}行 / スキップ: {parseResult.skippedRows}行
                  </p>
                </div>
              )}

              {/* プレビュー */}
              {parseResult.data.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <p style={{ fontWeight: 600, marginBottom: '10px', fontSize: '14px' }}>
                    プレビュー（最初の5件）
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                          <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>名前</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>会社名</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>連絡先</th>
                          <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>ステータス</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseResult.data.slice(0, 5).map((item, i) => (
                          <tr key={i}>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.name}</td>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.company}</td>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.contact}</td>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                              {STATUS_MAP[item.status] || item.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={!parseResult || parseResult.data.length === 0 || importing}
            >
              {importing ? 'インポート中...' : `${parseResult?.data.length || 0}件をインポート`}
            </button>
            <button className="btn btn-secondary" onClick={onCancel}>キャンセル</button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <CheckCircle size={48} style={{ color: '#28a745', marginBottom: '15px' }} />
          <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>
            インポート完了
          </p>
          <p style={{ color: 'var(--text-medium)', marginBottom: '20px' }}>
            {parseResult?.importedRows}件の見込み客データをインポートしました
          </p>
          <button className="btn btn-primary" onClick={onCancel}>
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}
