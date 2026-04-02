"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function PlantillasPage() {
  const { data: session, status } = useSession();
  const [store, setStore] = useState<any>(null);
  const [activaId, setActivaId] = useState<string>('');

  // Estados para el Modal de Nueva Plantilla
  const [showModal, setShowModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');

  const [tipoMov, setTipoMov] = useState<'ingreso' | 'egreso'>('egreso');
  const [desc, setDesc] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('fijo');

  useEffect(() => {
    if (session) {
      fetch('/api/db').then(res => res.json()).then(data => {
        if (!data.plantillas) {
            data.plantillas = [];
            if (data.plantilla && data.plantilla.length > 0) {
                data.plantillas.push({ 
                    id: Date.now().toString(), 
                    nombre: 'Plantilla Principal', 
                    items: data.plantilla 
                });
            }
        }
        setStore(data);
        if (data.plantillas.length > 0) {
            setActivaId(data.plantillas[0].id);
        }
      });
    }
  }, [session]);

  const saveData = async (newStore: any) => {
    setStore(newStore);
    await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore)
    });
  };

  // Función para abrir la ventana bonita
  const abrirModal = () => {
      setNuevoNombre('');
      setShowModal(true);
  };

  // Función para guardar lo que escribiste en la ventana bonita
  const confirmarCrearPlantilla = (e: React.FormEvent) => {
      e.preventDefault();
      if (!nuevoNombre.trim()) return;
      
      const nuevoStore = { ...store };
      const nueva = { id: Date.now().toString(), nombre: nuevoNombre.trim(), items: [] };
      nuevoStore.plantillas.push(nueva);
      
      setActivaId(nueva.id);
      saveData(nuevoStore);
      setShowModal(false); // Cerramos el modal
  };

  const eliminarPlantilla = () => {
      if (confirm("¿Estás seguro de eliminar esta plantilla completa?")) {
          const nuevoStore = { ...store };
          nuevoStore.plantillas = nuevoStore.plantillas.filter((p: any) => p.id !== activaId);
          setActivaId(nuevoStore.plantillas.length > 0 ? nuevoStore.plantillas[0].id : '');
          saveData(nuevoStore);
      }
  };

  const agregarItem = () => {
      const valMonto = parseFloat(monto);
      if (!desc || isNaN(valMonto)) return alert("Completa la descripción y el monto.");

      const nuevoStore = { ...store };
      const plantilla = nuevoStore.plantillas.find((p: any) => p.id === activaId);
      
      plantilla.items.push({
          id: Date.now(),
          desc,
          monto: valMonto,
          tipo: tipoMov === 'ingreso' ? 'ingreso' : categoria
      });

      setDesc(''); setMonto('');
      saveData(nuevoStore);
  };

  const eliminarItem = (itemId: number) => {
      const nuevoStore = { ...store };
      const plantilla = nuevoStore.plantillas.find((p: any) => p.id === activaId);
      plantilla.items = plantilla.items.filter((item: any) => item.id !== itemId);
      saveData(nuevoStore);
  };

  if (status === "loading" || !store) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><p className="text-slate-500 font-bold animate-pulse">Cargando...</p></div>;
  if (!session) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><p className="text-slate-500 font-bold">Acceso denegado.</p></div>;

  const plantillaActiva = store.plantillas.find((p: any) => p.id === activaId);
  const items = plantillaActiva?.items || [];

  let totalIngresos = 0;
  let totalGastos = 0;
  items.forEach((item: any) => {
      if (item.tipo === 'ingreso') totalIngresos += item.monto;
      else totalGastos += item.monto;
  });

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans relative">
      
      {/* --- MODAL BONITO --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Nueva Plantilla</h2>
                <p className="text-sm text-slate-500 mb-6">Asigna un nombre para identificar tu nueva lista de movimientos base.</p>
                
                <form onSubmit={confirmarCrearPlantilla}>
                    <input 
                        type="text" 
                        placeholder="Ej. Mes de Vacaciones..." 
                        value={nuevoNombre}
                        onChange={(e) => setNuevoNombre(e.target.value)}
                        className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none text-slate-900 bg-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition mb-6"
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm rounded-lg transition"
                        >
                            Crear Plantilla
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
      {/* -------------------- */}

      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
            <h1 className="text-2xl font-bold text-slate-800">✨ Gestor de Plantillas</h1>
            <div className="flex items-center gap-3 w-full md:w-auto">
              {store.plantillas.length > 0 && (
                  <select 
                    value={activaId} 
                    onChange={(e) => setActivaId(e.target.value)} 
                    className="w-full md:w-auto p-2 rounded-lg border bg-slate-50 font-bold text-indigo-600 shadow-sm outline-none cursor-pointer"
                  >
                     {store.plantillas.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
              )}
              <button onClick={abrirModal} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-900 transition whitespace-nowrap">
                  + Nueva
              </button>
            </div>
        </div>

        {store.plantillas.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-dashed border-slate-300">
                <p className="text-slate-500 text-lg">No tienes ninguna plantilla configurada.</p>
                <p className="text-slate-400 text-sm mt-2">Haz clic en <b>+ Nueva</b> para crear tu primera lista base.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-indigo-500">
                  <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase">Agregar a Plantilla</h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2 mb-4">
                        <button onClick={() => setTipoMov('ingreso')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${tipoMov === 'ingreso' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>Ingreso</button>
                        <button onClick={() => setTipoMov('egreso')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${tipoMov === 'egreso' ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>Gasto</button>
                    </div>

                    <input type="text" placeholder="Descripción..." value={desc} onChange={e => setDesc(e.target.value)} className="w-full border p-2 rounded-lg text-sm outline-none text-slate-900 bg-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    <input type="number" placeholder="Monto base $" value={monto} onChange={e => setMonto(e.target.value)} className="w-full border p-2 rounded-lg text-sm outline-none text-slate-900 bg-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    
                    {tipoMov === 'egreso' && (
                        <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full border p-2 rounded-lg text-sm text-slate-900 bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                            <option value="fijo">Fijo Mensual</option>
                            <option value="esencial">Esencial Irregular</option>
                            <option value="variable">Deseo / Ocio</option>
                            <option value="ahorro">Ahorro</option>
                            <option value="deuda">Pago de Deuda</option>
                        </select>
                    )}

                    <button onClick={agregarItem} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-sm mt-2 transition">
                        Añadir a {plantillaActiva?.nombre}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-xl shadow-sm text-white space-y-2">
                    <h3 className="text-xs uppercase font-bold text-slate-400 mb-4">Proyección Base</h3>
                    <div className="flex justify-between text-sm"><span className="text-emerald-400">Ingresos:</span> <span className="font-bold">${totalIngresos.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-amber-400">Gastos:</span> <span className="font-bold">${totalGastos.toFixed(2)}</span></div>
                    <div className="border-t border-slate-600 my-2 pt-2 flex justify-between"><span className="font-bold">Saldo Proyectado:</span> <span className="font-black">${(totalIngresos - totalGastos).toFixed(2)}</span></div>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                      <h2 className="font-bold text-slate-700">Contenido: {plantillaActiva?.nombre}</h2>
                      <button onClick={eliminarPlantilla} className="text-xs text-red-500 hover:underline font-bold cursor-pointer">🗑️ Borrar Plantilla</button>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="p-3 text-slate-400 font-medium">Tipo</th>
                        <th className="p-3 text-slate-400 font-medium">Descripción</th>
                        <th className="p-3 text-right text-slate-400 font-medium">Monto Base</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any, index: number) => (
                        <tr key={item.id || index} className="border-b hover:bg-slate-50 transition">
                          <td className="p-3">
                              {item.tipo === 'ingreso' ? 
                                 <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold uppercase">Ingreso</span> : 
                                 <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold uppercase">{item.tipo}</span>
                              }
                          </td>
                          <td className="p-3 text-slate-900 font-medium">{item.desc}</td>
                          <td className={`p-3 text-right font-bold ${item.tipo === 'ingreso' ? 'text-emerald-600' : 'text-slate-900'}`}>
                            ${item.monto.toFixed(2)}
                          </td>
                          <td className="p-3 text-center cursor-pointer text-slate-300 hover:text-red-500" onClick={() => eliminarItem(item.id)}>🗑️</td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-medium">Esta plantilla está vacía. Agrega tus movimientos base.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
        )}
      </div>
    </div>
  );
}