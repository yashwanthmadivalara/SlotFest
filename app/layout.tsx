import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'SlotFeast - Campus Canteen OS | Every meal, perfectly timed',
  description: 'Intelligent campus canteen operating system with predictive demand intelligence, batch preparation, single-counter queue management, and real-time notifications.',
  openGraph: {
    title: 'SlotFeast - Campus Canteen OS',
    description: 'Every meal, perfectly timed. Intelligent campus canteen operating system.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SlotFeast - Campus Canteen OS',
    description: 'Every meal, perfectly timed. Intelligent campus canteen operating system.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
