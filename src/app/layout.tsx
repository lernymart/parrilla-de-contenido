import { BrandProvider } from "@/components/BrandProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Parrilla de contenido",
  description:
    "Genera parrillas de contenido con investigación de competencia e IA para LernyMart e Intercert Latam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased text-slate-900`}>
        <BrandProvider>{children}</BrandProvider>
      </body>
    </html>
  );
}
