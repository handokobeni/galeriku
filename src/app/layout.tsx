import type { Metadata, Viewport } from "next";
import { Inter, Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { ServiceWorkerRegistration } from "@/shared/components/service-worker-registration";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz", "SOFT"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-editorial",
});

export const metadata: Metadata = {
  title: "Galeriku",
  description: "Personal photo & video gallery",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Galeriku",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} ${jakarta.variable} font-sans`}
      >
        <ThemeProvider nonce={nonce}>
          {children}
          <Toaster />
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
