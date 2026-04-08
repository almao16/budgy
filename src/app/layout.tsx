import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import Navbar from "../components/Navbar";
import { getServerSession } from "next-auth/next";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Budgy",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Budgy",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5", // Cambia esto al color principal de tu diseño
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// export const metadata: Metadata = {
//   title: "Budgy - Dashboard Financiero",
//   description: "Gestión financiera personal",
// };

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