'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from './Sidebar';
import AiBanner from '@/components/AiBanner';
import { Menu, LayoutDashboard, BookOpen, Leaf, User } from 'lucide-react';

const AUTH_PATHS = ['/login', '/register'];

const BOTTOM_NAV = [
  { href: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/rezepte', icon: BookOpen,        label: 'Rezepte'   },
  { href: '/zutaten', icon: Leaf,            label: 'Zutaten'   },
  { href: '/profil',  icon: User,            label: 'Profil'    },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  if (AUTH_PATHS.some(p => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:ml-60 flex-1 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center px-5 py-3 border-b border-border bg-surface">
          <button onClick={() => setMobileOpen(true)} className="text-text-primary p-1">
            <Menu size={22} />
          </button>
          <span className="ml-3 font-heading text-base font-bold text-text-primary">LUCA Culinary</span>
        </div>

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation — hidden on md+ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border"
        style={{ background: 'var(--sidebar-bg, #F0EBE3)' }}>
        <div className="flex">
          {BOTTOM_NAV.map(({ href, icon: Icon, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
                style={{ color: isActive ? '#6B3A4B' : '#B09880', minHeight: 56 }}>
                <Icon size={20} strokeWidth={isActive ? 2 : 1.6} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AiBanner />
    </div>
  );
}
