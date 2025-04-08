"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

interface SessionProviderWrapperProps {
  children: React.ReactNode;
}

// This wrapper component ensures that SessionProvider, which uses context,
// is treated as a client component.
export default function SessionProviderWrapper({
  children,
}: SessionProviderWrapperProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
