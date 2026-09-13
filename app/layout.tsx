import type { Metadata } from "next";
import "./globals.css";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
    <html lang="en" className={cn("h-full antialiased", inter.variable, geistSans.variable, geistMono.variable)}>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
