/**
 * app/_components/settings/settings-tab/SectionCard.tsx
 * セクションカード共通コンポーネント
 */

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function SectionCard({
  title,
  icon,
  children,
  headerRight,
}: SectionCardProps) {
  return (
    <div
      className="settings-section"
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div
        className="settings-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {icon}
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-dark)',
            }}
          >
            {title}
          </h2>
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}
