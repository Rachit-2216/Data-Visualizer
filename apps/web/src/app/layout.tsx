import type { Metadata } from 'next';
import './globals.css';
import { MotionProvider } from '@/components/providers/motion-provider';

export const metadata: Metadata = {
  title: 'DataCanvas - No-Code Dataset Visualizer',
  description: 'Upload data, get 30+ visualizations instantly. English-to-chart AI assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        <MotionProvider>
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}

