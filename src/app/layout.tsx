import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import AppFrame from '@/components/layout/AppFrame';
import ToastViewport from '@/components/ui/Toast';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

/* Native-script support for Hindi users */
const notoDevanagari = Noto_Sans_Devanagari({
  variable: '--font-noto-devanagari',
  subsets: ['devanagari'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KaamSetu – Local Employment & Small Business Management',
  description:
    'A unified digital platform connecting daily-wage workers with nearby employers and empowering small shopkeepers with inventory, sales, and Udhaar management.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f3' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0b0a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

/* Applied pre-paint so the correct theme renders on first load (no flash). */
const themeInitScript = `(function(){try{var s=localStorage.getItem('kaamsetu_theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-ink selection:bg-accent selection:text-accent-fg">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <AppProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-fg"
          >
            Skip to main content
          </a>
          <AppFrame>{children}</AppFrame>
          <ToastViewport />
        </AppProvider>
      </body>
    </html>
  );
}
