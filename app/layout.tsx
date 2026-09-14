import type { Metadata } from "next";
import "./globals.css";
import { Inter, Instrument_Serif, Playfair_Display, Outfit } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const instrumentSerif = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-instrument" });
const playfair = Playfair_Display({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-playfair' });
const geistFallback = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMonoFallback = Inter({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Solida",
    default: "Solida | Core Banking for Microfinance",
  },
  description: "Enterprise-grade core banking and operations platform for modern microfinance institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased scroll-smooth", inter.variable, outfit.variable, instrumentSerif.variable, geistFallback.variable, geistMonoFallback.variable)}>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
