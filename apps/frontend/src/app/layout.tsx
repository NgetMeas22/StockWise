import type { Metadata } from 'next';
import '../styles/tokens.css';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Dental Systems — Smart Dental Inventory Platform',
  description: 'Enterprise-grade dental inventory management, stock ledger, procurement, and clinical supply tracking.',
  icons: {
    icon: '/images/dental-logo.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Kantumruy+Pro:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg text-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
