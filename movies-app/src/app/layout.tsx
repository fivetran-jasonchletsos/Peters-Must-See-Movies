import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import TopNav from "@/components/TopNav";
import Script from "next/script";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Peter's Movies",
  description:
    "Peter Chletsos's list of must-see movies. It's not what you look at that matters; it's what you see.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body className="scratchy min-h-screen flex flex-col">
        <TopNav />
        <div className="flex-1">{children}</div>
        <Footer />
        <Script src="/feedback-widget.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
