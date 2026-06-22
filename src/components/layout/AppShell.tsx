'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const AUTH_PATHS = ['/login', '/register'];

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
        {/* Mobile header */}
        <div className="lg:hidden flex items-center px-5 py-3 border-b border-border bg-surface">
          <button onClick={() => setMobileOpen(true)} className="text-text-primary p-1">
            <Menu size={22} />
          </button>
          <span className="ml-3 font-heading text-base font-bold text-text-primary">LUCA Culinary</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
