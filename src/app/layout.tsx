import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import ThemeProvider from '@/components/providers/ThemeProvider';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'LUCA Culinary Creator',
  description: 'Professionelle Küchen-App für kulinarische Profis & Creator.',
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
