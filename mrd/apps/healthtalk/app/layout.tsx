import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "@mrd/ui/globals.css";
import "@mrd/ui/themes/healthtalk.css";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HealthTalk - AI Based Clinical Reporting",
  description: "AI-powered platform that streamlines consultations and automates documentation for mental healthcare professionals.",
  keywords: ["mental health", "AI", "clinical reporting", "documentation", "healthcare"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F8F8" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A2E" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={`${outfit.variable} ${inter.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
