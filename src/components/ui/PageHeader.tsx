import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, badge, actions }: PageHeaderProps) {
  return (
    <div className="px-8 pt-8 pb-6 flex items-start justify-between gap-6"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div>
        {badge && (
          <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2"
            style={{ color: 'rgba(201,168,76,0.55)' }}>
            ✦ &nbsp;{badge}
          </div>
        )}
        <h1 className="font-heading font-bold leading-none"
          style={{ fontSize: 28, color: '#F5F0E8', letterSpacing: '2px', textTransform: 'uppercase' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5" style={{ color: 'rgba(168,152,128,0.65)', fontSize: 13 }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 mt-1 flex-shrink-0">{actions}</div>}
    </div>
  );
}
