import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Belgian Property ROI Calculator — Belysium Developments',
  description: 'Complete investment analysis for Belgian real estate with tax treatment by Belysium Developments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
