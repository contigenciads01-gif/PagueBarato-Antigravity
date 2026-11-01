import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pague Barato — Central de Agentes",
  description: "Dashboard de importação e precificação Mercado Livre",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
