import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NetSim — Simulasi & Konfigurasi Jaringan",
    template: "%s · NetSim",
  },
  description:
    "Platform simulasi dan konfigurasi topologi jaringan berbasis AI: buat topologi, generate config Mikrotik/Cisco/Linux, dan tanya AI.",
  keywords: [
    "NetSim",
    "simulasi jaringan",
    "topologi",
    "Mikrotik",
    "Cisco",
    "RouterOS",
    "netplan",
    "konfigurasi jaringan",
  ],
  applicationName: "NetSim Pro",
  authors: [{ name: "Raka Syauqi" }],
  openGraph: {
    title: "NetSim — Simulasi & Konfigurasi Jaringan",
    description:
      "Desain topologi jaringan, generate config Mikrotik/Cisco/Linux dengan AI, dan ekspor konfigurasi.",
    type: "website",
    locale: "id_ID",
  },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
