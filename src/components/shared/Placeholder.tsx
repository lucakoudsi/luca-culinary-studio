import { Construction } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description?: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-8">
      <div className="text-center max-w-sm">
        <div className="w-18 h-18 rounded-[18px] flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', width: 72, height: 72 }}>
          <Construction size={32} color="#C9A84C" strokeWidth={1.5} />
        </div>
        <h1 className="font-heading text-[2rem] font-bold text-text-primary mb-3">{title}</h1>
        <p className="text-text-secondary text-[15px] leading-relaxed mb-7">
          {description || 'Dieser Bereich wird gerade entwickelt. Komm bald wieder!'}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium text-gold"
          style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block animate-pulse" />
          In Entwicklung
        </div>
      </div>
    </div>
  );
}
