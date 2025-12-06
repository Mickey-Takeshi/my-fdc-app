'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  Building,
  User,
  MessageSquare,
  Circle,
} from 'lucide-react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';

// 失注データの型定義
interface LostProspect {
  id: number;
  name: string;
  company: string;
  contact: string;
  channel?: string;
  lostReason?: string;
  lostFeedback?: string;
  lostDate?: string;
  createdAt?: string;
  history?: Array<{
    date: string;
    action: string;
    note?: string;
  }>;
}

// チャネルラベル
const CHANNEL_LABELS: Record<string, string> = {
  real: 'リアル',
  hp: 'HP',
  mail: 'メルマガ',
  messenger: 'メッセンジャー',
  x: 'X',
  phone: '電話・SMS',
  webapp: 'WEBアプリ',
};

// 失注理由に対する改善施策サジェスト
const IMPROVEMENT_SUGGESTIONS: Record<string, string[]> = {
  '価格が高い': [
    '価格の根拠を明確に説明する資料を作成',
    '分割払いやサブスクモデルの検討',
    'ROIを明示した提案書の作成',
    '競合との価格比較と差別化ポイントの強調',
  ],
  '競合に負けた': [
    '競合分析を強化し、差別化ポイントを明確化',
    '独自の価値提案（UVP）の見直し',
    '顧客の真のニーズの深掘りヒアリング',
    'クロージングのタイミングの改善',
  ],
  'タイミングが合わない': [
    'フォローアップスケジュールの設定',
    'ナーチャリングコンテンツの配信',
    '定期的な接点維持の仕組み構築',
    '季節性やイベントに合わせたアプローチ',
  ],
  'ニーズがなかった': [
    'リードクオリフィケーションの強化',
    'ターゲット顧客の再定義',
    '初期ヒアリングの質問項目の見直し',
    'ペルソナの精緻化',
  ],
  '決裁者に会えなかった': [
    '決裁プロセスの早期確認',
    'チャンピオン（社内推進者）の育成',
    '経営層向け資料の準備',
    '紹介依頼の積極的なアプローチ',
  ],
  '信頼関係が築けなかった': [
    '顧客事例・実績の充実',
    '無料トライアルやPoCの提案',
    'コミュニケーション頻度の最適化',
    '専門性をアピールするコンテンツ作成',
  ],
  'その他': [
    '失注理由の詳細ヒアリング実施',
    'パターン分析による共通要因の特定',
    '営業プロセス全体の見直し',
  ],
};

/**
 * 失注管理・分析セクション
 */
export const LostProspectsSection = memo(function LostProspectsSection() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [lostProspects, setLostProspects] = useState<LostProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  // 失注データ取得
  const loadLostData = useCallback(async () => {
    if (workspaceLoading) return;
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/workspaces/${workspaceId}/data`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const { data } = await response.json();

      interface ProspectData {
        id: number;
        name?: string;
        company?: string;
        contact?: string;
        channel?: string;
        status?: string;
        lostReason?: string;
        lostFeedback?: string;
        createdAt?: string;
        updatedAt?: string;
        history?: { date: string; action?: string; note?: string }[];
      }
      const lost = (data.prospects || [])
        .filter((p: ProspectData) => p.status === 'lost')
        .map((p: ProspectData) => ({
          id: p.id,
          name: p.name || '',
          company: p.company || '',
          contact: p.contact || '',
          channel: p.channel,
          lostReason: p.lostReason || '理由未設定',
          lostFeedback: p.lostFeedback || '',
          lostDate: p.history?.find((h) => h.action?.includes('失注'))?.date || p.updatedAt || p.createdAt,
          createdAt: p.createdAt,
          history: p.history || [],
        }));

      setLostProspects(lost);
    } catch (err) {
      console.error('Failed to load lost data:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, workspaceLoading]);

  useEffect(() => {
    loadLostData();
  }, [loadLostData]);

  // 失注理由の集計
  const reasonStats = useMemo(() => {
    const counts: Record<string, number> = {};
    lostProspects.forEach((p) => {
      const reason = p.lostReason || '理由未設定';
      counts[reason] = (counts[reason] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: lostProspects.length > 0 ? Math.round((count / lostProspects.length) * 100) : 0,
      }));
  }, [lostProspects]);

  // チャネル別失注集計
  const channelStats = useMemo(() => {
    const counts: Record<string, number> = {};
    lostProspects.forEach((p) => {
      const channel = p.channel || 'unknown';
      counts[channel] = (counts[channel] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([channel, count]) => ({
        channel,
        label: CHANNEL_LABELS[channel] || channel,
        count,
        percentage: lostProspects.length > 0 ? Math.round((count / lostProspects.length) * 100) : 0,
      }));
  }, [lostProspects]);

  // 選択された理由に該当する案件
  const filteredProspects = useMemo(() => {
    if (!selectedReason) return lostProspects;
    return lostProspects.filter((p) => p.lostReason === selectedReason);
  }, [lostProspects, selectedReason]);

  return (
    <>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--text-dark)',
        marginBottom: '16px',
        marginTop: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingTop: '24px',
        borderTop: '3px solid var(--bg-gray)'
      }}>
        <Circle size={14} fill="#D2691E" stroke="#D2691E" /> 失注管理・分析
      </h3>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          読み込み中...
        </div>
      ) : lostProspects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--text-light)', marginBottom: '15px' }} />
          <p style={{ color: 'var(--text-light)' }}>失注データがありません</p>
          <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '10px' }}>
            見込み客管理タブで「失注」ステータスに変更すると、ここに表示されます
          </p>
        </div>
      ) : (
        <>
          {/* サマリーカード */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, #f44336 0%, #e57373 100%)', color: 'white', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 600 }}>{lostProspects.length}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>総失注件数</div>
            </div>
            <div className="card" style={{ background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)', color: 'white', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 600 }}>{reasonStats.length}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>失注理由の種類</div>
            </div>
            <div className="card" style={{ background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)', color: 'white', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 600 }}>{reasonStats[0]?.percentage || 0}%</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>最多理由の割合</div>
            </div>
          </div>

          {/* 失注理由TOP5 */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <BarChart3 size={20} /> 失注理由ランキング
            </h4>
            <div style={{ display: 'grid', gap: '15px' }}>
              {reasonStats.slice(0, 5).map((stat, index) => (
                <div
                  key={stat.reason}
                  style={{
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '8px',
                    background: selectedReason === stat.reason ? 'rgba(244, 67, 54, 0.1)' : 'transparent',
                    border: selectedReason === stat.reason ? '2px solid var(--error)' : '2px solid transparent',
                  }}
                  onClick={() => setSelectedReason(selectedReason === stat.reason ? null : stat.reason)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 500 }}>{index + 1}. {stat.reason}</span>
                    <span style={{ color: 'var(--text-light)' }}>{stat.count}件 ({stat.percentage}%)</span>
                  </div>
                  <div style={{ background: 'var(--bg-gray)', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg, #f44336, #e57373)', width: `${stat.percentage}%`, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              ))}
            </div>
            {selectedReason && (
              <div style={{ marginTop: '15px', fontSize: '14px', color: 'var(--text-light)' }}>クリックでフィルタ解除</div>
            )}
          </div>

          {/* 改善施策サジェスト */}
          {selectedReason && IMPROVEMENT_SUGGESTIONS[selectedReason] && (
            <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid var(--success)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <Lightbulb size={20} style={{ color: 'var(--success)' }} />
                「{selectedReason}」への改善施策
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {IMPROVEMENT_SUGGESTIONS[selectedReason].map((suggestion, idx) => (
                  <li key={idx} style={{ marginBottom: '8px', lineHeight: '1.6' }}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* チャネル別失注 */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <BarChart3 size={20} /> チャネル別失注分析
            </h4>
            <div style={{ display: 'grid', gap: '10px' }}>
              {channelStats.map((stat) => (
                <div key={stat.channel}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 500 }}>{stat.label}</span>
                    <span style={{ color: 'var(--text-light)' }}>{stat.count}件 ({stat.percentage}%)</span>
                  </div>
                  <div style={{ background: 'var(--bg-gray)', height: '15px', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg, #FF9800, #FFB74D)', width: `${stat.percentage}%`, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 失注案件一覧 */}
          <div className="card">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <FileText size={20} /> 失注案件一覧
              {selectedReason && (
                <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: 400 }}>
                  （「{selectedReason}」でフィルタ中: {filteredProspects.length}件）
                </span>
              )}
            </h4>

            {filteredProspects.length === 0 ? (
              <p style={{ color: 'var(--text-light)' }}>該当する案件がありません</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {filteredProspects.map((prospect) => {
                  const isExpanded = expandedId === prospect.id;
                  const lostDate = prospect.lostDate ? new Date(prospect.lostDate).toLocaleDateString('ja-JP') : '不明';

                  return (
                    <div key={prospect.id} style={{ background: 'var(--bg-gray)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div
                        style={{ padding: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedId(isExpanded ? null : prospect.id)}
                      >
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '5px' }}>
                            <User size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                            {prospect.name}
                            {prospect.company && (
                              <span style={{ color: 'var(--text-light)', marginLeft: '10px' }}>
                                <Building size={14} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                                {prospect.company}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                            <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                            失注日: {lostDate}
                            <span style={{ marginLeft: '15px', padding: '2px 8px', background: 'rgba(244, 67, 54, 0.2)', color: '#f44336', borderRadius: '4px', fontSize: '12px' }}>
                              {prospect.lostReason}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>

                      {isExpanded && (
                        <div style={{ padding: '15px', borderTop: '1px solid var(--border)', background: 'white' }}>
                          {prospect.lostFeedback && (
                            <div style={{ marginBottom: '15px' }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)', marginBottom: '5px' }}>
                                <MessageSquare size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                                失注時のフィードバック
                              </div>
                              <div style={{ padding: '10px', background: 'var(--bg-gray)', borderRadius: '6px', fontSize: '14px', lineHeight: '1.6' }}>
                                {prospect.lostFeedback}
                              </div>
                            </div>
                          )}
                          {prospect.contact && (
                            <div style={{ marginBottom: '10px', fontSize: '14px' }}><strong>連絡先:</strong> {prospect.contact}</div>
                          )}
                          {prospect.channel && (
                            <div style={{ marginBottom: '10px', fontSize: '14px' }}><strong>チャネル:</strong> {CHANNEL_LABELS[prospect.channel] || prospect.channel}</div>
                          )}
                          {prospect.history && prospect.history.length > 0 && (
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)', marginBottom: '5px' }}>対応履歴（直近3件）</div>
                              {prospect.history.slice().reverse().slice(0, 3).map((h, idx) => (
                                <div key={idx} style={{ padding: '8px', background: 'var(--bg-gray)', borderRadius: '4px', marginBottom: '5px', fontSize: '13px' }}>
                                  <div style={{ color: 'var(--text-light)', fontSize: '12px' }}>{new Date(h.date).toLocaleString('ja-JP')}</div>
                                  <div>{h.action}</div>
                                  {h.note && <div style={{ color: 'var(--text-medium)', marginTop: '3px' }}>{h.note}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
});
