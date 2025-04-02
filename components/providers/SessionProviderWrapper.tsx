"use client"; // Mark this component as a Client Component

import { SessionProvider } from "next-auth/react";
import React from "react";

// Define props if needed, though SessionProvider often doesn't require explicit props passed down like this
interface Props {
  children: React.ReactNode;
  // session?: any; // You might pass session from server components if needed, but usually SessionProvider fetches it
}

export default function SessionProviderWrapper({ children }: Props) {
  // You can add other providers here too if needed (e.g., ThemeProvider)
  return <SessionProvider>{children}</SessionProvider>;
}
