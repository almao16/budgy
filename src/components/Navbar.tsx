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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (session) {
      fetch('/api/profile')
        .then(res => {
            if(!res.ok) throw new Error("No encontrado");
            return res.json();
        })
        .then(data => setPerfil(data))
        .catch(err => console.log("Perfil no listo aún"));
    }
  }, [session]);

  if (!session) return null;

  const fechaActual = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex items-center gap-6">
            {/* AQUÍ ESTÁ EL CAMBIO: El logo ahora es un Link clickeable */}
            <Link href="/" className="transition-transform hover:scale-105 active:scale-95" title="Ir al Dashboard">
              <h1 className="text-2xl font-black tracking-tight text-indigo-400">📊 Budgy</h1>
            </Link>
            {isMounted && <span className="hidden md:block text-xs text-slate-400 capitalize">{fechaActual}</span>}
          </div>

          <div className="hidden md:flex gap-1">
            <Link href="/" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${pathname === "/" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <Link href="/budgets" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${pathname === "/budgets" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              <CalendarDays size={18} /> Presupuestos
            </Link>
            <Link href="/templates" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${pathname === "/templates" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              <LayoutTemplate size={18} /> Plantillas
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/profile" className="flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-2 rounded-xl transition" title="Editar Perfil">
              <div className="w-9 h-9 bg-slate-200 rounded-full overflow-hidden border-2 border-indigo-500 flex items-center justify-center">
                <img 
                  src={perfil?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${perfil?.nombre || session.user?.name || 'BudgyUser'}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
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