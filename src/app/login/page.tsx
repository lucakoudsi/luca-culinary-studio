'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

const FOOD_IMG = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200';

function OrnamentLine({ flip }: { flip?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px bg-[#C9A84C]/25" style={{ width: 32 }} />
      <span style={{ color: 'rgba(201,168,76,0.45)', fontSize: 10 }}>✦</span>
      <div className="h-px bg-[#C9A84C]/35" style={{ width: 14 }} />
      <span style={{ color: '#C9A84C', fontSize: 13 }}>{flip ? '❧' : '❦'}</span>
      <div className="h-px bg-[#C9A84C]/35" style={{ width: 14 }} />
      <span style={{ color: 'rgba(201,168,76,0.45)', fontSize: 10 }}>✦</span>
      <div className="h-px bg-[#C9A84C]/25" style={{ width: 32 }} />
    </div>
  );
}

function LogoBlock() {
  return (
    <div className="flex flex-col items-center select-none">
      <OrnamentLine />

      <img
        src="/chef-logo-gold.png"
        alt="Culinary Studio"
        width={70}
        height={70}
        style={{
          width: 70,
          height: 70,
          objectFit: 'contain',
          marginTop: 10,
          marginBottom: 10,
          filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.3))',
        }}
      />

      <OrnamentLine flip />

      <p style={{ fontSize: 13, color: '#C9A84C', letterSpacing: '5px', textTransform: 'uppercase', marginTop: 12, fontWeight: 500 }}>
        CULINARY STUDIO
      </p>
      <div style={{ width: 130, height: 0.5, background: 'rgba(201,168,76,0.3)', marginTop: 10 }} />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message === 'Invalid login credentials' ? 'E-Mail oder Passwort ist falsch.' : err.message);
      setLoading(false);
      return;
    }
    router.push('/');
    router.refresh();
  };

  const fieldCls = "w-full pl-10 pr-4 py-3.5 rounded-xl text-[14px] text-[#F5F0E8] outline-none transition-all placeholder:text-[#3A3530]";
  const fieldStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.45)';
    e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(201,168,76,0.07), inset 0 0 0 1px rgba(201,168,76,0.1)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
    e.currentTarget.style.boxShadow   = 'none';
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A0A' }}>

      {/* ── Left: Food Image ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col">
        <img
          src={FOOD_IMG}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.6) saturate(0.8)' }}
        />
        {/* Dark overlay gradient */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.8) 100%)',
        }} />
        {/* Right edge fade into form */}
        <div className="absolute inset-y-0 right-0 w-32" style={{
          background: 'linear-gradient(90deg, transparent, #0A0A0A)',
        }} />

        {/* Top badge */}
        <div className="relative z-10 p-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
            <span style={{ color: '#C9A84C', fontSize: 10 }}>✦</span>
            <span style={{ color: 'rgba(201,168,76,0.8)', fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase' }}>
              Fine Dining Studio
            </span>
          </div>
        </div>

        {/* Bottom text */}
        <div className="relative z-10 mt-auto p-10 pb-12">
          <div className="w-10 h-px mb-4" style={{ background: '#C9A84C' }} />
          <h2 className="font-heading text-[28px] font-bold text-white leading-tight mb-2">
            Dein digitaler<br />Michelin-Sous-Chef
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, letterSpacing: '2px' }}>
            Rezepte · Menüs · Kreationen
          </p>
        </div>
      </div>

      {/* ── Right: Form ────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 relative"
        style={{ background: '#0A0A0A' }}>

        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(201,168,76,0.04) 0%, transparent 70%)',
        }} />

        <div className="relative w-full max-w-[380px]">

          {/* Logo */}
          <div className="mb-10">
            <LogoBlock />
          </div>

          {/* Heading */}
          <div className="mb-7 text-center">
            <h2 className="font-heading text-[24px] font-bold text-[#F5F0E8]">Willkommen zurück</h2>
            <p style={{ color: 'rgba(168,152,128,0.7)', fontSize: 13, marginTop: 4 }}>
              Melde dich in deiner Küche an
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 10, color: '#A89880', marginBottom: 6, letterSpacing: '3px', textTransform: 'uppercase' }}>
                E-Mail
              </label>
              <div className="relative">
                <Mail size={14} color="#3A3530" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="deine@email.de" autoComplete="email" required
                  className={fieldCls} style={fieldStyle}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>
            </div>

            {/* Passwort */}
            <div>
              <label style={{ display: 'block', fontSize: 10, color: '#A89880', marginBottom: 6, letterSpacing: '3px', textTransform: 'uppercase' }}>
                Passwort
              </label>
              <div className="relative">
                <Lock size={14} color="#3A3530" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password" required
                  className={fieldCls + ' pr-11'} style={fieldStyle}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#3A3530' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#A89880')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#3A3530')}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-[12px]"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#FCA5A5' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold transition-all disabled:opacity-40 mt-1"
              style={{
                background: 'linear-gradient(135deg, #B8942A 0%, #C9A84C 40%, #E2C06A 70%, #C9A84C 100%)',
                color: '#0A0A0A',
                boxShadow: '0 4px 24px rgba(201,168,76,0.25), 0 1px 0 rgba(255,255,255,0.1) inset',
                letterSpacing: '0.5px',
              }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> Anmelden…</> : 'Anmelden'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, letterSpacing: '2px' }}>ODER</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Register link */}
          <p className="text-center" style={{ fontSize: 13, color: 'rgba(168,152,128,0.6)' }}>
            Noch kein Account?{' '}
            <Link href="/register" className="font-semibold transition-colors"
              style={{ color: '#C9A84C' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#E2C06A')}
              onMouseLeave={e => (e.currentTarget.style.color = '#C9A84C')}>
              Registrieren
            </Link>
          </p>

          {/* Version */}
          <p className="text-center mt-10" style={{ fontSize: 10, color: 'rgba(255,255,255,0.08)', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Luca Culinary Studio
          </p>
        </div>
      </div>
    </div>
  );
}
