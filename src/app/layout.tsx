import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import Navbar from "../components/Navbar";
import { getServerSession } from "next-auth/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Budgy - Dashboard Financiero",
  description: "Gestión financiera personal",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Verificamos la sesión desde el servidor (¡Mucho más rápido y sin trabas!)
  const session = await getServerSession();

  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers session={session}>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}