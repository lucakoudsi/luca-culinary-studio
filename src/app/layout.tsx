import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import ThemeProvider from '@/components/providers/ThemeProvider';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://culinary-studio.de';
const TITLE = 'Culinary Studio';
const DESCRIPTION = 'Professionelle Küchen-App für kulinarische Profis & Creator.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    siteName: TITLE,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: TITLE }],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-image.png'],
  },
};

const themeInitScript = `
(function(){try{
  var t=localStorage.getItem('theme');
  var h=new Date().getHours();
  var auto=h>=6&&h<18?'light':'dark';
  var a=t==='dark'?'dark':t==='light'?'light':auto;
  document.documentElement.setAttribute('data-theme',a);
  var f=localStorage.getItem('fontSize');
  if(f)document.documentElement.style.fontSize=f==='klein'?'14px':f==='gross'?'18px':'16px';
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
