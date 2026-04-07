import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Adrien Haubrich — Entrepreneur Digital Suisse",
  description:
    "Portfolio d'Adrien Haubrich, entrepreneur digital suisse. Fondateur de 8 projets : Yattoo, OnVousTrouve.ch, L'Atelier Suisse, FunkyFeet, Just-Tag, Signature Locale et Glariade.",
  keywords: [
    "Adrien Haubrich",
    "entrepreneur digital",
    "Suisse",
    "Valais",
    "Le Bouveret",
    "Yattoo",
    "OnVousTrouve",
    "L'Atelier Suisse",
    "FunkyFeet",
    "Just-Tag",
    "Signature Locale",
  ],
  authors: [{ name: "Adrien Haubrich" }],
  openGraph: {
    title: "Adrien Haubrich — Entrepreneur Digital Suisse",
    description:
      "Fondateur de 8 projets digitaux en Suisse. Produits SaaS, e-commerce et solutions locales.",
    locale: "fr_CH",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">
        <script dangerouslySetInnerHTML={{ __html: `if(window.location.hash){history.replaceState(null,'',window.location.pathname);window.scrollTo(0,0);}` }} />
        {children}
      </body>
    </html>
  );
}
