"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, LayoutTemplate, LogOut, CalendarDays } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [perfil, setPerfil] = useState<any>(null);

  // Busca esta parte en tu Navbar.tsx y cámbiala:
useEffect(() => {
  if (session) {
    // CAMBIAR: de '/api/perfil' a '/api/profile'
    fetch('/api/profile') 
      .then(res => res.json())
      .then(data => setPerfil(data))
      .catch(err => console.error("Error cargando perfil:", err));
  }
}, [session]);

  if (!session) return null;

  const fechaActual = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  // ¡Adiós Registro! Y rutas en inglés:
  const links = [
    { name: "Dashboard", href: "/", icon: <LayoutDashboard size={18} /> },
    { name: "Presupuestos", href: "/budgets", icon: <CalendarDays size={18} /> },
    { name: "Plantillas", href: "/templates", icon: <LayoutTemplate size={18} /> },
  ];

  return (
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black tracking-tight text-indigo-400">📊 Budgy</h1>
            <span className="hidden md:block text-xs text-slate-400 capitalize">{fechaActual}</span>
          </div>

          <div className="hidden md:flex gap-1">
            {links.map((link) => (
              <Link key={link.name} href={link.href} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === link.href ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}>
                {link.icon}
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Ruta actualizada a /profile */}
            <Link href="/profile" className="flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-2 rounded-xl transition" title="Editar Perfil">
              <div className="w-9 h-9 bg-slate-200 rounded-full overflow-hidden border-2 border-indigo-500 flex items-center justify-center">
                {perfil ? (
                    <img src={perfil.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-slate-500 text-xs font-bold">...</span>
                )}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-bold leading-tight">{perfil?.nombre || session.user?.name}</p>
                <p className="text-[10px] text-indigo-400 font-medium">Mi Cuenta</p>
              </div>
            </Link>

            <div className="w-px h-6 bg-slate-700 mx-1"></div>

            <button onClick={() => signOut()} className="text-slate-400 hover:text-red-400 transition p-2" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}