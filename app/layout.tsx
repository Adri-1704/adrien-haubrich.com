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
  metadataBase: new URL("https://adrien-haubrich.com"),
  title: "Adrien Haubrich — Entrepreneur Digital Suisse",
  description:
    "Portfolio d'Adrien Haubrich, entrepreneur digital suisse. Fondateur de 9 projets : Yattoo, OnVousTrouve.ch, L'Atelier Suisse, FunkyFeet, Just-Tag, Signature Locale et Glariade.",
  keywords: [
    "Adrien Haubrich",
    "entrepreneur digital",
    "portfolio",
    "digital",
    "Suisse",
    "Valais",
    "Le Bouveret",
    "Yattoo",
    "OnVousTrouve",
    "L'Atelier Suisse",
    "FunkyFeet",
    "Just-Tag",
    "Signature Locale",
    "Glariade",
  ],
  authors: [{ name: "Adrien Haubrich" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://adrien-haubrich.com",
  },
  openGraph: {
    title: "Adrien Haubrich — Entrepreneur Digital Suisse",
    description:
      "Fondateur de 9 projets digitaux en Suisse. Produits SaaS, e-commerce et solutions locales.",
    url: "https://adrien-haubrich.com",
    siteName: "Adrien Haubrich",
    locale: "fr_CH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adrien Haubrich — Entrepreneur Digital Suisse",
    description:
      "Fondateur de 9 projets digitaux en Suisse. Produits SaaS, e-commerce et solutions locales.",
  },
  verification: {
    google: "GOOGLE_VERIFICATION_CODE",
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
