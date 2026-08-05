/**
 * @file layout.tsx
 * @description Root HTML layout: fonts, metadata, theme boot script, ThemeProvider.
 * @dependencies next/font, next/script, ThemeProvider, globals.css
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { ThemeProvider } from "@/components/providers/theme-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TruePhone",
    template: "%s · TruePhone",
  },
  description:
    "El marketplace más confiable para comprar y vender iPhones usados en Colombia.",
};

const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme")||"system";var r=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;document.documentElement.classList.toggle("dark",r==="dark");}catch(e){}})();`;

/**
 * RootLayout
 *
 * Wraps the app in Spanish lang, Geist font variables, and theme providers.
 *
 * @param props.children - Nested route segments.
 * @returns Root html/body shell.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
