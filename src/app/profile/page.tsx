"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

// Lista balanceada con muchas más opciones femeninas
const AVATARES_DISPONIBLES = [
    'Mia', 'Sophia', 'Liliana', 'Eliana', 'Aneka', 'Chloe', 
    'Zoe', 'Aria', 'Luna', 'Felix', 'Jasper', 'Leo'
];

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const [nombre, setNombre] = useState('');
  const [avatarActual, setAvatarActual] = useState('');
  const [guardando, setGuardando] = useState(false);
  
  // Estado para el Modal bonito de éxito
  const [mostrarExito, setMostrarExito] = useState(false);

  useEffect(() => {
    if (session) {
      fetch('/api/perfil').then(res => res.json()).then(data => {
        setNombre(data.nombre);
        setAvatarActual(data.avatar);
      });
    }
  }, [session]);

  const seleccionarAvatar = (seed: string) => {
      setAvatarActual(`https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=e2e8f0`);
  };

  const guardarPerfil = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!nombre.trim()) return;
      
      setGuardando(true);
      await fetch('/api/perfil', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, avatar: avatarActual })
      });
      setGuardando(false);
      
      // En lugar del alert, mostramos nuestro modal moderno
      setMostrarExito(true);
  };

  const cerrarYRecargar = () => {
      setMostrarExito(false);
      window.location.reload(); // Recargamos automáticamente para que el Navbar se actualice
  };

  if (status === "loading" || !avatarActual) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><p className="text-slate-500 font-bold animate-pulse">Cargando...</p></div>;
  if (!session) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><p className="text-slate-500 font-bold">Acceso denegado.</p></div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans relative">
      
      {/* --- MODAL DE ÉXITO BONITO --- */}
      {mostrarExito && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200 border-t-4 border-emerald-500">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    ✔️
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">¡Perfil Actualizado!</h2>
                <p className="text-sm text-slate-500 mb-6">Tus datos y tu nuevo avatar se han guardado correctamente.</p>
                <button 
                    onClick={cerrarYRecargar}
                    className="w-full px-4 py-3 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-md rounded-xl transition"
                >
                    Aceptar y Continuar
                </button>
            </div>
        </div>
      )}
      {/* ----------------------------- */}

      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800">👤 Mi Perfil</h1>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <form onSubmit={guardarPerfil} className="space-y-8">
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Nombre a mostrar</label>
                    <input 
                        type="text" 
                        value={nombre} 
                        onChange={(e) => setNombre(e.target.value)}
                        required
                        className="w-full max-w-md border border-slate-300 p-3 rounded-xl text-sm outline-none text-slate-900 bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition" 
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-4 uppercase">Elige tu Avatar</label>
                    
                    <div className="flex flex-col md:flex-row items-start gap-8">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500 shadow-lg bg-slate-200">
                                <img src={avatarActual} alt="Avatar Actual" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Avatar Actual</span>
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 flex-1">
                            {AVATARES_DISPONIBLES.map(seed => {
                                const url = `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=e2e8f0`;
                                const isSelected = avatarActual === url;
                                return (
                                    <div 
                                        key={seed} 
                                        onClick={() => seleccionarAvatar(seed)}
                                        className={`cursor-pointer rounded-full overflow-hidden w-16 h-16 transition-all duration-200 ${isSelected ? 'ring-4 ring-indigo-500 scale-110 shadow-md' : 'hover:scale-105 hover:ring-2 hover:ring-slate-300 opacity-70 hover:opacity-100 bg-slate-200'}`}
                                    >
                                        <img src={url} alt={seed} className="w-full h-full object-cover" />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <button type="submit" disabled={guardando} className="bg-slate-800 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-slate-900 transition disabled:opacity-50">
                        {guardando ? "Guardando..." : "💾 Guardar Cambios"}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}