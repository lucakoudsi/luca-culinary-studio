'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import {
  User as UserIcon, Mail, Lock, Camera, LogOut, Loader2,
  Eye, EyeOff, CheckCircle, ChefHat, Sparkles, Shield,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  kuechenstil: string | null;
  spezialitaeten: string | null;
  bio: string | null;
  lieblingszutaten: string | null;
  inspirationen: string | null;
  created_at: string | null;
};

type Stats = { rezepte: number; projekte: number; fermente: number };
type Tab = 'profil' | 'kuechenstil' | 'sicherheit';

// ─── Shared styles ────────────────────────────────────────────────────────────

const fieldCls = 'w-full pl-10 pr-4 py-3.5 rounded-xl text-[14px] text-[#2C2420] outline-none transition-all placeholder:text-[#C0B5A8]';
const fieldStyle = { background: '#FFFFFF', border: '1px solid #E8E0D8' };
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
      <CheckCircle size={14} />
      {message}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl px-4 py-3 text-[12px]"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#FCA5A5' }}>
      {message}
    </div>
  );
}

function SaveButton({ onClick, loading, label = 'Speichern' }: { onClick: () => void; loading: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40"
      style={{
        background: 'linear-gradient(135deg, #562E3C 0%, #6B3A4B 60%, #7D4558 100%)',
        color: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(107,58,75,0.2)',
      }}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : null}
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser]             = useState<User | null>(null);
  const [profile, setProfile]       = useState<Profile | null>(null);
  const [stats, setStats]           = useState<Stats>({ rezepte: 0, projekte: 0, fermente: 0 });
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<Tab>('profil');

  // Tab 1 – Profil
  const [name, setName]                 = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Tab 2 – Küchenstil
  const [kuechenstil, setKuechenstil]       = useState('');
  const [spezialitaeten, setSpezialitaeten] = useState('');
  const [bio, setBio]                       = useState('');
  const [tags, setTags]                     = useState<string[]>([]);
  const [tagInput, setTagInput]             = useState('');
  const [inspirationen, setInspirationen]   = useState('');
  const [stilSaving, setStilSaving]         = useState(false);
  const [stilSuccess, setStilSuccess]       = useState(false);

  // Tab 3 – Sicherheit
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [pwSaving, setPwSaving]     = useState(false);
  const [pwSuccess, setPwSuccess]   = useState(false);
  const [pwError, setPwError]       = useState('');

  // Avatar
  const [avatarLoading, setAvatarLoading] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────
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
        }
        if (d.stats) setStats(d.stats);
        if (d.userCreatedAt) setUserCreatedAt(d.userCreatedAt);
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const displayName = name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const memberSince = (userCreatedAt ?? profile?.created_at)
    ? new Date(userCreatedAt ?? profile!.created_at!).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    : '—';

  // ── Save Profil ────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setProfileSaving(true);
    await fetch('/api/profil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name }),
    });
    setProfileSaving(false);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  // ── Save Küchenstil ────────────────────────────────────────────────────────
  const saveKuechenstil = async () => {
    setStilSaving(true);
    await fetch('/api/profil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kuechenstil, spezialitaeten, bio, lieblingszutaten: tags.join(', '), inspirationen }),
    });
    setStilSaving(false);
    setStilSuccess(true);
    setTimeout(() => setStilSuccess(false), 3000);
  };

  // ── Change Password ────────────────────────────────────────────────────────
  const changePassword = async () => {
    setPwError('');
    if (newPw !== confirmPw) { setPwError('Passwörter stimmen nicht überein.'); return; }
    if (newPw.length < 6) { setPwError('Passwort muss mindestens 6 Zeichen lang sein.'); return; }
    if (!user?.email) return;
    setPwSaving(true);
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPw });
    if (signInErr) { setPwError('Aktuelles Passwort ist falsch.'); setPwSaving(false); return; }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (updateErr) { setPwError(updateErr.message); return; }
    setPwSuccess(true);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setTimeout(() => setPwSuccess(false), 3000);
  };

  // ── Avatar Upload ──────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await fetch('/api/profil/avatar', { method: 'POST', body: formData });
      const d = await res.json();
      if (d.avatar_url) setProfile(prev => prev ? { ...prev, avatar_url: d.avatar_url } : null);
    } catch {}
    setAvatarLoading(false);
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // ── Tags ───────────────────────────────────────────────────────────────────
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

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profil',      label: 'Profil',      icon: UserIcon  },
    { id: 'kuechenstil', label: 'Küchenstil',  icon: ChefHat   },
    { id: 'sicherheit',  label: 'Sicherheit',  icon: Shield    },
  ];

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>

      {/* Header */}
      <div className="px-8 pt-8 pb-6" style={{ borderBottom: '1px solid #E8E0D8' }}>
        <div className="text-[10px] font-semibold tracking-[4px] uppercase mb-2"
          style={{ color: 'rgba(107,58,75,0.55)' }}>✦ &nbsp;Einstellungen</div>
        <h1 className="font-heading font-bold leading-none"
          style={{ fontSize: 28, color: '#2C2420', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Mein Profil
        </h1>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6 max-w-5xl" style={{ alignItems: 'flex-start' }}>

          {/* ── Left Card ─────────────────────────────────────────────────── */}
          <div className="w-full lg:w-[280px] flex-shrink-0 space-y-4">
            <div className="rounded-2xl p-6 text-center"
              style={{ background: '#FFFFFF', border: '1px solid #E8E0D8', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

              {/* Avatar */}
              <div className="relative inline-block mb-4">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover"
                    style={{ border: '3px solid #E8E0D8' }} />
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ background: 'linear-gradient(135deg, #6B3A4B, #9A5468)', border: '3px solid #E8E0D8' }}>
                    {initials}
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} disabled={avatarLoading}
                  className="absolute bottom-0.5 right-0.5 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{ background: '#6B3A4B', border: '2px solid white', boxShadow: '0 2px 8px rgba(107,58,75,0.3)' }}>
                  {avatarLoading
                    ? <Loader2 size={13} className="animate-spin text-white" />
                    : <Camera size={13} className="text-white" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {/* Name & email */}
              <h2 className="font-heading text-[18px] font-bold mb-1" style={{ color: '#2C2420' }}>
                {displayName || '—'}
              </h2>
              <p style={{ fontSize: 12, color: '#B09880' }}>{user?.email}</p>

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mt-3"
                style={{ background: 'rgba(107,58,75,0.07)', border: '1px solid rgba(107,58,75,0.18)' }}>
                <Sparkles size={10} style={{ color: '#6B3A4B' }} />
                <span style={{ fontSize: 10, color: '#6B3A4B', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Chef & Creator
                </span>
              </div>

              {/* Stats */}
              <div className="flex mt-5 pt-5" style={{ borderTop: '1px solid #E8E0D8' }}>
                {[
                  { label: 'Rezepte',  value: stats.rezepte },
                  { label: 'Projekte', value: stats.projekte },
                  { label: 'Fermente', value: stats.fermente },
                ].map((s, i, arr) => (
                  <div key={s.label} className="flex-1 text-center" style={{
                    borderRight: i < arr.length - 1 ? '1px solid #E8E0D8' : 'none',
                  }}>
                    <div className="text-[20px] font-bold font-heading" style={{ color: '#2C2420' }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: '#B09880', letterSpacing: '1px', textTransform: 'uppercase', marginTop: 2 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Member since */}
              <p className="mt-4" style={{ fontSize: 11, color: '#C0B5A8' }}>
                Mitglied seit {memberSince}
              </p>
            </div>

            {/* Logout */}
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all"
              style={{ background: 'rgba(192,80,80,0.07)', border: '1px solid rgba(192,80,80,0.2)', color: '#C05050' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(192,80,80,0.13)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(192,80,80,0.07)')}>
              <LogOut size={14} />
              Abmelden
            </button>
          </div>

          {/* ── Right Card ────────────────────────────────────────────────── */}
          <div className="flex-1 rounded-2xl overflow-hidden"
            style={{ background: '#FFFFFF', border: '1px solid #E8E0D8', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

            {/* Tabs */}
            <div className="flex" style={{ borderBottom: '1px solid #E8E0D8' }}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className="flex items-center gap-2 px-5 py-4 text-[11px] font-semibold tracking-[2px] uppercase transition-all relative"
                  style={{
                    color: activeTab === id ? '#6B3A4B' : '#B09880',
                    borderBottom: activeTab === id ? '2px solid #6B3A4B' : '2px solid transparent',
                    marginBottom: -1,
                    background: 'none',
                  }}>
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">

              {/* ── Tab 1: Profil ─────────────────────────────────────────── */}
              {activeTab === 'profil' && (
                <div className="space-y-5 max-w-md">
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
                        className={fieldCls} style={{ ...fieldStyle, opacity: 0.55, cursor: 'not-allowed' }} />
                    </div>
                    <p style={{ fontSize: 10, color: '#C0B5A8', marginTop: 4 }}>E-Mail kann nicht geändert werden.</p>
                  </div>
                  {profileSuccess && <SuccessBanner />}
                  <SaveButton onClick={saveProfile} loading={profileSaving} />
                </div>
              )}

              {/* ── Tab 2: Küchenstil ─────────────────────────────────────── */}
              {activeTab === 'kuechenstil' && (
                <div className="space-y-5 max-w-md">
                  <div>
                    <label style={labelStyle}>Küchenstil</label>
                    <div className="relative">
                      <ChefHat size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="text" value={kuechenstil} onChange={e => setKuechenstil(e.target.value)}
                        placeholder="Fine Dining, Modern European…" className={fieldCls} style={fieldStyle}
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Spezialitäten</label>
                    <div className="relative">
                      <Sparkles size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="text" value={spezialitaeten} onChange={e => setSpezialitaeten(e.target.value)}
                        placeholder="Fermentation, Sous-vide…" className={fieldCls} style={fieldStyle}
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Bio / Über mich
                      <span style={{ marginLeft: 8, fontWeight: 400, letterSpacing: 0, textTransform: 'none', fontSize: 10, color: '#C0B5A8' }}>
                        {bio.length}/300
                      </span>
                    </label>
                    <textarea value={bio} onChange={e => { if (e.target.value.length <= 300) setBio(e.target.value); }}
                      placeholder="Erzähl etwas über dich und deine Küche…"
                      rows={4} className="w-full px-4 py-3.5 rounded-xl text-[14px] text-[#2C2420] outline-none transition-all placeholder:text-[#C0B5A8] resize-none"
                      style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label style={labelStyle}>Lieblings-Zutaten</label>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {tags.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px]"
                            style={{ background: 'rgba(107,58,75,0.08)', border: '1px solid rgba(107,58,75,0.18)', color: '#6B3A4B' }}>
                            {tag}
                            <button onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                              style={{ color: '#6B3A4B', opacity: 0.5, lineHeight: 1, fontSize: 14, marginLeft: 2 }}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                          placeholder="Zutat hinzufügen + Enter"
                          className="w-full px-4 py-3 rounded-xl text-[14px] text-[#2C2420] outline-none transition-all placeholder:text-[#C0B5A8]"
                          style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                      </div>
                      <button onClick={addTag}
                        className="px-4 py-3 rounded-xl text-[18px] font-bold transition-all"
                        style={{ background: 'rgba(107,58,75,0.08)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.18)' }}>
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
                  {stilSuccess && <SuccessBanner />}
                  <SaveButton onClick={saveKuechenstil} loading={stilSaving} />
                </div>
              )}

              {/* ── Tab 3: Sicherheit ─────────────────────────────────────── */}
              {activeTab === 'sicherheit' && (
                <div className="space-y-5 max-w-md">
                  <div>
                    <label style={labelStyle}>Aktuelles Passwort</label>
                    <div className="relative">
                      <Lock size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type={showPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                        placeholder="••••••••" className={fieldCls + ' pr-11'} style={fieldStyle}
                        onFocus={onFocus} onBlur={onBlur} />
                      <button type="button" onClick={() => setShowPw(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: '#B09880' }}
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
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
