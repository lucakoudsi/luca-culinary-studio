'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from './Sidebar';
import { Menu, LayoutDashboard, BookOpen, Leaf, User } from 'lucide-react';

const AUTH_PATHS = ['/login', '/register'];
// Oeffentliche Marketing-Unterseiten der Landing-Page -- gleiche
// Chrome-lose Behandlung wie /login, /register.
const MARKETING_PATHS = ['/features', '/studio', '/preise', '/ueber-uns'];
// Kochmodus (/rezepte/<id>/kochen) -- Vollbild-Fokus fuers Handy neben dem
// Herd, keine Sidebar/Navigation. Dynamisches Segment, deshalb ein Muster
// statt eines festen Pfads -- muss NUR "/rezepte/<id>/kochen" treffen,
// nicht "/rezepte", "/rezepte/<id>" oder "/rezepte/<id>/bearbeiten".
const KOCHMODUS_PATH_RE = /^\/rezepte\/[^/]+\/kochen$/;

const BOTTOM_NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/rezepte',   icon: BookOpen,        label: 'Rezepte'   },
  { href: '/zutaten',   icon: Leaf,            label: 'Zutaten'   },
  { href: '/profil',    icon: User,            label: 'Profil'    },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Exaktes Match fuer '/' (die oeffentliche Landing-Page) -- NICHT
  // startsWith('/'), das wuerde sonst jede Route der App treffen.
  if (
    pathname === '/' ||
    AUTH_PATHS.some(p => pathname.startsWith(p)) ||
    MARKETING_PATHS.some(p => pathname.startsWith(p)) ||
    KOCHMODUS_PATH_RE.test(pathname)
  ) {
    return <>{children}</>;
  }

  return (
    // Kein h-screen/overflow-hidden mehr auf diesem oder dem naechsten Level
    // -- die vorherige Konstruktion (fester 100vh-Rahmen + <main> als einzige
    // interne Scroll-Zone via min-h-0/overflow-y-auto) blieb bei Tabs mit viel
    // Inhalt (Verwaltung -> Neuigkeiten) unterhalb einer bestimmten Hoehe
    // haengen -- zoomabhaengig reproduzierbar, also ein Verhaeltnis-Problem
    // zwischen fixen px-Inhalten und einem vh-gebundenen Deckel, nicht ein
    // einfaches "scrollt nicht". Sidebar UND die mobile Bottom-Nav sind
    // ohnehin bereits position:fixed (bleiben beim Scrollen an Ort und
    // Stelle) -- dafuer war die verschachtelte Scroll-Zone nie zwingend
    // noetig. Jetzt scrollt ganz normal das Dokument (html/body), das ist
    // die robusteste Variante ohne diese Klasse von Hoehen-Bugs.
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:ml-60 flex-1 flex flex-col">
        {/* Mobile topbar -- sticky statt Teil einer eigenen Scroll-Zone, damit
            sie beim (jetzt normalen Seiten-)Scrollen weiterhin oben sichtbar
            bleibt, wie zuvor. */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center px-5 py-3 border-b border-border bg-surface flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-text-primary p-1">
            <Menu size={22} />
          </button>
          <span className="ml-3 font-heading text-base font-bold text-text-primary">Culinary Studio</span>
        </div>

        <main className="pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation — hidden on md+ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border"
        style={{ background: 'var(--sidebar-bg, #F0EBE3)' }}>
        <div className="flex">
          {BOTTOM_NAV.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
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
    </div>
  );
}
