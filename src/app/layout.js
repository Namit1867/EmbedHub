// src/app/layout.js
'use client';

import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}