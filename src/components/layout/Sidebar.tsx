'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, FlaskConical, Utensils,
  Leaf, Wine, Beaker, Star, FolderOpen, Bot, X, UtensilsCrossed, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/rezepte', label: 'Rezeptarchiv', icon: BookOpen },
  { href: '/kreativlabor', label: 'Kreativlabor', icon: FlaskConical },
  { href: '/menuegenerator', label: 'Menügenerator', icon: UtensilsCrossed },
  { href: '/tellerdesigner', label: 'Tellerdesigner', icon: Utensils },
  { href: '/zutaten', label: 'Zutatenbibliothek', icon: Leaf },
  { href: '/wein-pairing', label: 'Wein & Pairing', icon: Wine },
  { href: '/fermentation', label: 'Fermentation', icon: Beaker },
  { href: '/mein-stil', label: 'Mein Stil', icon: Star },
  { href: '/projekte', label: 'Projekte', icon: FolderOpen },
  { href: '/ki-sous-chef', label: 'KI-Sous-Chef', icon: Bot },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser]       = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const displayName = user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'Chef';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/65 z-40 lg:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-screen w-60 flex flex-col z-50 bg-surface',
        'transition-transform duration-300 ease-in-out',
        'border-r border-border',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 44, height: 44, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <img src="/chef-logo-gold.png" alt="" width={28} height={28}
                style={{ width: 28, height: 28, objectFit: 'contain' }} />
            </div>
            <div className="min-w-0">
              <div className="font-heading font-bold leading-none tracking-[3px]"
                style={{ fontSize: 14, color: '#C9A84C', textTransform: 'uppercase' }}>LUCA</div>
              <div className="tracking-[2px] uppercase mt-0.5"
                style={{ fontSize: 8, color: 'rgba(168,152,128,0.5)' }}>Culinary Creator</div>
            </div>
            {mobileOpen && (
              <button onClick={onClose} className="ml-auto lg:hidden" style={{ color: 'rgba(168,152,128,0.6)' }}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-[8px] text-[12.5px] font-medium mx-2 rounded-lg',
                  'transition-all duration-150',
                  isActive
                    ? 'text-gold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
                )}
                style={isActive ? {
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.18)',
                } : {}}>
                <Icon size={14} strokeWidth={isActive ? 2 : 1.6} />
                <span className={isActive ? 'font-semibold' : ''}>{label}</span>
                {isActive && (
                  <span className="ml-auto w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: '#C9A84C' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          {/* User info */}
          {user && (
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C' }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-text-primary truncate">{displayName}</div>
                <div className="text-[10px] text-text-muted truncate">{user.email}</div>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-text-secondary hover:text-red-400 hover:bg-red-400/5 disabled:opacity-50">
            <LogOut size={14} />
            {loggingOut ? 'Abmelden…' : 'Abmelden'}
          </button>
        </div>
      </aside>
    </>
  );
}
