import type { Metadata } from "next";
import "../styles/globals.css";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import { ThemeProvider } from "@/components/providers/theme-provider";
import SwirlBackground from "@/components/common/SwirlBackground";

export const metadata: Metadata = {
  title: "AscendAI",
  description:
    "Personal AI-powered self-improvement companion designed to help you grind real life like an RPG",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link rel="icon" href="/placeholder-logo.png" type="image/png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-inter">
        <SwirlBackground />
        <ThemeProvider>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
