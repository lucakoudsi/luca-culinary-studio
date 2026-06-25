import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'LUCA Culinary Creator',
  description: 'Professionelle Küchen-App für kulinarische Profis & Creator.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
