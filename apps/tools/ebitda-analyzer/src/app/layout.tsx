import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EBITDA Analyzer — Belysium Professional',
  description: 'AI-powered EBITDA improvement analysis by Belysium Professional',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
