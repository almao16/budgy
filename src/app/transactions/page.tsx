"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function RegistroPage() {
  const { data: session, status } = useSession();
  
  const [store, setStore] = useState<any>({ meses: {}, plantillas: [] });
  const [mesActual, setMesActual] = useState(new Date().toISOString().slice(0, 7));
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState('');
  
  const [inDesc, setInDesc] = useState('');
  const [inMonto, setInMonto] = useState('');
  const [inTipo, setInTipo] = useState('ingreso'); 
  
  const [exDesc, setExDesc] = useState('');
  const [exMonto, setExMonto] = useState('');
  const [exTipo, setExTipo] = useState('fijo');
  const [esPendiente, setEsPendiente] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [plantillaName, setPlantillaName] = useState("");

  const hoyString = new Date().toISOString().slice(0, 7);
  const esMesFuturo = mesActual > hoyString;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesEditar = params.get('month'); 
    if (mesEditar) setMesActual(mesEditar);
  }, []);

  useEffect(() => {
    if (session) {
      fetch('/api/db').then(res => res.json()).then(data => {
        if (data.meses) setStore(data);
      });
    }
  }, [session]);

  useEffect(() => {
    setEsPendiente(esMesFuturo);
  }, [mesActual, esMesFuturo]);

  const saveData = async (newStore: any) => {
    setStore(newStore);
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStore)
    });
  };

  const addIngreso = () => {
    const montoVal = parseFloat(inMonto);
    if (!inDesc || isNaN(montoVal)) return alert("Error: Por favor ingresa una descripción y un monto válido.");

    const nuevoStore = { ...store };
    if (!nuevoStore.meses[mesActual]) nuevoStore.meses[mesActual] = [];
    
    nuevoStore.meses[mesActual].push({
      id: Date.now(),
      desc: inDesc,
      monto: montoVal,
      tipo: inTipo, // Puede ser 'ingreso' (presupuesto) o 'ahorro_ingreso' (directo a bóveda)
      estado: esMesFuturo && inTipo !== 'ahorro_ingreso' ? 'pendiente' : 'pagado'
    });

    setInDesc(''); setInMonto(''); setInTipo('ingreso');
    saveData(nuevoStore);
  };

  const addEgreso = () => {
    const montoVal = parseFloat(exMonto);
    if (!exDesc || isNaN(montoVal)) return alert("Error: Por favor ingresa una descripción y un monto válido.");

    const nuevoStore = { ...store };
    if (!nuevoStore.meses[mesActual]) nuevoStore.meses[mesActual] = [];
    
    nuevoStore.meses[mesActual].push({
      id: Date.now(),
      desc: exDesc,
      monto: montoVal,
      tipo: exTipo,
      // Si es un retiro de ahorro, siempre es pagado instantáneamente
      estado: esPendiente && exTipo !== 'ahorro_retiro' ? 'pendiente' : 'pagado' 
    });

    setExDesc(''); 
    setExMonto(''); 
    setEsPendiente(esMesFuturo);
    saveData(nuevoStore);
  };

  const intentarCargarPlantilla = () => {
      if (!plantillaSeleccionada) return alert("Selecciona una plantilla de la lista primero.");
      const plantilla = store.plantillas?.find((p: any) => p.id === plantillaSeleccionada);
      if (!plantilla || !plantilla.items) return;

      setPlantillaName(plantilla.nombre);
      setShowModal(true); 
  };

  const confirmarCargarPlantilla = () => {
      const plantilla = store.plantillas?.find((p: any) => p.id === plantillaSeleccionada);
      if (!plantilla || !plantilla.items) return;

      const nuevoStore = { ...store };
      if (!nuevoStore.meses[mesActual]) nuevoStore.meses[mesActual] = [];
      
      plantilla.items.forEach((item: any) => {
          nuevoStore.meses[mesActual].push({
              ...item,
              id: Date.now() + Math.random(),
              estado: 'pendiente' 
          });
      });
      saveData(nuevoStore);
      setPlantillaSeleccionada('');
      setShowModal(false); 
  };

  const toggleEstado = (id: number) => {
    const nuevoStore = { ...store };
    const item = nuevoStore.meses[mesActual].find((m: any) => m.id === id);
    if (item) {
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
  
  let sumIn = 0; let egresos = 0; let pendientes = 0;
  list.forEach((m: any) => {
    // Solo sumamos al presupuesto mensual lo que sea 'ingreso' normal
    if (m.tipo === 'ingreso') {
        sumIn += m.monto;
    } 
    // Las operaciones de la Bóveda de ahorros no tocan el balance del mes
    else if (['fijo', 'esencial', 'variable', 'ahorro', 'deuda'].includes(m.tipo)) {
        if (m.estado === 'pagado') egresos += m.monto;
        if (m.estado === 'pendiente') pendientes += m.monto;
    }
  });

  const balanceNeto = sumIn - egresos - pendientes;
  const semanal = balanceNeto > 0 ? (balanceNeto / 4) : 0;

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
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans relative">
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 mb-4 mx-auto">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-2">Cargar Plantilla</h3>
            <p className="text-slate-500 text-center mb-6 text-sm font-medium">
              ¿Estás seguro de cargar los movimientos de <span className="font-bold text-indigo-600">"{plantillaName}"</span> en el mes de <span className="font-bold text-slate-700">{mesActual}</span>?
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-center gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCargarPlantilla}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition"
              >
                Sí, cargar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        
        <Link href="/budgets" className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition w-fit">
            <span>←</span> Volver a Presupuestos
        </Link>

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
                      <button onClick={intentarCargarPlantilla} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 transition">
                          Aplicar
                      </button>
                  </div>
              )}
            </div>
        </div>

        {esMesFuturo && (
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl shadow-sm text-indigo-700 text-sm font-bold text-center flex justify-center items-center gap-2">
            <span>📝 Estás en Modo Planificación. Tus registros se guardarán como "Pendientes" por defecto.</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 bg-blue-600 p-6 rounded-xl shadow-md text-center text-white flex flex-col justify-center">
              <p className="text-[10px] uppercase font-black tracking-widest opacity-80" title="Saldo final disponible dividido entre 4 semanas">Gasto Semanal Libre</p>
              <p className="text-4xl md:text-5xl font-black my-2">${semanal.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm text-center flex flex-col justify-center border-t-4 border-emerald-500">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Ingresos del Mes</p>
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
            <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-emerald-500">
              <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase">➕ Dinero Entrante</h3>
              <input type="text" placeholder="Descripción..." value={inDesc} onChange={e => setInDesc(e.target.value)} className="w-full border p-2 mb-2 rounded-lg text-sm outline-none text-slate-900 bg-white placeholder-slate-400" />
              <input type="number" placeholder="Monto $" value={inMonto} onChange={e => setInMonto(e.target.value)} className="w-full border p-2 mb-2 rounded-lg text-sm outline-none text-slate-900 bg-white placeholder-slate-400" />
              
              {/* SELECTOR ACTUALIZADO PARA AHORROS */}
              <select value={inTipo} onChange={e => setInTipo(e.target.value)} className="w-full border p-2 mb-4 rounded-lg text-sm text-slate-900 bg-slate-50 outline-none font-medium">
                <option value="ingreso">Sueldo / Ingreso al Presupuesto</option>
                <option value="ahorro_ingreso">Cobro de Bolso (Va directo a Ahorros)</option>
              </select>
              
              <button onClick={addIngreso} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700">Añadir Ingreso</button>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-slate-800">
              <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase">➖ Gasto / Planificación</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Descripción..." value={exDesc} onChange={e => setExDesc(e.target.value)} className="w-full border p-2 rounded-lg text-sm outline-none text-slate-900 bg-white placeholder-slate-400" />
                <input type="number" placeholder="Monto $" value={exMonto} onChange={e => setExMonto(e.target.value)} className="w-full border p-2 rounded-lg text-sm outline-none text-slate-900 bg-white placeholder-slate-400" />
                
                {/* SELECTOR ACTUALIZADO CON RETIRO DE AHORROS */}
                <select value={exTipo} onChange={e => setExTipo(e.target.value)} className="w-full border p-2 rounded-lg text-sm text-slate-900 bg-slate-50 outline-none font-medium">
                  <optgroup label="Gastos del Mes">
                    <option value="fijo">Fijo Mensual</option>
                    <option value="esencial">Esencial Irregular</option>
                    <option value="variable">Deseo / Ocio</option>
                    <option value="deuda">Pago de Deuda</option>
                  </optgroup>
                  <optgroup label="Movimientos de Bóveda">
                    <option value="ahorro">Guardar en Ahorros (Resta del mes)</option>
                    <option value="ahorro_retiro">Retirar de Ahorros (Para usarlo luego)</option>
                  </optgroup>
                </select>

                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <input type="checkbox" checked={esPendiente} onChange={e => setEsPendiente(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                  <label className="text-xs font-medium text-slate-600 cursor-pointer" onClick={() => setEsPendiente(!esPendiente)}>
                    Aún no lo pago (Opcional)
                  </label>
                </div>
                <button onClick={addEgreso} className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-900">Registrar</button>
              </div>
            </div>
          </div>

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
                  {list.slice().reverse().map((m: any, index: number) => {
                    const esIngresoPositivo = m.tipo === 'ingreso' || m.tipo === 'ahorro_ingreso';
                    const esBolsoOAhorro = m.tipo === 'ahorro_ingreso' || m.tipo === 'ahorro_retiro' || m.tipo === 'ahorro';
                    
                    return (
                    <tr key={m.id || index} className={`border-b transition ${esBolsoOAhorro ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                      <td className="p-3 cursor-pointer" onClick={() => toggleEstado(m.id)}>
                        {m.estado === 'pagado' ? <span className="text-emerald-500" title="Pagado - Click para deshacer">✔️</span> : <span className="text-amber-500" title="Pendiente - Click para pagar">🕒</span>}
                      </td>
                      <td className={`p-3 ${m.estado === 'pagado' && !esIngresoPositivo ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {m.desc} 
                        <span className={`text-[9px] px-2 py-0.5 rounded ml-2 uppercase font-bold ${
                          esBolsoOAhorro ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {m.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-bold ${esIngresoPositivo ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {esIngresoPositivo ? '+' : '-'}${m.monto.toFixed(2)}
                      </td>
                      <td className="p-3 text-center cursor-pointer text-slate-300 hover:text-red-500" onClick={() => deleteItem(m.id)}>🗑️</td>
                    </tr>
                  )})}
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