"use client"; // Mark this component as a Client Component

// import { SessionProvider } from "next-auth/react"; // Remove next-auth provider
import React from "react";

// Define props
interface Props {
  children: React.ReactNode;
}

export default function SessionProviderWrapper({ children }: Props) {
  // Return children directly, removing the SessionProvider wrapper
  // Other providers (like ThemeProvider) could still be added here if needed
  return <>{children}</>; // Use React Fragment or just return children
}
