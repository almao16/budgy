"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Save, User, Sparkles, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [nombre, setNombre] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Definimos los 6 hermosos avatares de mujeres (Notionists)
  // Incluimos a 'Mia', 'Luna', 'Bella', 'Ivy', 'Jasmine', 'Ruby'
  const avataresMujeres = [
    "https://api.dicebear.com/7.x/notionists/svg?seed=Mia&backgroundColor=e2e8f0",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Luna&backgroundColor=fbcfe8",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Bella&backgroundColor=bbf7d0",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Ivy&backgroundColor=fef08a",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Jasmine&backgroundColor=fed7aa",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Ruby&backgroundColor=e9d5ff",
  ];

  // Función para determinar cuál es el avatar que se debe mostrar en la previsualización
  const getAvatarAMostrar = () => {
    if (avatar) return avatar; // Si ha seleccionado uno, ese.
    return avataresMujeres[0]; // Si no, el de 'Mia' por defecto.
  };

  useEffect(() => {
    if (session) {
      // Ruta API corregida
      fetch('/api/profile')
        .then(res => {
          if (!res.ok) throw new Error("No encontrado");
          return res.json();
        })
        .then(data => {
          setNombre(data.nombre || "");
          setAvatar(data.avatar || "");
          setLoading(false);
        })
        .catch(err => {
          console.error("Error cargando perfil", err);
          setLoading(false);
        });
    }
  }, [session]);

  const guardarPerfil = async () => {
    setSaving(true);
    setMensaje("");
    
    // Nos aseguramos de tener un avatar antes de guardar (defecto: Mia)
    const finalAvatar = avatar || avataresMujeres[0];

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, avatar: finalAvatar.trim() })
    });

    if (res.ok) {
      setMensaje("Exitoso"); // Emerald-500 se aplicará en la UI
      setTimeout(() => window.location.reload(), 1500); // Recarga para actualizar navbar
    } else {
      setMensaje("Hubo un error"); // Red-500 se aplicará en la UI
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-bold">Cargando perfil...</p>
      </div>
    </div>
  );

  const avatarDisplay = getAvatarAMostrar();

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Título de la Cabecera (Mi Cuenta con icono) */}
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
          <User className="text-indigo-600" /> Mi Cuenta
        </h1>

        {/* Contenedor Principal del Formulario - Fixed rendering issues by structure */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Estructura dividida en dos columnas para MD, una columna para móvil */}
          <div className="grid grid-cols-1 md:grid-cols-3">
            
            {/* Sección Izquierda/Arriba: Datos Personales y Previsualización */}
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-100 col-span-1">
              <h2 className="text-lg font-bold text-slate-700 mb-2 flex items-center gap-2">
                <User size={18} className="text-slate-400" /> Datos Personales
              </h2>
              <p className="text-sm text-slate-500 mb-6 tracking-tight">Configura tu nombre real.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tu Nombre Completo</label>
                  <input 
                    type="text" 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    placeholder="Ej. Betzabeth Almao"
                  />
                </div>

                {/* Previsualización Grande Corregida: Strict constraints para evitar cajón gigante */}
                <div className="flex justify-center pt-4">
                  <div className="w-24 h-24 bg-slate-100 rounded-full overflow-hidden border-4 border-indigo-500 shadow-md flex items-center justify-center relative">
                    <img 
                      src={avatarDisplay} 
                      alt="Avatar Seleccionado" 
                      width={96} height={96} // Explicit HTML attributes for SVGs stability
                      className="w-full h-full object-cover rounded-full" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección Derecha/Abajo: Cuadrícula de Selección de Avatares */}
            <div className="p-6 md:p-8 col-span-1 md:col-span-2 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2 tracking-tight">
                <Sparkles size={20} className="text-indigo-500" /> Selecciona tu Avatar
              </h2>
              <p className="text-sm text-slate-500 mb-6 tracking-tight">Elige el estilo de mujer que más te guste:</p>

              {/* Cuadrícula de Selección Corregida - ensuring tight layout */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {avataresMujeres.map((urlAvatar, idx) => {
                  const isSelected = avatarDisplay === urlAvatar;
                  return (
                    <button 
                      key={idx}
                      onClick={() => setAvatar(urlAvatar)}
                      className={`relative aspect-square rounded-full overflow-hidden border-4 transition-all hover:scale-105 hover:shadow-md ${
                        isSelected ? 'border-indigo-500 shadow-inner scale-105' : 'border-slate-100 hover:border-indigo-200'
                      }`}
                      title={`Opción de avatar ${idx + 1}`}
                    >
                      <img 
                        src={urlAvatar} 
                        alt={`Opción de avatar ${idx + 1}`} 
                        width={64} height={64} // explicit SVG dimensions
                        className="w-full h-full object-cover" 
                      />
                      {/* Icono de Check si está seleccionado */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                          <CheckCircle className="text-white drop-shadow-md" size={24} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Botón Guardar - Fixed message coloring and alignment */}
          <div className="p-6 bg-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            {/* Mensaje de Éxito/Error Corregido */}
            <span className={`text-sm font-bold tracking-tight ${mensaje.includes('Hubo') ? 'text-red-500' : 'text-emerald-500'}`}>
              {mensaje}
            </span>
            <button 
              onClick={guardarPerfil}
              disabled={saving}
              className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 min-w-[200px]"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}