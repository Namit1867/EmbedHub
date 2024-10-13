// components/session-provider-wrapper.tsx (client component)

"use client"; // Mark this component as a client component

import { SessionProvider } from "next-auth/react";

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
