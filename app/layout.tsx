// app/layout.tsx (server component)

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import SessionProviderWrapper from '@/components/session-provider-wrapper'; // Import the client-side wrapper

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EmbedHub'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Wrap the children with SessionProviderWrapper */}
          <SessionProviderWrapper>
            {children}
          </SessionProviderWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
