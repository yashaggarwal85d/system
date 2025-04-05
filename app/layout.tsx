import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper"; // Import the wrapper
import { ThemeProvider } from "@/components/providers/theme-provider"; // Import ThemeProvider

export const metadata: Metadata = {
  title: "Flickering Letters",
  description: "A cyberpunk task management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: SessionProvider requires a client component boundary if used directly here.
  // However, wrapping the body content is generally fine in the App Router layout.
  // For more complex scenarios needing session on the server, refer to next-auth docs.
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-inter">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // Assuming dark is the default, adjust if needed
          enableSystem
          disableTransitionOnChange
        >
          <SessionProviderWrapper>
            {/* Use the client component wrapper */}
            {children}
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
