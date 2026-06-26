'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import {
  User as UserIcon, Mail, Lock, LogOut, Loader2,
  Eye, EyeOff, CheckCircle, ChefHat, Shield, Sparkles, Star,
  Share2, Globe, Camera, PlayCircle, Briefcase, Music2,
  Users, Search, UserPlus, ChevronDown, ChevronUp, X as XIcon, Trash2,
} from 'lucide-react';
import { ADMIN_EMAIL, ALL_TITLES, STUFEN, getUserTier } from '@/config/roles';

const DepthHeader = dynamic(() => import('@/components/ui/DepthHeader'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  full_name: string | null;
  titel: string | null;
  stufe: number | null;
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
  kuechenstil_tags: string | null;
  techniken: string | null;
  geschmack_umami: number | null;
  geschmack_stil: number | null;
  geschmack_region: number | null;
};

type Stats = { rezepte: number; projekte: number; fermente: number };
type Tab = 'profil' | 'kuechenstil' | 'mein-stil' | 'social' | 'sicherheit' | 'verwaltung' | 'anfragen';

type AccessRequest = {
  id: string;
  name: string;
  email: string;
  grund: string;
  status: string;
  created_at: string;
};

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  titel: string | null;
  stufe: number | null;
};

const TIER_LABEL: Record<number, string> = { 1: 'Gast', 2: 'Einsteiger', 3: 'Profi', 4: 'Leitung' };
const TIER_COLOR: Record<number, { bg: string; text: string }> = {
  1:  { bg: 'rgba(154,128,112,0.12)', text: '#9A8070' },
  2:  { bg: 'rgba(90,138,154,0.12)',  text: '#5A8B9A' },
  3:  { bg: 'rgba(201,168,76,0.12)',  text: '#C9A84C' },
  4:  { bg: 'rgba(107,58,75,0.12)',   text: '#6B3A4B' },
  99: { bg: 'rgba(86,46,60,0.18)',    text: '#562E3C' },
};

const PERM_ROWS: { label: string; minTier: number }[] = [
  { label: 'Dashboard',         minTier: 1  },
  { label: 'Rezepte ansehen',   minTier: 1  },
  { label: 'Zutatenbibliothek', minTier: 2  },
  { label: 'Fermentation',      minTier: 2  },
  { label: 'Projekte',          minTier: 3  },
  { label: 'Mein Stil',         minTier: 3  },
  { label: 'Wein & Pairing',    minTier: 4  },
  { label: 'KI-Funktionen',     minTier: 4  },
  { label: 'Titel vergeben',    minTier: 99 },
  { label: 'Nutzer verwalten',  minTier: 99 },
];
const PERM_TIERS = [
  { tier: 1, label: 'Gast' },
  { tier: 2, label: 'Einsteiger' },
  { tier: 3, label: 'Profi' },
  { tier: 4, label: 'Leitung' },
  { tier: 99, label: 'Admin' },
];

// ─── Shared form styles ───────────────────────────────────────────────────────

const fieldCls = 'w-full pl-10 pr-4 py-3.5 rounded-xl text-[14px] outline-none transition-all placeholder:text-[#C0B5A8]';
const fieldStyle = { background: 'var(--bg, #F9F7F4)', border: '1px solid var(--border, #E8E0D8)', color: 'var(--text, #2C2420)' };
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

  // Tab: Mein Stil
  const KUECHEN_RICHTUNGEN = [
    'Fine Dining', 'Bistro', 'Bäckerei', 'Farm-to-Table',
    'Fusion', 'Vegan', 'Street Food', 'Regional',
    'Nordic', 'Asiatisch', 'Mediterran', 'Molekular',
  ];
  const [selectedRichtungen, setSelectedRichtungen] = useState<string[]>([]);
  const [technikTags, setTechnikTags]               = useState<string[]>([]);
  const [technikInput, setTechnikInput]             = useState('');
  const [inspirTags, setInspirTags]                 = useState<string[]>([]);
  const [inspirInput, setInspirInput]               = useState('');
  const [geschmackUmami, setGeschmackUmami]         = useState(50);
  const [geschmackStil, setGeschmackStil]           = useState(50);
  const [geschmackRegion, setGeschmackRegion]       = useState(50);
  const [meinStilSaving, setMeinStilSaving]         = useState(false);
  const [meinStilSuccess, setMeinStilSuccess]       = useState(false);
  const [meinStilError, setMeinStilError]           = useState('');

  // Tab 3 – Social Media
  const [instagram, setInstagram]   = useState('');
  const [tiktok, setTiktok]         = useState('');
  const [youtube, setYoutube]       = useState('');
  const [website, setWebsite]       = useState('');
  const [linkedin, setLinkedin]     = useState('');
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialSuccess, setSocialSuccess] = useState(false);
  const [socialError, setSocialError]   = useState('');

  // Tab 5 – Verwaltung (Admin only)
  const [adminUsers, setAdminUsers]           = useState<AdminUser[]>([]);
  const [adminSearch, setAdminSearch]         = useState('');
  const [adminLoading, setAdminLoading]       = useState(false);
  const [adminActing, setAdminActing]         = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess]       = useState<string | null>(null);
  const [adminStufeActing, setAdminStufeActing] = useState<string | null>(null);
  const [adminStufeSuccess, setAdminStufeSuccess] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteActing, setDeleteActing]       = useState<string | null>(null);

  // Tab 6 – Anfragen (Admin only)
  const [anfragen, setAnfragen]             = useState<AccessRequest[]>([]);
  const [anfragenLoaded, setAnfragenLoaded] = useState(false);
  const [anfragenLoading, setAnfragenLoading] = useState(false);
  const [anfragenTitels, setAnfragenTitels] = useState<Record<string, string>>({});
  const [anfragenStufen, setAnfragenStufen] = useState<Record<string, number>>({});
  const [anfragenActing, setAnfragenActing] = useState<string | null>(null);
  const [anfragenSuccessMsg, setAnfragenSuccessMsg] = useState<string | null>(null);
  const [anfragenError, setAnfragenError]   = useState('');
  const [showProcessed, setShowProcessed]   = useState(false);
  const [pendingCount, setPendingCount]     = useState(0);

  // Tab 4 – Sicherheit
  const [currentPw, setCurrentPw]     = useState('');
  const [newPw, setNewPw]             = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwSaving, setPwSaving]       = useState(false);
  const [pwSuccess, setPwSuccess]     = useState(false);
  const [pwError, setPwError]         = useState('');

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
          setSelectedRichtungen(d.profile.kuechenstil_tags
            ? d.profile.kuechenstil_tags.split(',').map((s: string) => s.trim()).filter(Boolean)
            : []);
          setTechnikTags(d.profile.techniken
            ? d.profile.techniken.split(',').map((s: string) => s.trim()).filter(Boolean)
            : []);
          setInspirTags(d.profile.inspirationen
            ? d.profile.inspirationen.split(',').map((s: string) => s.trim()).filter(Boolean)
            : []);
          setGeschmackUmami(d.profile.geschmack_umami ?? 50);
          setGeschmackStil(d.profile.geschmack_stil ?? 50);
          setGeschmackRegion(d.profile.geschmack_region ?? 50);
          setInstagram(d.profile.instagram ?? '');
          setTiktok(d.profile.tiktok ?? '');
          setYoutube(d.profile.youtube ?? '');
          setWebsite(d.profile.website ?? '');
          setLinkedin(d.profile.linkedin ?? '');
        }
        if (d.stats) setStats(d.stats);
        if (d.userCreatedAt) setUserCreatedAt(d.userCreatedAt);

        // Pending-Count-Badge für Admin vorab laden
        if (data.user.email === ADMIN_EMAIL) {
          fetch('/api/admin/requests').then(r => r.json()).then(rd => {
            const count = (rd.requests ?? []).filter((r: AccessRequest) => r.status === 'pending').length;
            setPendingCount(count);
          }).catch(() => {});
        }

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

  const saveMeinStil = async () => {
    setMeinStilSaving(true);
    setMeinStilError('');
    try {
      const res = await fetch('/api/profil', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kuechenstil_tags: selectedRichtungen.join(', '),
          techniken: technikTags.join(', '),
          inspirationen: inspirTags.join(', '),
          geschmack_umami: geschmackUmami,
          geschmack_stil: geschmackStil,
          geschmack_region: geschmackRegion,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setMeinStilError(d.error || 'Speichern fehlgeschlagen.'); return; }
      setMeinStilSuccess(true);
      setTimeout(() => setMeinStilSuccess(false), 3000);
    } catch {
      setMeinStilError('Netzwerkfehler.');
    } finally {
      setMeinStilSaving(false);
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
    console.log('[passwort] change result:', updateErr ? updateErr.message : 'success');
    setPwSaving(false);
    if (updateErr) { setPwError(updateErr.message); return; }
    setPwSuccess(true); setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setTimeout(() => setPwSuccess(false), 3000);
  };

  // Anfragen-Tab: neu laden wenn Tab aktiv wird ODER wenn user sich ändert (Auth-Timing-Fix)
  // user?.email statt isAdmin (abgeleitet nach diesem Hook) um TDZ zu vermeiden
  useEffect(() => {
    if (activeTab === 'anfragen' && user?.email === ADMIN_EMAIL) {
      loadAnfragen();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.email]);

  const loadAnfragen = async () => {
    setAnfragenLoading(true);
    setAnfragenError('');
    try {
      console.log('[anfragen] fetching /api/admin/requests ...');
      const res = await fetch('/api/admin/requests');
      console.log('[anfragen] response status:', res.status, '| ok:', res.ok);
      // res.json() wirft wenn der Server HTML statt JSON zurückgibt (z.B. bei Route-Crash)
      let d: { requests?: AccessRequest[]; error?: string };
      try {
        d = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        console.error('[anfragen] non-JSON response:', res.status, text.slice(0, 200));
        setAnfragenError(`Server-Fehler ${res.status}: Route gibt kein JSON zurück. Vercel Logs prüfen.`);
        return;
      }
      console.log('[anfragen] response data:', JSON.stringify(d));
      if (!res.ok) { setAnfragenError(d.error || 'Laden fehlgeschlagen.'); return; }
      const reqs: AccessRequest[] = d.requests ?? [];
      console.log('[anfragen] alle einträge:', JSON.stringify(reqs));
      console.log('[anfragen] pending filter:', reqs.filter(r => r.status === 'pending').map(r => r.email));
      console.log('[anfragen] bearbeitet filter:', reqs.filter(r => r.status && r.status !== 'pending').map(r => ({ email: r.email, status: r.status })));
      setAnfragen(reqs);
      setAnfragenLoaded(true);
      setPendingCount(reqs.filter(r => r.status === 'pending').length);
      // Jeden pending Request mit Standard-Titel vorbelegen
      const initTitels: Record<string, string> = {};
      reqs.forEach(r => { if (r.status === 'pending') initTitels[r.id] = 'Hobbykoch'; });
      setAnfragenTitels(initTitels);
    } catch (e) {
      console.error('[anfragen] fetch error:', e);
      setAnfragenError('Netzwerkfehler.');
    } finally {
      setAnfragenLoading(false);
    }
  };

  const approveAnfrage = async (id: string) => {
    setAnfragenActing(id);
    setAnfragenError('');
    try {
      const name = anfragen.find(r => r.id === id)?.name ?? '';
      const res = await fetch(`/api/admin/requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titel: anfragenTitels[id] || null, stufe: anfragenStufen[id] ?? 2 }),
      });
      const d = await res.json();
      if (!res.ok) {
        setAnfragenError(d.error || 'Annehmen fehlgeschlagen.');
        // 409 = already processed in DB but state is stale → remove card
        if (res.status === 409) {
          setAnfragen(prev => prev.filter(r => r.id !== id));
          setPendingCount(prev => Math.max(0, prev - 1));
        }
        return;
      }
      setAnfragen(prev => prev.filter(r => r.id !== id));
      setPendingCount(prev => Math.max(0, prev - 1));
      setAnfragenSuccessMsg(`${name} wurde angenommen und die Willkommens-Email wurde versendet.`);
      setTimeout(() => setAnfragenSuccessMsg(null), 4000);
    } catch {
      setAnfragenError('Netzwerkfehler.');
    } finally {
      setAnfragenActing(null);
    }
  };

  const rejectAnfrage = async (id: string) => {
    setAnfragenActing(id);
    setAnfragenError('');
    try {
      const res = await fetch(`/api/admin/requests/${id}/reject`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) {
        setAnfragenError(d.error || 'Ablehnen fehlgeschlagen.');
        if (res.status === 409) {
          setAnfragen(prev => prev.filter(r => r.id !== id));
          setPendingCount(prev => Math.max(0, prev - 1));
        }
        return;
      }
      setAnfragen(prev => prev.filter(r => r.id !== id));
      setPendingCount(prev => Math.max(0, prev - 1));
    } catch {
      setAnfragenError('Netzwerkfehler.');
    } finally {
      setAnfragenActing(null);
    }
  };

  const loadAdminUsers = async () => {
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const d = await res.json();
      if (res.ok) setAdminUsers(d.users ?? []);
    } catch {}
    setAdminLoading(false);
  };

  const saveAdminTitle = async (userId: string, titel: string | null) => {
    setAdminActing(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titel }),
      });
      if (res.ok) {
        setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, titel } : u));
        setAdminSuccess(userId);
        setTimeout(() => setAdminSuccess(null), 2000);
      }
    } catch {}
    setAdminActing(null);
  };

  const saveAdminStufe = async (userId: string, stufe: number) => {
    setAdminStufeActing(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stufe }),
      });
      if (res.ok) {
        setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, stufe } : u));
        setAdminStufeSuccess(userId);
        setTimeout(() => setAdminStufeSuccess(null), 2000);
      }
    } catch {}
    setAdminStufeActing(null);
  };

  const deleteUser = async (userId: string) => {
    setDeleteActing(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) { alert(d.error || 'Löschen fehlgeschlagen.'); return; }
      setAdminUsers(prev => prev.filter(u => u.id !== userId));
      setDeleteConfirmId(null);
    } catch {
      alert('Netzwerkfehler.');
    } finally {
      setDeleteActing(null);
    }
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
  const isAdmin = user?.email === ADMIN_EMAIL;

  const NAV: { id: Tab; label: string; sublabel: string; Icon: React.ElementType; badge?: number }[] = [
    { id: 'profil',      label: 'Profil',       sublabel: 'Name & Foto',     Icon: UserIcon  },
    { id: 'kuechenstil', label: 'Küchenstil',   sublabel: 'Dein Profil',     Icon: ChefHat   },
    { id: 'mein-stil',   label: 'Mein Stil',    sublabel: 'Küche & Stil',    Icon: Star      },
    { id: 'social',      label: 'Social Media', sublabel: 'Deine Links',     Icon: Share2    },
    { id: 'sicherheit',  label: 'Sicherheit',   sublabel: 'Passwort',        Icon: Shield    },
    ...(isAdmin ? [
      { id: 'verwaltung' as Tab, label: 'Verwaltung', sublabel: 'Nutzer & Rechte', Icon: Users    },
      { id: 'anfragen'   as Tab, label: 'Anfragen',   sublabel: 'Registrierungen', Icon: UserPlus, badge: pendingCount || undefined },
    ] : []),
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'var(--bg, #FAF8F5)', minHeight: '100vh' }}>

      {/* Breadcrumb + Header area */}
      <div className="px-4 sm:px-8 pt-6 sm:pt-8">
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
          role={profile?.titel || 'Chef'}
          stats={stats}
          avatarUrl={profile?.avatar_url}
          onAvatarClick={() => fileInputRef.current?.click()}
          socialLinks={{
            instagram: profile?.instagram,
            tiktok:    profile?.tiktok,
            youtube:   profile?.youtube,
            website:   profile?.website,
            linkedin:  profile?.linkedin,
          }}
        />
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      </div>

      {/* Two-column grid → single column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5 px-4 sm:px-8 pb-20 md:pb-8 mt-0">

        {/* ── Left nav column ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Nav card — horizontal scroll on mobile, vertical on md+ */}
          <div style={{ background: 'var(--surface, #FFFFFF)', borderRadius: 16, border: '1px solid var(--border, #E8E0D8)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible gap-1 p-2" style={{ scrollbarWidth: 'none' }}>
            {NAV.map(({ id, label, sublabel, Icon, badge }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex-shrink-0 md:flex-shrink flex items-center gap-2.5 rounded-[10px] transition-all text-left"
                style={{
                  padding: '8px 12px', minWidth: 'max-content', cursor: 'pointer',
                  background: activeTab === id ? 'rgba(107,58,75,0.06)' : 'transparent',
                  border: 'none',
                  outline: activeTab === id ? '2px solid rgba(107,58,75,0.15)' : '2px solid transparent',
                  marginBottom: 0,
                }}
                onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.background = 'rgba(107,58,75,0.03)'; }}
                onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.background = 'transparent'; }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                  background: activeTab === id ? '#6B3A4B' : 'rgba(107,58,75,0.08)',
                  transition: 'all 0.15s',
                }}>
                  <Icon size={14} style={{ color: activeTab === id ? '#FFFFFF' : '#8B7355' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2C2420', lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    {label}
                    {badge && badge > 0 ? (
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#6B3A4B', color: '#fff', borderRadius: 999, padding: '1px 6px', lineHeight: 1.6 }}>
                        {badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="hidden md:block" style={{ fontSize: 11, color: '#B09880', marginTop: 1 }}>{sublabel}</div>
                </div>
              </button>
            ))}
            </div>
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
        <div style={{ background: 'var(--surface, #FFFFFF)', borderRadius: 16, border: '1px solid var(--border, #E8E0D8)', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>

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

          {/* ── Tab: Mein Stil ─────────────────────────────────────────── */}
          {activeTab === 'mein-stil' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 600, color: '#2C2420', margin: '0 0 1.5rem' }}>
                Mein kulinarischer Stil
              </h3>

              <div className="space-y-8" style={{ maxWidth: 560 }}>

                {/* Küchenrichtungen */}
                <div>
                  <label style={labelStyle}>Küchenrichtungen</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                    {KUECHEN_RICHTUNGEN.map(r => {
                      const sel = selectedRichtungen.includes(r);
                      return (
                        <button key={r}
                          onClick={() => setSelectedRichtungen(prev =>
                            sel ? prev.filter(x => x !== r) : [...prev, r]
                          )}
                          style={{
                            padding: '7px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                            background: sel ? '#6B3A4B' : 'rgba(107,58,75,0.06)',
                            color: sel ? '#FFFFFF' : '#6B3A4B',
                            border: sel ? '1px solid #6B3A4B' : '1px solid rgba(107,58,75,0.2)',
                          }}>
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lieblingstechniken */}
                <div>
                  <label style={labelStyle}>Lieblingstechniken</label>
                  {technikTags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {technikTags.map(tag => (
                        <span key={tag} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 999, fontSize: 12,
                          background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#8B6820',
                        }}>
                          {tag}
                          <button onClick={() => setTechnikTags(p => p.filter(t => t !== tag))}
                            style={{ color: '#8B6820', opacity: 0.6, fontSize: 15, lineHeight: 1 }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" value={technikInput} onChange={e => setTechnikInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const t = technikInput.trim();
                          if (t && !technikTags.includes(t)) setTechnikTags(p => [...p, t]);
                          setTechnikInput('');
                        }
                      }}
                      placeholder="Sous-vide, Fermentation… + Enter"
                      className="flex-1 px-4 py-3 rounded-xl text-[14px] text-[#2C2420] outline-none transition-all placeholder:text-[#C0B5A8]"
                      style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                    <button onClick={() => {
                      const t = technikInput.trim();
                      if (t && !technikTags.includes(t)) setTechnikTags(p => [...p, t]);
                      setTechnikInput('');
                    }}
                      style={{ padding: '0 14px', borderRadius: 12, fontSize: 20, fontWeight: 700,
                        background: 'rgba(201,168,76,0.1)', color: '#8B6820', border: '1px solid rgba(201,168,76,0.3)', cursor: 'pointer' }}>
                      +
                    </button>
                  </div>
                </div>

                {/* Geschmacks-Schieberegler */}
                <div>
                  <label style={labelStyle}>Geschmacksprofil</label>
                  <div className="space-y-5" style={{ marginTop: 4 }}>
                    {([
                      { label: 'Geschmack', left: 'Frisch', right: 'Umami', value: geschmackUmami, set: setGeschmackUmami },
                      { label: 'Stil', left: 'Klassisch', right: 'Avantgarde', value: geschmackStil, set: setGeschmackStil },
                      { label: 'Orientierung', left: 'Regional', right: 'International', value: geschmackRegion, set: setGeschmackRegion },
                    ] as { label: string; left: string; right: string; value: number; set: (v: number) => void }[]).map(s => (
                      <div key={s.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: '#8B7355', fontWeight: 600 }}>{s.label}</span>
                          <span style={{ fontSize: 10, color: '#C0B5A8' }}>{s.value}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, color: '#9A8070', flexShrink: 0, minWidth: 60, textAlign: 'right' }}>{s.left}</span>
                          <input type="range" min={0} max={100} value={s.value}
                            onChange={e => s.set(Number(e.target.value))}
                            style={{ flex: 1, accentColor: '#6B3A4B', height: 4, cursor: 'pointer' }} />
                          <span style={{ fontSize: 11, color: '#9A8070', flexShrink: 0, minWidth: 60 }}>{s.right}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inspirationen als Tags */}
                <div>
                  <label style={labelStyle}>Inspirationen</label>
                  {inspirTags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {inspirTags.map(tag => (
                        <span key={tag} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 999, fontSize: 12,
                          background: 'rgba(107,58,75,0.08)', border: '1px solid rgba(107,58,75,0.18)', color: '#6B3A4B',
                        }}>
                          {tag}
                          <button onClick={() => setInspirTags(p => p.filter(t => t !== tag))}
                            style={{ color: '#6B3A4B', opacity: 0.5, fontSize: 15, lineHeight: 1 }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" value={inspirInput} onChange={e => setInspirInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const t = inspirInput.trim();
                          if (t && !inspirTags.includes(t)) setInspirTags(p => [...p, t]);
                          setInspirInput('');
                        }
                      }}
                      placeholder="René Redzepi, Noma… + Enter"
                      className="flex-1 px-4 py-3 rounded-xl text-[14px] text-[#2C2420] outline-none transition-all placeholder:text-[#C0B5A8]"
                      style={fieldStyle} onFocus={onFocus} onBlur={onBlur} />
                    <button onClick={() => {
                      const t = inspirInput.trim();
                      if (t && !inspirTags.includes(t)) setInspirTags(p => [...p, t]);
                      setInspirInput('');
                    }}
                      style={{ padding: '0 14px', borderRadius: 12, fontSize: 20, fontWeight: 700,
                        background: 'rgba(107,58,75,0.08)', color: '#6B3A4B', border: '1px solid rgba(107,58,75,0.18)', cursor: 'pointer' }}>
                      +
                    </button>
                  </div>
                </div>

                {meinStilError && <ErrorBanner message={meinStilError} />}
                {meinStilSuccess && <SuccessBanner message="Stil gespeichert!" />}
                <SaveButton onClick={saveMeinStil} loading={meinStilSaving} label="Stil speichern" />
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

                {/* Aktuelles Passwort */}
                <div>
                  <label style={labelStyle}>Aktuelles Passwort</label>
                  <div className="relative">
                    <Lock size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type={showCurrent ? 'text' : 'password'} value={currentPw}
                      onChange={e => setCurrentPw(e.target.value)}
                      placeholder="••••••••" className={fieldCls + ' pr-11'} style={fieldStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={() => setShowCurrent(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#B09880' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#6B3A4B')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#B09880')}>
                      {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Neues Passwort */}
                <div>
                  <label style={labelStyle}>Neues Passwort</label>
                  <div className="relative">
                    <Lock size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type={showNew ? 'text' : 'password'} value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      placeholder="Min. 6 Zeichen" className={fieldCls + ' pr-11'} style={fieldStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={() => setShowNew(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#B09880' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#6B3A4B')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#B09880')}>
                      {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Neues Passwort bestätigen */}
                <div>
                  <label style={labelStyle}>Neues Passwort bestätigen</label>
                  <div className="relative">
                    <Lock size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      placeholder="Passwort wiederholen" className={fieldCls + ' pr-20'} style={fieldStyle}
                      onFocus={onFocus} onBlur={onBlur} />
                    {/* Match indicator to the left of the eye button */}
                    {confirmPw.length > 0 && (
                      <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        {confirmPw === newPw
                          ? <CheckCircle size={14} color="#7CB87A" />
                          : <span style={{ color: '#E06B6B', fontSize: 14, fontWeight: 700 }}>✗</span>}
                      </div>
                    )}
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#B09880' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#6B3A4B')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#B09880')}>
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {pwError && <ErrorBanner message={pwError} />}
                {pwSuccess && <SuccessBanner message="Passwort erfolgreich geändert!" />}
                <SaveButton onClick={changePassword} loading={pwSaving} label="Passwort ändern" />
              </div>
            </div>
          )}

          {/* ── Tab 5: Verwaltung (Admin only) ─────────────────────────── */}
          {activeTab === 'verwaltung' && isAdmin && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 600, color: '#2C2420', margin: '0 0 1.75rem' }}>
                Nutzerverwaltung
              </h3>

              {/* Search + Load */}
              <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', alignItems: 'center' }}>
                <div className="relative flex-1" style={{ maxWidth: 340 }}>
                  <Search size={14} color="#B09880" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type="text" value={adminSearch} onChange={e => setAdminSearch(e.target.value)}
                    placeholder="Nach Name oder E-Mail suchen…"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] text-[#2C2420] outline-none transition-all placeholder:text-[#C0B5A8]"
                    style={{ background: '#F9F7F4', border: '1px solid #E8E0D8' }}
                    onFocus={onFocus} onBlur={onBlur} />
                </div>
                <button onClick={loadAdminUsers} disabled={adminLoading}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-40"
                  style={{ background: 'rgba(107,58,75,0.08)', border: '1px solid rgba(107,58,75,0.2)', color: '#6B3A4B' }}>
                  {adminLoading ? <Loader2 size={13} className="animate-spin" /> : <Users size={13} />}
                  Laden
                </button>
              </div>

              {/* User list */}
              {adminUsers.length === 0 && !adminLoading && (
                <p style={{ fontSize: 13, color: '#C0B5A8', marginBottom: '2rem' }}>
                  Klicke „Laden" um alle Nutzer anzuzeigen.
                </p>
              )}

              {adminUsers.filter(u =>
                !adminSearch ||
                u.email.toLowerCase().includes(adminSearch.toLowerCase()) ||
                u.full_name.toLowerCase().includes(adminSearch.toLowerCase())
              ).map(u => {
                const tier = getUserTier(u.email, u.stufe);
                const tc = TIER_COLOR[tier] ?? TIER_COLOR[1];
                const tl = u.email === ADMIN_EMAIL ? 'Admin' : (TIER_LABEL[tier] ?? `Stufe ${tier}`);
                const initials = (u.full_name || u.email)
                  .split(/[\s@]/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                const isConfirming = deleteConfirmId === u.id;
                return (
                  <div key={u.id} style={{
                    borderRadius: 12, marginBottom: 6,
                    background: u.email === ADMIN_EMAIL ? 'rgba(86,46,60,0.04)' : '#FAFAF9',
                    border: isConfirming ? '1px solid rgba(192,80,80,0.35)' : '1px solid #EEE8E2',
                    overflow: 'hidden', transition: 'border-color 0.15s',
                  }}>
                    {/* Main row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                      {/* Avatar */}
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6B3A4B,#C9A84C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', fontWeight: 600, flexShrink: 0 }}>
                          {initials}
                        </div>
                      )}

                      {/* Name + email */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2C2420', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.full_name || '—'}
                        </div>
                        <div style={{ fontSize: 11, color: '#9A8070', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.email}
                        </div>
                      </div>

                      {/* Tier badge */}
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '3px 8px', borderRadius: 999, background: tc.bg, color: tc.text, flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {tl}
                      </div>

                      {/* Dropdowns + Delete — disabled for admin */}
                      {u.email === ADMIN_EMAIL ? (
                        <div style={{ fontSize: 11, color: '#C0B5A8', textAlign: 'center', flexShrink: 0 }}>Administrator</div>
                      ) : (
                        <>
                          {/* Titel dropdown */}
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#B09880', marginBottom: 3 }}>Titel</div>
                            <select
                              value={u.titel ?? ''}
                              disabled={adminActing === u.id}
                              onChange={e => saveAdminTitle(u.id, e.target.value || null)}
                              style={{
                                width: 160, padding: '5px 8px', borderRadius: 8, fontSize: 12,
                                background: '#F9F7F4', border: '1px solid #E8E0D8', color: '#2C2420',
                                cursor: 'pointer', outline: 'none',
                              }}>
                              <option value="">— kein Titel —</option>
                              {ALL_TITLES.map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            {adminActing === u.id && (
                              <Loader2 size={12} className="animate-spin absolute right-2 bottom-1.5" style={{ color: '#6B3A4B' }} />
                            )}
                            {adminSuccess === u.id && (
                              <CheckCircle size={12} color="#5A9A58" className="absolute right-2 bottom-1.5" />
                            )}
                          </div>

                          {/* Stufe dropdown */}
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#B09880', marginBottom: 3 }}>Stufe</div>
                            <select
                              value={u.stufe ?? 1}
                              disabled={adminStufeActing === u.id}
                              onChange={e => saveAdminStufe(u.id, Number(e.target.value))}
                              style={{
                                width: 160, padding: '5px 8px', borderRadius: 8, fontSize: 12,
                                background: '#F9F7F4', border: '1px solid #E8E0D8', color: '#2C2420',
                                cursor: 'pointer', outline: 'none',
                              }}>
                              {STUFEN.map(s => (
                                <option key={s.stufe} value={s.stufe}>{s.label}</option>
                              ))}
                            </select>
                            {adminStufeActing === u.id && (
                              <Loader2 size={12} className="animate-spin absolute right-2 bottom-1.5" style={{ color: '#6B3A4B' }} />
                            )}
                            {adminStufeSuccess === u.id && (
                              <CheckCircle size={12} color="#5A9A58" className="absolute right-2 bottom-1.5" />
                            )}
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={() => setDeleteConfirmId(isConfirming ? null : u.id)}
                            title="Nutzer löschen"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '5px', borderRadius: 6, flexShrink: 0,
                              color: isConfirming ? '#C05050' : 'rgba(192,80,80,0.45)',
                              display: 'flex', alignItems: 'center', transition: 'color 0.15s',
                              alignSelf: 'flex-end', marginBottom: 2,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#C05050')}
                            onMouseLeave={e => (e.currentTarget.style.color = isConfirming ? '#C05050' : 'rgba(192,80,80,0.45)')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Inline confirmation panel */}
                    {isConfirming && (
                      <div style={{
                        padding: '10px 14px 12px',
                        borderTop: '1px solid rgba(192,80,80,0.15)',
                        background: 'rgba(192,80,80,0.03)',
                      }}>
                        <p style={{ fontSize: 12, color: '#4A2020', margin: '0 0 10px', lineHeight: 1.5 }}>
                          Nutzer <strong>{u.full_name || u.email}</strong> ({u.email}) wirklich löschen?<br />
                          Der Account wird entfernt, die Email kann erneut verwendet werden.
                        </p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            style={{
                              padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                              background: '#F9F7F4', border: '1px solid #E8E0D8', color: '#8B7355', cursor: 'pointer',
                            }}>
                            Abbrechen
                          </button>
                          <button
                            onClick={() => deleteUser(u.id)}
                            disabled={deleteActing === u.id}
                            className="flex items-center gap-1.5 disabled:opacity-40"
                            style={{
                              padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                              background: 'linear-gradient(135deg,#C05050,#A03030)', color: '#fff',
                              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                            }}>
                            {deleteActing === u.id
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Trash2 size={12} />}
                            Löschen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Permissions overview */}
              <div style={{ marginTop: '2.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 600, color: '#2C2420', margin: '0 0 0.5rem' }}>
                  Rechte-Übersicht
                </h3>
                <p style={{ fontSize: 12, color: '#9A8070', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  Titel (Anzeigename) und Stufe (Berechtigung) sind getrennt einstellbar.
                  Ein <em>„Sous-Chef"</em> kann z.B. Stufe 1 haben, wenn er nur zuschauen soll.
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E8E0D8' }}>
                        <th style={{ textAlign: 'left', padding: '8px 12px', color: '#8B7355', fontWeight: 600, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
                          Bereich
                        </th>
                        {PERM_TIERS.map(({ tier, label }) => (
                          <th key={tier} style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 700, fontSize: 10, letterSpacing: 1, color: TIER_COLOR[tier].text }}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERM_ROWS.map(({ label, minTier }, i) => (
                        <tr key={label} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)', borderBottom: '1px solid #F0EAE4' }}>
                          <td style={{ padding: '9px 12px', color: '#2C2420', fontWeight: 500 }}>{label}</td>
                          {PERM_TIERS.map(({ tier }) => (
                            <td key={tier} style={{ textAlign: 'center', padding: '9px 10px' }}>
                              {tier >= minTier ? (
                                <span style={{ color: '#5A9A58', fontWeight: 700, fontSize: 14 }}>✓</span>
                              ) : (
                                <span style={{ color: '#D0C8C0', fontSize: 13 }}>✕</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 6: Anfragen (Admin only) ───────────────────────────── */}
          {activeTab === 'anfragen' && isAdmin && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 600, color: '#2C2420', margin: 0 }}>
                  Registrierungsanfragen
                </h3>
                <button onClick={loadAnfragen} disabled={anfragenLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-40"
                  style={{ background: 'rgba(107,58,75,0.08)', border: '1px solid rgba(107,58,75,0.2)', color: '#6B3A4B' }}>
                  {anfragenLoading ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                  Aktualisieren
                </button>
              </div>

              {anfragenError && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[12px] mb-4"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#E06B6B' }}>
                  {anfragenError}
                  <button onClick={() => setAnfragenError('')} style={{ marginLeft: 'auto' }}><XIcon size={13} /></button>
                </div>
              )}

              {anfragenSuccessMsg && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] mb-4"
                  style={{ background: 'rgba(90,154,88,0.08)', border: '1px solid rgba(90,154,88,0.25)', color: '#3A7A38' }}>
                  <CheckCircle size={13} style={{ flexShrink: 0 }} />
                  {anfragenSuccessMsg}
                </div>
              )}

              {anfragenLoading && anfragen.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin" style={{ color: '#6B3A4B' }} />
                </div>
              )}

              {/* Pending */}
              {(() => {
                const pending = anfragen.filter(r => !r.status || r.status === 'pending');
                if (!anfragenLoading && anfragenLoaded && pending.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-center" style={{ color: '#C0B5A8' }}>
                      <CheckCircle size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Keine offenen Anfragen</p>
                      <p style={{ fontSize: 12, marginTop: 4 }}>Alle erledigt!</p>
                    </div>
                  );
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.5rem' }}>
                    {pending.map(req => (
                      <div key={req.id} style={{
                        background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E0D8',
                        padding: '16px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                      }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          {/* Initials */}
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg,#6B3A4B,#C9A84C)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, color: 'white', fontWeight: 700,
                          }}>
                            {req.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#2C2420' }}>{req.name}</div>
                            <div style={{ fontSize: 12, color: '#9A8070', marginTop: 1 }}>{req.email}</div>
                            <div style={{ fontSize: 11, color: '#B09880', marginTop: 2 }}>
                              {new Date(req.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        {/* Grund */}
                        <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#F9F7F4', border: '1px solid #EEE8E2' }}>
                          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#B09880', marginBottom: 4 }}>Warum möchtest du Zugang?</div>
                          <p style={{ fontSize: 13, color: '#2C2420', margin: 0, lineHeight: 1.55 }}>{req.grund}</p>
                        </div>

                        {/* Titel + Stufe + Buttons */}
                        <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          <div>
                            <label style={{ ...labelStyle, marginBottom: 4 }}>Titel (Anzeigename)</label>
                            <select
                              value={anfragenTitels[req.id] ?? 'Hobbykoch'}
                              onChange={e => setAnfragenTitels(prev => ({ ...prev, [req.id]: e.target.value }))}
                              style={{ padding: '7px 10px', borderRadius: 8, fontSize: 12, background: '#F9F7F4', border: '1px solid #E8E0D8', color: '#2C2420', outline: 'none' }}>
                              {ALL_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ ...labelStyle, marginBottom: 4 }}>Stufe (Berechtigung)</label>
                            <select
                              value={anfragenStufen[req.id] ?? 2}
                              onChange={e => setAnfragenStufen(prev => ({ ...prev, [req.id]: Number(e.target.value) }))}
                              style={{ padding: '7px 10px', borderRadius: 8, fontSize: 12, background: '#F9F7F4', border: '1px solid #E8E0D8', color: '#2C2420', outline: 'none' }}>
                              {STUFEN.map(s => <option key={s.stufe} value={s.stufe}>{s.label}</option>)}
                            </select>
                          </div>

                          <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
                            <button
                              onClick={() => approveAnfrage(req.id)}
                              disabled={anfragenActing === req.id}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-40"
                              style={{ background: 'linear-gradient(135deg,#3A7A38,#4A9A47)', color: '#fff', border: 'none' }}>
                              {anfragenActing === req.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                              Annehmen
                            </button>
                            <button
                              onClick={() => rejectAnfrage(req.id)}
                              disabled={anfragenActing === req.id}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-40"
                              style={{ background: 'rgba(192,80,80,0.08)', border: '1px solid rgba(192,80,80,0.25)', color: '#C05050' }}>
                              {anfragenActing === req.id ? <Loader2 size={12} className="animate-spin" /> : <XIcon size={12} />}
                              Ablehnen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Bearbeitet toggle */}
              {anfragenLoaded && anfragen.some(r => r.status && r.status !== 'pending') && (
                <div>
                  <button
                    onClick={() => setShowProcessed(p => !p)}
                    className="flex items-center gap-2 text-[12px] font-medium mb-3 transition-colors"
                    style={{ color: '#9A8070', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showProcessed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Bearbeitet ({anfragen.filter(r => r.status && r.status !== 'pending').length})
                  </button>

                  {showProcessed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {anfragen.filter(r => r.status && r.status !== 'pending').map(req => (
                        <div key={req.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderRadius: 10,
                          background: '#FAFAF9', border: '1px solid #EEE8E2', opacity: 0.8,
                        }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            background: req.status === 'approved' ? 'rgba(90,154,88,0.15)' : 'rgba(192,80,80,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, color: req.status === 'approved' ? '#5A9A58' : '#C05050', fontWeight: 700,
                          }}>
                            {req.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#2C2420' }}>{req.name}</div>
                            <div style={{ fontSize: 11, color: '#B09880' }}>{req.email}</div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: 0.5, padding: '3px 8px', borderRadius: 999,
                            background: req.status === 'approved' ? 'rgba(90,154,88,0.1)' : 'rgba(192,80,80,0.08)',
                            color: req.status === 'approved' ? '#5A9A58' : '#C05050',
                          }}>
                            {req.status === 'approved' ? 'Angenommen' : 'Abgelehnt'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
