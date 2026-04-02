"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function RegistroPage() {
  const { data: session, status } = useSession();
  
  const [store, setStore] = useState<any>({ meses: {}, plantillas: [] });
  const [mesActual, setMesActual] = useState(new Date().toISOString().slice(0, 7));
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState('');
  
  // Estados para Ingreso
  const [inDesc, setInDesc] = useState('');
  const [inMonto, setInMonto] = useState('');
  
  // Estados para Gasto
  const [exDesc, setExDesc] = useState('');
  const [exMonto, setExMonto] = useState('');
  const [exTipo, setExTipo] = useState('fijo');
  const [esPendiente, setEsPendiente] = useState(false); // ¡Ahora es FALSO por defecto (Pagado)!

useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesEditar = params.get('month'); // Cambiado a 'month'
    if (mesEditar) setMesActual(mesEditar);
  }, []);

  useEffect(() => {
    if (session) {
      fetch('/api/db').then(res => res.json()).then(data => {
        if (data.meses) setStore(data);
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

  // Función exclusiva para INGRESOS
  const addIngreso = () => {
    const montoVal = parseFloat(inMonto);
    if (!inDesc || isNaN(montoVal)) return alert("Error: Por favor ingresa una descripción y un monto válido para el ingreso.");

    const nuevoStore = { ...store };
    if (!nuevoStore.meses[mesActual]) nuevoStore.meses[mesActual] = [];
    
    nuevoStore.meses[mesActual].push({
      id: Date.now(),
      desc: inDesc,
      monto: montoVal,
      tipo: 'ingreso',
      estado: 'pagado'
    });

    setInDesc(''); setInMonto('');
    saveData(nuevoStore);
  };

  // Función exclusiva para GASTOS
  const addEgreso = () => {
    const montoVal = parseFloat(exMonto);
    if (!exDesc || isNaN(montoVal)) return alert("Error: Por favor ingresa una descripción y un monto válido para el gasto.");

    const nuevoStore = { ...store };
    if (!nuevoStore.meses[mesActual]) nuevoStore.meses[mesActual] = [];
    
    nuevoStore.meses[mesActual].push({
      id: Date.now(),
      desc: exDesc,
      monto: montoVal,
      tipo: exTipo,
      estado: esPendiente ? 'pendiente' : 'pagado'
    });

    setExDesc(''); setExMonto(''); setEsPendiente(false); // Resetea a false
    saveData(nuevoStore);
  };

  // Cargar una plantilla opcional
  const cargarPlantilla = () => {
      if (!plantillaSeleccionada) return alert("Selecciona una plantilla de la lista primero.");
      const plantilla = store.plantillas?.find((p: any) => p.id === plantillaSeleccionada);
      if (!plantilla || !plantilla.items) return;

      const confirmacion = confirm(`¿Estás seguro de cargar los movimientos de "${plantilla.nombre}" en ${mesActual}?`);
      if (!confirmacion) return;

      const nuevoStore = { ...store };
      if (!nuevoStore.meses[mesActual]) nuevoStore.meses[mesActual] = [];
      
      plantilla.items.forEach((item: any) => {
          nuevoStore.meses[mesActual].push({
              ...item,
              id: Date.now() + Math.random(), // Generar IDs únicos
              estado: item.tipo === 'ingreso' ? 'pagado' : 'pendiente' // Los gastos de plantilla entran pendientes por defecto
          });
      });
      saveData(nuevoStore);
      setPlantillaSeleccionada('');
      alert("Exitoso");
  };

  const toggleEstado = (id: number) => {
    const nuevoStore = { ...store };
    const item = nuevoStore.meses[mesActual].find((m: any) => m.id === id);
    if (item && item.tipo !== 'ingreso') {
      item.estado = item.estado === 'pagado' ? 'pendiente' : 'pagado';
      saveData(nuevoStore);
    }
  };

  const deleteItem = (id: number) => {
    if (confirm("¿Eliminar registro?")) {
      const nuevoStore = { ...store };
      nuevoStore.meses[mesActual] = nuevoStore.meses[mesActual].filter((m: any) => m.id !== id);
      saveData(nuevoStore);
    }
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-slate-100"><p className="text-slate-500 font-bold animate-pulse">Cargando...</p></div>;
  if (!session) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><p className="text-slate-500 font-bold">Acceso denegado. Por favor inicia sesión.</p></div>;

  const list = store.meses[mesActual] || [];
  
  let sumIn = 0; let egresos = 0; let pendientes = 0; let comprometido = 0;
  list.forEach((m: any) => {
    if (m.tipo === 'ingreso') sumIn += m.monto;
    else {
        if (m.estado === 'pagado') egresos += m.monto;
        if (m.estado === 'pendiente') pendientes += m.monto;
        if (['fijo', 'ahorro', 'deuda'].includes(m.tipo)) comprometido += m.monto;
    }
  });

  const balanceNeto = sumIn - egresos - pendientes;
  const semanal = (sumIn - comprometido) > 0 ? ((sumIn - comprometido) / 4) : 0;

  const getOpcionesDeMeses = () => {
      const opciones = new Set<string>();
      Object.keys(store.meses).forEach(m => opciones.add(m)); 
      const hoy = new Date();
      for(let i = -3; i <= 12; i++) {
         const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
         opciones.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
      return Array.from(opciones).sort().reverse();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Botón para regresar a la lista de presupuestos */}
        <Link href="/budgets" className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition w-fit">
            <span>←</span> Volver a Presupuestos
        </Link>

        {/* Cabecera con Mes y Plantillas Opcionales */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
            <h1 className="text-2xl font-bold text-slate-800">Registro de Movimientos</h1>
            
            <div className="flex flex-wrap justify-center items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-slate-500 hidden md:block">Mes:</label>
                <select 
                  value={mesActual} 
                  onChange={(e) => setMesActual(e.target.value)} 
                  className="p-2 rounded-lg border bg-slate-50 font-bold text-indigo-600 shadow-sm outline-none cursor-pointer"
                >
                   {getOpcionesDeMeses().map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Seccion Opcional de Plantillas */}
              {store.plantillas && store.plantillas.length > 0 && (
                  <div className="flex items-center gap-2 md:border-l md:border-slate-200 md:pl-4">
                      <select 
                          value={plantillaSeleccionada} 
                          onChange={(e) => setPlantillaSeleccionada(e.target.value)}
                          className="p-2 rounded-lg border bg-white text-slate-900 text-sm outline-none cursor-pointer"
                      >
                          <option value="">Cargar plantilla...</option>
                          {store.plantillas.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                      <button onClick={cargarPlantilla} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 transition">
                          Aplicar
                      </button>
                  </div>
              )}
            </div>
        </div>

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 bg-blue-600 p-6 rounded-xl shadow-md text-center text-white flex flex-col justify-center">
              <p className="text-[10px] uppercase font-black tracking-widest opacity-80" title="Ingresos menos gastos fijos/ahorros, dividido entre 4 semanas">Gasto Semanal Libre</p>
              <p className="text-4xl md:text-5xl font-black my-2">${semanal.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm text-center flex flex-col justify-center border-t-4 border-emerald-500">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Ingresos</p>
                <p className="text-2xl font-bold text-emerald-600">${sumIn.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm text-center flex flex-col justify-center border-t-4 border-amber-400">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Pendiente</p>
                <p className="text-2xl font-bold text-amber-500">${pendientes.toFixed(2)}</p>
            </div>
             <div className="bg-slate-800 p-4 rounded-xl shadow-sm text-center flex flex-col justify-center">
                <p className="text-[10px] text-slate-300 uppercase font-bold">Saldo Final</p>
                <p className="text-2xl font-bold text-white">${balanceNeto.toFixed(2)}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-4 space-y-6">
            {/* Formulario Ingreso */}
            <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-emerald-500">
              <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase">➕ Ingreso</h3>
              <input type="text" placeholder="Sueldo..." value={inDesc} onChange={e => setInDesc(e.target.value)} className="w-full border p-2 mb-2 rounded-lg text-sm outline-none text-slate-900 bg-white placeholder-slate-400" />
              <input type="number" placeholder="Monto $" value={inMonto} onChange={e => setInMonto(e.target.value)} className="w-full border p-2 mb-2 rounded-lg text-sm outline-none text-slate-900 bg-white placeholder-slate-400" />
              <button onClick={addIngreso} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700">Añadir Ingreso</button>
            </div>

            {/* Formulario Gasto */}
            <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-slate-800">
              <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase">➖ Gasto / Planificación</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Descripción..." value={exDesc} onChange={e => setExDesc(e.target.value)} className="w-full border p-2 rounded-lg text-sm outline-none text-slate-900 bg-white placeholder-slate-400" />
                <input type="number" placeholder="Monto $" value={exMonto} onChange={e => setExMonto(e.target.value)} className="w-full border p-2 rounded-lg text-sm outline-none text-slate-900 bg-white placeholder-slate-400" />
                <select value={exTipo} onChange={e => setExTipo(e.target.value)} className="w-full border p-2 rounded-lg text-sm text-slate-900 bg-white outline-none">
                  <option value="fijo">Fijo Mensual</option>
                  <option value="esencial">Esencial Irregular</option>
                  <option value="variable">Deseo / Ocio</option>
                  <option value="ahorro">Ahorro</option>
                  <option value="deuda">Pago de Deuda</option>
                </select>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <input type="checkbox" checked={esPendiente} onChange={e => setEsPendiente(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                  <label className="text-xs font-medium text-slate-600 cursor-pointer" onClick={() => setEsPendiente(!esPendiente)}>
                    Aún no lo pago (Opcional)
                  </label>
                </div>
                <button onClick={addEgreso} className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-900">Registrar Gasto</button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-3 text-slate-400 font-medium">Estado</th>
                    <th className="p-3 text-slate-400 font-medium">Descripción</th>
                    <th className="p-3 text-right text-slate-400 font-medium">Monto</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.slice().reverse().map((m: any, index: number) => (
                    <tr key={m.id || index} className="border-b hover:bg-slate-50 transition">
                      <td className="p-3 cursor-pointer" onClick={() => toggleEstado(m.id)}>
                        {m.estado === 'pagado' ? <span className="text-emerald-500" title="Pagado - Click para deshacer">✔️</span> : <span className="text-amber-500" title="Pendiente - Click para pagar">🕒</span>}
                      </td>
                      <td className={`p-3 ${m.estado === 'pagado' && m.tipo !== 'ingreso' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {m.desc} <span className="text-[10px] bg-slate-100 text-slate-400 px-1 rounded ml-2 uppercase">{m.tipo}</span>
                      </td>
                      <td className={`p-3 text-right font-bold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        ${m.monto.toFixed(2)}
                      </td>
                      <td className="p-3 text-center cursor-pointer text-slate-300 hover:text-red-500" onClick={() => deleteItem(m.id)}>🗑️</td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-medium">No hay movimientos registrados para {mesActual}. ¡Empieza a planificar!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}