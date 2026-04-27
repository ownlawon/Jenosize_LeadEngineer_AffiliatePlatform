import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jenosize Affiliate',
  description: 'Marketplace price comparison & affiliate platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
