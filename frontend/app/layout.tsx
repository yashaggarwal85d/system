import type { Metadata } from "next";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";
import "../styles/globals.css";
import { ThemeProvider as CustomThemeProvider } from "@/components/providers/theme-provider";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import SessionProviderClient from "@/components/providers/SessionProviderClient";

export const metadata: Metadata = {
  title: "Shogun Fight club",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Russo+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-russo-one relative">
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <CustomThemeProvider>
            <div className="absolute top-4 left-4 z-50">
              <ThemeToggleButton />
            </div>
            <SessionProviderClient>{children}</SessionProviderClient>
            <Toaster
              position="top-right"
              toastOptions={{
                classNames: {
                  toast:
                    "bg-background text-foreground border-border shadow-lg group",
                  title: "text-sm font-semibold",
                  description: "text-sm text-muted-foreground",
                  error: "!bg-destructive !text-destructive-foreground",
                  success: "!bg-success !text-success-foreground",
                  warning: "!bg-warning !text-warning-foreground",
                  info: "!bg-muted !text-muted-foreground",
                },
              }}
            />
          </CustomThemeProvider>
        </NextThemesProvider>
      </body>
    </html>
  );
}
