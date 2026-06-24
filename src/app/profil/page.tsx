'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import {
  User as UserIcon, Mail, Lock, LogOut, Loader2,
  Eye, EyeOff, CheckCircle, ChefHat, Shield, Sparkles,
  Share2, Globe, Camera, PlayCircle, Briefcase, Music2,
} from 'lucide-react';

const DepthHeader = dynamic(() => import('@/components/ui/DepthHeader'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  kuechenstil: string | null;
  spezialitaeten: string | null;
  bio: string | null;
  lieblingszutaten: string | null;
  inspirationen: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  website: string | null;
  linkedin: string | null;
  created_at: string | null;
};

type Stats = { rezepte: number; projekte: number; fermente: number };
type Tab = 'profil' | 'kuechenstil' | 'social' | 'sicherheit';

// ─── Shared form styles ───────────────────────────────────────────────────────

const fieldCls = 'w-full pl-10 pr-4 py-3.5 rounded-xl text-[14px] text-[#2C2420] outline-none transition-all placeholder:text-[#C0B5A8]';
const fieldStyle = { background: '#F9F7F4', border: '1px solid #E8E0D8' };
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, color: '#8B7355',
  marginBottom: 6, letterSpacing: '3px', textTransform: 'uppercase',
};

function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'rgba(107,58,75,0.45)';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(107,58,75,0.06)';
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#E8E0D8';
  e.currentTarget.style.boxShadow = 'none';
}

function SuccessBanner({ message = 'Gespeichert!' }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[12px]"
      style={{ background: 'rgba(90,154,88,0.08)', border: '1px solid rgba(90,154,88,0.25)', color: '#5A9A58' }}>
      <CheckCircle size={13} />
      {message}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl px-4 py-3 text-[12px]"
      style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#E06B6B' }}>
      {message}
    </div>
  );
}

function SaveButton({ onClick, loading, label = 'Speichern' }: {
  onClick: () => void; loading: boolean; label?: string;
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40"
      style={{
        background: 'linear-gradient(135deg, #562E3C 0%, #6B3A4B 60%, #7D4558 100%)',
        color: '#FFFFFF', boxShadow: '0 4px 16px rgba(107,58,75,0.2)',
      }}>
      {loading && <Loader2 size={13} className="animate-spin" />}
      {label}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProfilPage() {
  const router      = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser]               = useState<User | null>(null);
  const [profile, setProfile]         = useState<Profile | null>(null);
  const [stats, setStats]             = useState<Stats>({ rezepte: 0, projekte: 0, fermente: 0 });
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<Tab>('profil');

  // Tab 1
  const [name, setName]               = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError]   = useState('');

  // Tab 2
  const [kuechenstil, setKuechenstil]       = useState('');
  const [spezialitaeten, setSpezialitaeten] = useState('');
  const [bio, setBio]                       = useState('');
  const [tags, setTags]                     = useState<string[]>([]);
  const [tagInput, setTagInput]             = useState('');
  const [inspirationen, setInspirationen]   = useState('');
  const [stilSaving, setStilSaving]         = useState(false);
  const [stilSuccess, setStilSuccess]       = useState(false);
  const [stilError, setStilError]           = useState('');

  // Tab 3 – Social Media
  const [instagram, setInstagram]   = useState('');
  const [tiktok, setTiktok]         = useState('');
  const [youtube, setYoutube]       = useState('');
  const [website, setWebsite]       = useState('');
  const [linkedin, setLinkedin]     = useState('');
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialSuccess, setSocialSuccess] = useState(false);
  const [socialError, setSocialError]   = useState('');

  // Tab 4 – Sicherheit
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [pwSaving, setPwSaving]     = useState(false);
  const [pwSuccess, setPwSuccess]   = useState(false);
  const [pwError, setPwError]       = useState('');

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError]     = useState('');

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      setUser(data.user);
      fetch('/api/profil').then(r => r.json()).then(d => {
        if (d.profile) {
          setProfile(d.profile);
          setName(d.profile.full_name ?? '');
          setKuechenstil(d.profile.kuechenstil ?? '');
          setSpezialitaeten(d.profile.spezialitaeten ?? '');
          setBio(d.profile.bio ?? '');
          setTags(d.profile.lieblingszutaten
            ? d.profile.lieblingszutaten.split(',').map((s: string) => s.trim()).filter(Boolean)
            : []);
          setInspirationen(d.profile.inspirationen ?? '');
          setInstagram(d.profile.instagram ?? '');
          setTiktok(d.profile.tiktok ?? '');
          setYoutube(d.profile.youtube ?? '');
          setWebsite(d.profile.website ?? '');
          setLinkedin(d.profile.linkedin ?? '');
        }
        if (d.stats) setStats(d.stats);
        if (d.userCreatedAt) setUserCreatedAt(d.userCreatedAt);
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const displayName = name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const memberSince = (userCreatedAt ?? profile?.created_at)
    ? new Date((userCreatedAt ?? profile!.created_at)!).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    : '—';

  // ── Actions ────────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError('');
    try {
      const res = await fetch('/api/profil', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name }),
      });
      const d = await res.json();
      if (!res.ok) { setProfileError(d.error || 'Speichern fehlgeschlagen.'); return; }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError('Netzwerkfehler. Bitte versuche es erneut.');
    } finally {
      setProfileSaving(false);
    }
  };

  const saveKuechenstil = async () => {
    setStilSaving(true);
    setStilError('');
    try {
      const res = await fetch('/api/profil', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kuechenstil, spezialitaeten, bio, lieblingszutaten: tags.join(', '), inspirationen }),
      });
      const d = await res.json();
      if (!res.ok) { setStilError(d.error || 'Speichern fehlgeschlagen.'); return; }
      setStilSuccess(true);
      setTimeout(() => setStilSuccess(false), 3000);
    } catch {
      setStilError('Netzwerkfehler. Bitte versuche es erneut.');
    } finally {
      setStilSaving(false);
    }
  };

  const saveSocial = async () => {
    setSocialSaving(true);
    setSocialError('');
    try {
      const res = await fetch('/api/profil', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instagram, tiktok, youtube, website, linkedin }),
      });
      const d = await res.json();
      if (!res.ok) { setSocialError(d.error || 'Speichern fehlgeschlagen.'); return; }
      setSocialSuccess(true);
      setTimeout(() => setSocialSuccess(false), 3000);
    } catch {
      setSocialError('Netzwerkfehler. Bitte versuche es erneut.');
    } finally {
      setSocialSaving(false);
    }
  };

  const changePassword = async () => {
    setPwError('');
    if (newPw !== confirmPw) { setPwError('Passwörter stimmen nicht überein.'); return; }
    if (newPw.length < 6)    { setPwError('Mindestens 6 Zeichen erforderlich.'); return; }
    if (!user?.email) return;
    setPwSaving(true);
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPw });
    if (signInErr) { setPwError('Aktuelles Passwort ist falsch.'); setPwSaving(false); return; }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (updateErr) { setPwError(updateErr.message); return; }
    setPwSuccess(true); setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setTimeout(() => setPwSuccess(false), 3000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected if needed
    e.target.value = '';
    setAvatarLoading(true);
    setAvatarError('');
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch('/api/profil/avatar', { method: 'POST', body: form });
      const d = await res.json();
      if (!res.ok) {
        setAvatarError(d.error || 'Upload fehlgeschlagen.');
        return;
      }
      if (d.avatar_url) {
        setProfile(prev => prev ? { ...prev, avatar_url: d.avatar_url } : prev);
      }
    } catch {
      setAvatarError('Netzwerkfehler beim Upload.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push('/login');
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F5' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#6B3A4B' }} />
      </div>
    );
  }

  // ── Nav items ──────────────────────────────────────────────────────────────
  const NAV: { id: Tab; label: string; sublabel: string; Icon: React.ElementType }[] = [
    { id: 'profil',      label: 'Profil',       sublabel: 'Name & Foto',  Icon: UserIcon },
    { id: 'kuechenstil', label: 'Küchenstil',   sublabel: 'Dein Profil',  Icon: ChefHat  },
    { id: 'social',      label: 'Social Media', sublabel: 'Deine Links',  Icon: Share2   },
    { id: 'sicherheit',  label: 'Sicherheit',   sublabel: 'Passwort',     Icon: Shield   },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>

      {/* Breadcrumb + Header area */}
      <div style={{ padding: '2rem 2rem 0' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(107,58,75,0.55)', marginBottom: 6 }}>
          ✦ &nbsp;Einstellungen
        </div>
        <h1 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 28, fontWeight: 700, color: '#2C2420', letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 1.25rem' }}>
          Mein Profil
        </h1>

        {/* Avatar upload feedback */}
        {avatarError && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] mb-3"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#E06B6B' }}>
            {avatarError}
            <button onClick={() => setAvatarError('')} style={{ marginLeft: 'auto', opacity: 0.6 }}>✕</button>
          </div>
        )}

        {/* 3D Header */}
        <div style={{ position: 'relative' }}>
        {avatarLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10, borderRadius: 18, background: 'rgba(21,16,15,0.4)' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#C9A84C' }} />
          </div>
        )}
        <DepthHeader
          initial={initials[0] ?? '?'}
          name={displayName || '—'}
          role="Chef & Creator"
          stats={stats}
          avatarUrl={profile?.avatar_url}
          onAvatarClick={() => fileInputRef.current?.click()}
        />
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.25rem', padding: '0 2rem 2rem' }}>

        {/* ── Left nav column ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Nav card */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8E0D8', padding: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            {NAV.map(({ id, label, sublabel, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 10px 10px 12px', borderRadius: 10, cursor: 'pointer',
                  borderLeft: activeTab === id ? '3px solid #6B3A4B' : '3px solid transparent',
                  background: activeTab === id ? 'rgba(107,58,75,0.06)' : 'transparent',
                  border: 'none', textAlign: 'left', transition: 'all 0.15s',
                  marginBottom: 2,
                }}
                onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.background = 'rgba(107,58,75,0.03)'; }}
                onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.background = 'transparent'; }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                  background: activeTab === id ? '#6B3A4B' : 'rgba(107,58,75,0.08)',
                  transition: 'all 0.15s',
                }}>
                  <Icon size={14} style={{ color: activeTab === id ? '#FFFFFF' : '#8B7355' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2C2420', lineHeight: 1.3 }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#B09880', marginTop: 1 }}>{sublabel}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Member since */}
          <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E0D8', padding: '12px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#C0B5A8', marginBottom: 4 }}>
              Mitglied seit
            </div>
            <div style={{ fontSize: 13, color: '#8B7355', fontWeight: 500 }}>{memberSince}</div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all"
            style={{ background: 'rgba(192,80,80,0.07)', border: '1px solid rgba(192,80,80,0.2)', color: '#C05050', width: '100%' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(192,80,80,0.13)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(192,80,80,0.07)')}>
            <LogOut size={14} />
            Abmelden
          </button>
        </div>

        {/* ── Right content card ───────────────────────────────────────────── */}
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E8E0D8', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>

          {/* ── Tab 1: Profil ───────────────────────────────────────────── */}
          {activeTab === 'profil' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 600, color: '#2C2420', margin: '0 0 1.5rem' }}>
                Profil bearbeiten
              </h3>
              <div className="space-y-5" style={{ maxWidth: 420 }}>
                <div>
                  <label style={labelStyle}>Name</label>
                  <div className="relative">
                    <UserIcon size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Dein Name" className={fieldCls} style={fieldStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>E-Mail</label>
                  <div className="relative">
                    <Mail size={14} color="#C0B5A8" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="email" value={user?.email ?? ''} disabled
                      className={fieldCls}
                      style={{ ...fieldStyle, opacity: 0.5, cursor: 'not-allowed' }} />
                  </div>
                  <p style={{ fontSize: 10, color: '#C0B5A8', marginTop: 4 }}>E-Mail kann nicht geändert werden.</p>
                </div>
                {profileError && <ErrorBanner message={profileError} />}
                {profileSuccess && <SuccessBanner />}
                <SaveButton onClick={saveProfile} loading={profileSaving} />
              </div>
            </div>
          )}

          {/* ── Tab 2: Küchenstil ──────────────────────────────────────── */}
          {activeTab === 'kuechenstil' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 600, color: '#2C2420', margin: '0 0 1.5rem' }}>
                Kulinarisches Profil
              </h3>
              <div className="space-y-5" style={{ maxWidth: 520 }}>

                {/* Two-column: Küchenstil + Spezialitäten */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Küchenstil</label>
                    <div className="relative">
                      <ChefHat size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="text" value={kuechenstil} onChange={e => setKuechenstil(e.target.value)}
                        placeholder="Fine Dining…" className={fieldCls} style={fieldStyle}
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Spezialitäten</label>
                    <div className="relative">
                      <Sparkles size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="text" value={spezialitaeten} onChange={e => setSpezialitaeten(e.target.value)}
                        placeholder="Fermentation…" className={fieldCls} style={fieldStyle}
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    Bio / Über mich
                    <span style={{ marginLeft: 8, fontWeight: 400, letterSpacing: 0, textTransform: 'none', color: bio.length > 270 ? '#C9A84C' : '#C0B5A8' }}>
                      {bio.length}/300
                    </span>
                  </label>
                  <textarea value={bio}
                    onChange={e => { if (e.target.value.length <= 300) setBio(e.target.value); }}
                    placeholder="Erzähl etwas über dich und deine Küche…"
                    rows={4}
                    className="w-full px-4 py-3.5 rounded-xl text-[14px] text-[#2C2420] outline-none transition-all placeholder:text-[#C0B5A8] resize-none"
                    style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>

                <div>
                  <label style={labelStyle}>Lieblings-Zutaten</label>
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {tags.map(tag => (
                        <span key={tag} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 999, fontSize: 12,
                          background: 'rgba(107,58,75,0.08)', border: '1px solid rgba(107,58,75,0.18)', color: '#6B3A4B',
                        }}>
                          {tag}
                          <button onClick={() => setTags(p => p.filter(t => t !== tag))}
                            style={{ color: '#6B3A4B', opacity: 0.5, fontSize: 15, lineHeight: 1, marginLeft: 2 }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder="Zutat + Enter"
                      className="flex-1 px-4 py-3 rounded-xl text-[14px] text-[#2C2420] outline-none transition-all placeholder:text-[#C0B5A8]"
                      style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                    <button onClick={addTag}
                      style={{ padding: '0 14px', borderRadius: 12, fontSize: 20, fontWeight: 700,
                        background: 'rgba(107,58,75,0.08)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.18)', cursor: 'pointer' }}>
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Inspirationen</label>
                  <div className="relative">
                    <Sparkles size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="text" value={inspirationen} onChange={e => setInspirationen(e.target.value)}
                      placeholder="René Redzepi, Ferran Adrià…" className={fieldCls} style={fieldStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                {stilError && <ErrorBanner message={stilError} />}
                {stilSuccess && <SuccessBanner />}
                <SaveButton onClick={saveKuechenstil} loading={stilSaving} />
              </div>
            </div>
          )}

          {/* ── Tab 3: Social Media ────────────────────────────────────── */}
          {activeTab === 'social' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 600, color: '#2C2420', margin: '0 0 1.5rem' }}>
                Social Media & Links
              </h3>
              <div className="space-y-5" style={{ maxWidth: 460 }}>

                {/* Instagram */}
                <div>
                  <label style={labelStyle}>Instagram</label>
                  <div className="relative">
                    <Camera size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)}
                      placeholder="@deinname oder Link" className={fieldCls} style={fieldStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                {/* TikTok */}
                <div>
                  <label style={labelStyle}>TikTok</label>
                  <div className="relative">
                    <Music2 size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="text" value={tiktok} onChange={e => setTiktok(e.target.value)}
                      placeholder="@deinname" className={fieldCls} style={fieldStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                {/* YouTube */}
                <div>
                  <label style={labelStyle}>YouTube</label>
                  <div className="relative">
                    <PlayCircle size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="text" value={youtube} onChange={e => setYoutube(e.target.value)}
                      placeholder="Kanal-Link" className={fieldCls} style={fieldStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label style={labelStyle}>Website</label>
                  <div className="relative">
                    <Globe size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="text" value={website} onChange={e => setWebsite(e.target.value)}
                      placeholder="https://…" className={fieldCls} style={fieldStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                {/* LinkedIn */}
                <div>
                  <label style={labelStyle}>LinkedIn</label>
                  <div className="relative">
                    <Briefcase size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="text" value={linkedin} onChange={e => setLinkedin(e.target.value)}
                      placeholder="Profil-Link" className={fieldCls} style={fieldStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                {socialError && <ErrorBanner message={socialError} />}
                {socialSuccess && <SuccessBanner />}
                <SaveButton onClick={saveSocial} loading={socialSaving} />
              </div>
            </div>
          )}

          {/* ── Tab 4: Sicherheit ──────────────────────────────────────── */}
          {activeTab === 'sicherheit' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 600, color: '#2C2420', margin: '0 0 1.5rem' }}>
                Passwort ändern
              </h3>
              <div className="space-y-5" style={{ maxWidth: 420 }}>
                <div>
                  <label style={labelStyle}>Aktuelles Passwort</label>
                  <div className="relative">
                    <Lock size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type={showPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                      placeholder="••••••••" className={fieldCls + ' pr-11'} style={fieldStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#B09880' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#6B3A4B')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#B09880')}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Neues Passwort</label>
                  <div className="relative">
                    <Lock size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                      placeholder="Min. 6 Zeichen" className={fieldCls + ' pr-11'} style={fieldStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Neues Passwort bestätigen</label>
                  <div className="relative">
                    <Lock size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      placeholder="Passwort wiederholen" className={fieldCls + ' pr-11'} style={fieldStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                    {confirmPw.length > 0 && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {confirmPw === newPw
                          ? <CheckCircle size={14} color="#7CB87A" />
                          : <span style={{ color: '#E06B6B', fontSize: 14, fontWeight: 700 }}>✗</span>}
                      </div>
                    )}
                  </div>
                </div>
                {pwError && <ErrorBanner message={pwError} />}
                {pwSuccess && <SuccessBanner message="Passwort erfolgreich geändert!" />}
                <SaveButton onClick={changePassword} loading={pwSaving} label="Passwort ändern" />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
