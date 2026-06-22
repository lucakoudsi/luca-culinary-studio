interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="font-heading font-bold text-text-primary leading-tight tracking-tight flex items-center gap-3"
          style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)' }}>
          {icon}
          {title}
        </h1>
        {subtitle && (
          <p className="text-text-secondary text-sm mt-2">{subtitle}</p>
        )}
        <div className="mt-3 h-px w-14 rounded-full"
          style={{ background: 'linear-gradient(90deg, #C9A84C 0%, rgba(201,168,76,0.3) 60%, transparent 100%)' }} />
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
