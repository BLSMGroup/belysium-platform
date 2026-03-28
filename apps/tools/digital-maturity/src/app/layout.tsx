import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Digital Maturity Assessment — Belysium Professional',
  description: 'AI-powered digital maturity assessment across 8 dimensions by Belysium Professional',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
