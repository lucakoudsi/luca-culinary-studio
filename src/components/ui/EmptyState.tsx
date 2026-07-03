'use client';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 2rem',
      textAlign: 'center',
      background: 'var(--bg)',
      border: '1.5px dashed rgba(107,58,75,0.25)',
      borderRadius: 16,
    }}>
      {/* Gold ornament line */}
      <div style={{
        width: 40, height: 2,
        background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
        borderRadius: 1,
        marginBottom: 20,
      }} />

      {/* Icon container */}
      <div style={{
        width: 64, height: 64,
        borderRadius: '50%',
        background: 'rgba(107,58,75,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        border: '1px solid rgba(107,58,75,0.12)',
      }}>
        {icon}
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--font-playfair, Georgia, serif)',
        fontSize: 20,
        fontWeight: 600,
        color: 'var(--text)',
        margin: '0 0 8px',
        letterSpacing: '0.5px',
      }}>
        {title}
      </h3>

      {/* Subtitle */}
      <p style={{
        fontSize: 14,
        color: 'var(--text-muted)',
        margin: '0 0 20px',
        maxWidth: 280,
        lineHeight: 1.6,
      }}>
        {subtitle}
      </p>

      {/* Gold ornament line bottom */}
      <div style={{
        width: 24, height: 1,
        background: 'rgba(201,168,76,0.35)',
        borderRadius: 1,
        marginBottom: action ? 20 : 0,
      }} />

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '10px 22px',
            background: 'linear-gradient(135deg, #562E3C, #6B3A4B)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.3px',
            boxShadow: '0 4px 14px rgba(107,58,75,0.22)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
