'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, FlaskConical, Utensils,
  Leaf, Wine, Beaker, Star, FolderOpen, Bot, X, UtensilsCrossed, LogOut, Lock,
} from 'lucide-react';
import { FEATURES } from '@/config/features';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

const navItems = [
  { href: '/',                label: 'Dashboard',        icon: LayoutDashboard, locked: false },
  { href: '/rezepte',         label: 'Rezeptarchiv',     icon: BookOpen,        locked: false },
  { href: '/kreativlabor',    label: 'Kreativlabor',     icon: FlaskConical,    locked: true  },
  { href: '/menuegenerator',  label: 'Menügenerator',    icon: UtensilsCrossed, locked: true  },
  { href: '/tellerdesigner',  label: 'Tellerdesigner',   icon: Utensils,        locked: true  },
  { href: '/zutaten',         label: 'Zutatenbibliothek',icon: Leaf,            locked: false },
  { href: '/wein-pairing',    label: 'Wein & Pairing',   icon: Wine,            locked: false },
  { href: '/fermentation',    label: 'Fermentation',     icon: Beaker,          locked: false },
  { href: '/mein-stil',       label: 'Mein Stil',        icon: Star,            locked: false },
  { href: '/projekte',        label: 'Projekte',         icon: FolderOpen,      locked: false },
  { href: '/ki-sous-chef',    label: 'KI-Sous-Chef',     icon: Bot,             locked: false },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser]           = useState<User | null>(null);
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
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-screen w-60 flex flex-col z-50',
        'transition-transform duration-300 ease-in-out',
        'border-r border-border',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )} style={{ background: '#F0EBE3' }}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 44, height: 44, background: '#6B3A4B', border: '1px solid rgba(107,58,75,0.3)' }}>
              <img src="/chef-logo-gold.png" alt="" width={26} height={26}
                style={{ width: 26, height: 26, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            </div>
            <div className="min-w-0">
              <div className="font-heading font-bold leading-none tracking-[3px]"
                style={{ fontSize: 14, color: '#2C2420', textTransform: 'uppercase' }}>LUCA</div>
              <div className="tracking-[2px] uppercase mt-0.5"
                style={{ fontSize: 8, color: '#B09880' }}>Culinary Creator</div>
            </div>
            {mobileOpen && (
              <button onClick={onClose} className="ml-auto lg:hidden" style={{ color: '#8B7355' }}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, locked }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            const isLocked = locked && !FEATURES.AI_ENABLED;
            return (
              <Link key={href} href={href} onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-[8px] text-[12.5px] font-medium mx-2 rounded-lg',
                  'transition-all duration-150',
                )}
                style={isActive ? {
                  background: '#6B3A4B',
                  color: '#FFFFFF',
                } : {
                  color: isLocked ? '#B0A090' : '#8B7355',
                  opacity: isLocked ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(107,58,75,0.07)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}>
                <Icon size={14} strokeWidth={isActive ? 2 : 1.6} />
                <span className={isActive ? 'font-semibold' : ''}>{label}</span>
                {isActive && !isLocked && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 bg-white/60" />
                )}
                {isLocked && (
                  <Lock size={11} className="ml-auto flex-shrink-0" style={{ color: isActive ? 'rgba(255,255,255,0.6)' : '#B0A090' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          {user && (
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                style={{ background: '#6B3A4B' }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold truncate" style={{ color: '#2C2420' }}>{displayName}</div>
                <div className="text-[10px] truncate" style={{ color: '#B09880' }}>{user.email}</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all disabled:opacity-50"
            style={{ color: '#8B7355' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#C05050'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,80,80,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8B7355'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
            <LogOut size={14} />
            {loggingOut ? 'Abmelden…' : 'Abmelden'}
          </button>
        </div>
      </aside>
    </>
  );
}
