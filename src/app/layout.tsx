import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kas MPK Trenggana Sumapala | SMAN 2 Taruna Bhayangkara Jatim",
  description:
    "Sistem Informasi Manajemen Kas & Iuran Majelis Perwakilan Kelas (MPK) Trenggana Sumapala SMAN 2 Taruna Bhayangkara Jawa Timur Periode 2026/2027.",
  icons: {
    icon: "/logo-mpk.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-slate-900 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
