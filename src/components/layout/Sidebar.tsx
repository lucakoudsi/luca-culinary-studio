'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, FlaskConical, Utensils,
  Leaf, Sun, Wine, Beaker, FolderOpen, Bot, X, UtensilsCrossed, LogOut, Lock, Settings,
} from 'lucide-react';
import { FEATURES } from '@/config/features';
import { getUserTier, PAGE_MIN_TIER } from '@/config/roles';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

const navItems = [
  { href: '/',                label: 'Dashboard',        icon: LayoutDashboard, aiLocked: false },
  { href: '/rezepte',         label: 'Rezeptarchiv',     icon: BookOpen,        aiLocked: false },
  { href: '/kreativlabor',    label: 'Kreativlabor',     icon: FlaskConical,    aiLocked: true  },
  { href: '/menuegenerator',  label: 'Menügenerator',    icon: UtensilsCrossed, aiLocked: true  },
  { href: '/tellerdesigner',  label: 'Tellerdesigner',   icon: Utensils,        aiLocked: true  },
  { href: '/zutaten',         label: 'Zutatenbibliothek',icon: Leaf,            aiLocked: false },
  { href: '/saison',          label: 'Saisonkalender',   icon: Sun,             aiLocked: false },
  { href: '/wein-pairing',    label: 'Wein & Pairing',   icon: Wine,            aiLocked: false },
  { href: '/fermentation',    label: 'Fermentation',     icon: Beaker,          aiLocked: false },
  { href: '/projekte',        label: 'Projekte',         icon: FolderOpen,      aiLocked: false },
  { href: '/ki-sous-chef',    label: 'KI-Sous-Chef',     icon: Bot,             aiLocked: false },
];

type ThemeMode  = 'light' | 'dark' | 'auto';
type FontSize   = 'klein' | 'normal' | 'gross';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

function applyTheme(mode: ThemeMode) {
  const actual =
    mode === 'dark'  ? 'dark'
    : mode === 'light' ? 'light'
    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', actual);
  localStorage.setItem('theme', mode);
}

function applyFontSize(size: FontSize) {
  document.documentElement.style.fontSize =
    size === 'klein' ? '14px' : size === 'gross' ? '18px' : '16px';
  localStorage.setItem('fontSize', size);
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser]             = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  const [userTier, setUserTier]     = useState<number>(99);

  // Settings panel
  const [settingsOpen, setSettingsOpen]         = useState(false);
  const [theme, setTheme]                       = useState<ThemeMode>('auto');
  const [fontSize, setFontSize]                 = useState<FontSize>('normal');
  const [emailUpdates, setEmailUpdates]         = useState(true);
  const [profilOeffentlich, setProfilOeffentlich] = useState(true);
  const [standort, setStandort]                 = useState('Mainz');
  const [settingsSaving, setSettingsSaving]     = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user ?? null;
      setUser(u);
      if (u) {
        fetch('/api/profil').then(r => r.json()).then(d => {
          setAvatarUrl(d.profile?.avatar_url ?? null);
          setProfileName(d.profile?.full_name?.split(' ')[0] ?? '');
          setUserTier(getUserTier(u.email, d.profile?.stufe));
          setEmailUpdates(d.profile?.email_updates ?? true);
          setProfilOeffentlich(d.profile?.profil_oeffentlich ?? true);
          setStandort(d.profile?.standort ?? 'Mainz');
        }).catch(() => setUserTier(1));
      }
    });
    // Read theme + font from localStorage
    const t = localStorage.getItem('theme') as ThemeMode | null;
    if (t === 'light' || t === 'dark' || t === 'auto') setTheme(t);
    const f = localStorage.getItem('fontSize') as FontSize | null;
    if (f === 'klein' || f === 'normal' || f === 'gross') setFontSize(f);
  }, []);

  // Click-outside closes settings panel
  useEffect(() => {
    if (!settingsOpen) return;
    const handle = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [settingsOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const saveDbSettings = async (patch: Record<string, unknown>) => {
    setSettingsSaving(true);
    try {
      await fetch('/api/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch {}
    setSettingsSaving(false);
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
      )} style={{ background: 'var(--sidebar-bg, #F0EBE3)' }}>

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
                style={{ fontSize: 14, color: 'var(--text, #2C2420)', textTransform: 'uppercase' }}>
                {profileName || 'CULINARY'}
              </div>
              <div className="tracking-[2px] uppercase mt-0.5"
                style={{ fontSize: 8, color: 'var(--text-muted, #B09880)' }}>Culinary Creator</div>
            </div>
            {mobileOpen && (
              <button onClick={onClose} className="ml-auto lg:hidden" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, aiLocked }) => {
            const isActive    = href === '/' ? pathname === '/' : pathname.startsWith(href);
            const aiBlocked   = aiLocked && !FEATURES.AI_ENABLED;
            const minTier     = PAGE_MIN_TIER[href] ?? 1;
            const tierBlocked = userTier < minTier;
            const isLocked    = aiBlocked || tierBlocked;

            if (isLocked) {
              const lockColor   = aiBlocked ? '#C9A84C' : '#6B3A4B';
              const textColor   = aiBlocked ? 'rgba(201,168,76,0.7)' : 'rgba(107,58,75,0.6)';
              const tooltipText = aiBlocked ? 'KI-Funktion — coming soon' : 'Benötigt höheren Rang';
              return (
                <div key={href} title={tooltipText}
                  className="flex items-center gap-2.5 px-4 py-[8px] text-[12.5px] font-medium mx-2 rounded-lg select-none"
                  style={{ color: textColor, opacity: 0.6, cursor: 'not-allowed' }}>
                  <Icon size={14} strokeWidth={1.6} />
                  <span>{label}</span>
                  <Lock size={16} className="ml-auto flex-shrink-0" style={{ color: lockColor }} />
                </div>
              );
            }

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
                  color: 'var(--text-muted, #8B7355)',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(107,58,75,0.07)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}>
                <Icon size={14} strokeWidth={isActive ? 2 : 1.6} />
                <span className={isActive ? 'font-semibold' : ''}>{label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 bg-white/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2" ref={settingsRef} style={{ position: 'relative' }}>

          {/* Settings Panel */}
          {settingsOpen && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', left: 8, right: 8,
              background: 'var(--surface, #FFFFFF)',
              border: '1px solid var(--border, #E8E0D8)',
              borderRadius: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              padding: 16,
              zIndex: 100,
            }}>

              {/* Theme */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted, #B09880)', marginBottom: 8 }}>
                  Erscheinungsbild
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([
                    { id: 'light' as ThemeMode, label: '☀️ Hell' },
                    { id: 'dark'  as ThemeMode, label: '🌙 Dunkel' },
                    { id: 'auto'  as ThemeMode, label: 'Auto' },
                  ]).map(opt => (
                    <button key={opt.id} onClick={() => { setTheme(opt.id); applyTheme(opt.id); }}
                      style={{
                        flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: theme === opt.id ? 'var(--accent, #6B3A4B)' : 'var(--accent-light, rgba(107,58,75,0.06))',
                        color: theme === opt.id ? '#FFFFFF' : 'var(--text-muted, #8B7355)',
                        border: theme === opt.id ? '1px solid var(--accent, #6B3A4B)' : '1px solid var(--border, #E8E0D8)',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted, #B09880)', marginBottom: 8 }}>
                  Schriftgröße
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([
                    { id: 'klein'  as FontSize, label: 'Klein' },
                    { id: 'normal' as FontSize, label: 'Normal' },
                    { id: 'gross'  as FontSize, label: 'Groß' },
                  ]).map(opt => (
                    <button key={opt.id} onClick={() => { setFontSize(opt.id); applyFontSize(opt.id); }}
                      style={{
                        flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: fontSize === opt.id ? 'var(--accent, #6B3A4B)' : 'var(--accent-light, rgba(107,58,75,0.06))',
                        color: fontSize === opt.id ? '#FFFFFF' : 'var(--text-muted, #8B7355)',
                        border: fontSize === opt.id ? '1px solid var(--accent, #6B3A4B)' : '1px solid var(--border, #E8E0D8)',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Standort */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted, #B09880)', marginBottom: 8 }}>
                  Standort
                </div>
                <input
                  type="text"
                  value={standort}
                  onChange={e => setStandort(e.target.value)}
                  onBlur={() => { if (standort.trim()) saveDbSettings({ standort: standort.trim() }); }}
                  onKeyDown={e => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); } }}
                  placeholder="Deine Stadt..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '6px 10px', borderRadius: 8, fontSize: 12,
                    border: '1px solid var(--border, #E8E0D8)',
                    background: 'var(--bg, #FAF8F5)',
                    color: 'var(--text, #2C2420)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--border, #E8E0D8)', marginBottom: 12 }} />

              {/* Benachrichtigungen Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text, #2C2420)' }}>Email-Updates</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted, #B09880)' }}>Neue Features & Tipps</div>
                </div>
                <button
                  onClick={() => {
                    const next = !emailUpdates;
                    setEmailUpdates(next);
                    saveDbSettings({ email_updates: next });
                  }}
                  style={{
                    width: 38, height: 22, borderRadius: 11, border: 'none',
                    background: emailUpdates ? '#6B3A4B' : 'rgba(107,58,75,0.15)',
                    cursor: settingsSaving ? 'wait' : 'pointer',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}>
                  <span style={{
                    position: 'absolute', top: 3, left: emailUpdates ? 19 : 3,
                    width: 16, height: 16, borderRadius: '50%', background: 'var(--surface)',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>

              {/* Profil öffentlich Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text, #2C2420)' }}>Profil öffentlich</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted, #B09880)' }}>Für andere sichtbar</div>
                </div>
                <button
                  onClick={() => {
                    const next = !profilOeffentlich;
                    setProfilOeffentlich(next);
                    saveDbSettings({ profil_oeffentlich: next });
                  }}
                  style={{
                    width: 38, height: 22, borderRadius: 11, border: 'none',
                    background: profilOeffentlich ? '#6B3A4B' : 'rgba(107,58,75,0.15)',
                    cursor: settingsSaving ? 'wait' : 'pointer',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}>
                  <span style={{
                    position: 'absolute', top: 3, left: profilOeffentlich ? 19 : 3,
                    width: 16, height: 16, borderRadius: '50%', background: 'var(--surface)',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>

            </div>
          )}

          {/* User row */}
          {user && (
            <Link href="/profil"
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all w-full"
              style={{ color: 'inherit' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(107,58,75,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #6B3A4B, #9A5468)' }}>
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--text, #2C2420)' }}>{displayName}</div>
                <div className="text-[10px] truncate" style={{ color: 'var(--text-muted, #B09880)' }}>{user.email}</div>
              </div>
            </Link>
          )}

          {/* Sichtbarer Einstellungen-Button */}
          <button
            onClick={() => setSettingsOpen(p => !p)}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] text-[12px] font-semibold transition-all"
            style={{
              background: settingsOpen
                ? 'linear-gradient(135deg, #562E3C, #6B3A4B)'
                : 'linear-gradient(135deg, #6B3A4B, #8B4A60)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              boxShadow: settingsOpen
                ? '0 2px 8px rgba(107,58,75,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                : '0 2px 8px rgba(107,58,75,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
              letterSpacing: '0.3px',
            }}
            onMouseEnter={e => {
              if (!settingsOpen) (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #562E3C, #7A3F55)';
            }}
            onMouseLeave={e => {
              if (!settingsOpen) (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #6B3A4B, #8B4A60)';
            }}>
            <Settings size={15} />
            Einstellungen
            <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>
              {settingsOpen ? '▲' : '▼'}
            </span>
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all disabled:opacity-50"
            style={{ color: 'var(--text-muted, #8B7355)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#C05050'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,80,80,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted, #8B7355)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
            <LogOut size={14} />
            {loggingOut ? 'Abmelden…' : 'Abmelden'}
          </button>
        </div>
      </aside>
    </>
  );
}
