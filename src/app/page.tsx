"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Calendar, ArrowUpCircle, ArrowDownCircle, Wallet, Target, PieChart as PieIcon } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from "recharts";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [store, setStore] = useState<any>({ meses: {} });
  
  const [config, setConfig] = useState({ 
    fechaUltimoPago: new Date().toISOString().split('T')[0], 
    frecuencia: 'mensual' 
  });
  
  const [loading, setLoading] = useState(true);
  const [mesSeleccionado, setMesSeleccionado] = useState("");

  useEffect(() => {
    if (session) {
      Promise.all([
        fetch('/api/db', { cache: 'no-store' }).then(res => res.json()),
        fetch('/api/profile', { cache: 'no-store' }).then(res => res.json())
      ])
      .then(([dbData, profileData]) => {
        setStore(dbData);
        if (profileData && !profileData.error) {
          setConfig({
            fechaUltimoPago: profileData.fechaUltimoPago || new Date().toISOString().split('T')[0],
            frecuencia: profileData.frecuencia || "mensual"
          });
        }

        const mesesDisponibles = Object.keys(dbData.meses || {});
        if (mesesDisponibles.length > 0) {
          const mesPagoDefecto = profileData?.fechaUltimoPago ? profileData.fechaUltimoPago.substring(0, 7) : new Date().toISOString().substring(0, 7);
          setMesSeleccionado(mesesDisponibles.includes(mesPagoDefecto) ? mesPagoDefecto : mesesDisponibles.sort().reverse()[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium italic animate-pulse">Cargando...</p>
      </div>
    );
  }

  // --- CÁLCULOS GLOBALES ---
  let totalAhorrosGlobal = 0;
  Object.values(store.meses || {}).forEach((mesList: any) => {
    mesList.forEach((mov: any) => {
        if (mov.estado === 'pagado') {
            if (mov.tipo === 'ahorro' || mov.tipo === 'ahorro_ingreso') totalAhorrosGlobal += mov.monto;
            else if (mov.tipo === 'ahorro_retiro') totalAhorrosGlobal -= mov.monto;
        }
    });
  });

  const movimientos = store.meses[mesSeleccionado] || [];
  
  const totales = movimientos.reduce((acc: any, mov: any) => {
    if (mov.tipo === 'ingreso') {
      acc.ingresos += mov.monto;
    } else if (['fijo', 'esencial', 'variable', 'ahorro', 'deuda'].includes(mov.tipo)) {
      acc.egresos += (mov.estado === 'pagado' ? mov.monto : 0);
      acc.pendientes += (mov.estado === 'pendiente' ? mov.monto : 0);
    }
    return acc;
  }, { ingresos: 0, egresos: 0, pendientes: 0 });

  const CATEGORY_COLORS: any = {
    fijo: '#6366f1', esencial: '#10b981', variable: '#3b82f6', deuda: '#f43f5e', ahorro: '#8b5cf6'
  };

  const gastosPorCategoria = movimientos.reduce((acc: any, mov: any) => {
    if (mov.tipo !== 'ingreso' && mov.tipo !== 'ahorro_ingreso' && mov.tipo !== 'ahorro_retiro') {
      acc[mov.tipo] = (acc[mov.tipo] || 0) + mov.monto;
    }
    return acc;
  }, {});

  const dataPie = Object.keys(gastosPorCategoria).map(key => ({
    name: key.toUpperCase(),
    value: gastosPorCategoria[key],
    color: CATEGORY_COLORS[key] || '#cbd5e1'
  })).sort((a: any, b: any) => b.value - a.value);

  const saldoFinal = totales.ingresos - totales.egresos;
  const saldoReal = saldoFinal - totales.pendientes;
  
  const hoy = new Date();
  const mesDelUltimoPago = config.fechaUltimoPago.substring(0, 7);
  const esMesActivo = mesSeleccionado === mesDelUltimoPago;

  const limiteSemanas = config.frecuencia === 'quincenal' ? 2 : 4;
  let semanaActual = limiteSemanas;
  let semanasRestantes = 1;

  const fechaInicioCiclo = new Date(`${config.fechaUltimoPago}T00:00:00`);

  if (esMesActivo) {
    const diasTranscurridos = Math.floor((hoy.getTime() - fechaInicioCiclo.getTime()) / (1000 * 60 * 60 * 24));
    semanaActual = Math.floor(diasTranscurridos / 7) + 1;
    if (semanaActual > limiteSemanas) semanaActual = limiteSemanas;
    if (semanaActual < 1) semanaActual = 1; 
    semanasRestantes = (limiteSemanas - semanaActual) + 1;
  }

  const gastoSemanal = saldoReal > 0 ? saldoReal / semanasRestantes : 0;

  const dataBar = [
    { name: 'Entradas', monto: totales.ingresos, color: '#10b981' },
    { name: 'Salidas', monto: totales.egresos, color: '#f43f5e' },
    { name: 'Pendiente', monto: totales.pendientes, color: '#f59e0b' },
  ];

  const mesesDisponibles = Object.keys(store.meses).sort().reverse();

  const getRangoSemanal = (numSemana: number) => {
    const inicio = new Date(fechaInicioCiclo.getTime() + (numSemana - 1) * 7 * 24 * 60 * 60 * 1000);
    const fin = new Date(inicio.getTime() + 6 * 24 * 60 * 60 * 1000);
    const opciones: any = { day: 'numeric', month: 'short' };
    return `${inicio.toLocaleDateString('es-ES', opciones)} - ${fin.toLocaleDateString('es-ES', opciones)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
      <div className="w-full max-w-none px-4 md:px-10 lg:px-14 py-6 space-y-6 pb-20 md:pb-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">Resumen Financiero</h1>
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <Calendar size={18} className="text-slate-500 ml-2" />
            <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 pr-8 cursor-pointer">
              {mesesDisponibles.length > 0 ? mesesDisponibles.map(m => <option key={m} value={m}>{m}</option>) : <option value="">Sin datos</option>}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <div className="bg-indigo-600 p-4 rounded-2xl shadow-md text-white flex flex-col justify-center border-b-4 border-indigo-800">
            <div className="flex items-center gap-2 mb-1"><Wallet size={14} className="text-indigo-200" /><span className="text-[10px] font-black uppercase tracking-widest opacity-90">Bóveda Ahorros</span></div>
            <span className="text-xl md:text-2xl font-black">${totalAhorrosGlobal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="bg-blue-600 p-4 rounded-2xl shadow-md text-white flex flex-col justify-center border-b-4 border-blue-800">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-90 mb-1 leading-tight">{esMesActivo ? `Semanal Libre (x${semanasRestantes})` : 'Disponible'}</span>
            <span className="text-xl md:text-2xl font-black">${gastoSemanal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-emerald-500 flex flex-col justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Ingresos</span>
            <span className="text-xl font-black text-emerald-600">${totales.ingresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-rose-500 flex flex-col justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Gastado</span>
            <span className="text-xl font-black text-rose-500">${totales.egresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-amber-400 flex flex-col justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Pendiente</span>
            <span className="text-xl font-black text-amber-500">${totales.pendientes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl shadow-md flex flex-col justify-center text-white text-center border-b-4 border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Saldo en Cuenta</span>
            <span className="text-xl font-black text-white">${saldoFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {esMesActivo && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-black text-slate-800 uppercase text-[10px] mb-4 tracking-widest">Control de Ciclo: Semana {semanaActual} de {limiteSemanas}</h3>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${limiteSemanas}, minmax(0, 1fr))` }}>
              {Array.from({ length: limiteSemanas }, (_, i) => i + 1).map((sem) => (
                <div key={sem} className="space-y-2">
                  <div className={`h-3 rounded-full transition-all duration-500 ${sem < semanaActual ? 'bg-emerald-400' : sem === semanaActual ? 'bg-blue-600 shadow-sm animate-pulse' : 'bg-slate-100'}`} />
                  <p className={`text-[9px] font-bold text-center uppercase tracking-tighter ${sem === semanaActual ? 'text-blue-600' : 'text-slate-400'}`}>{getRangoSemanal(sem)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6"><PieIcon size={18} className="text-indigo-500" /><h3 className="font-black text-slate-800 uppercase text-sm">Distribución de Gastos</h3></div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataPie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {dataPie.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />))}
                  </Pie>
                  {/* CORRECCIÓN DE ERROR DE VERCEL AQUÍ */}
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Monto']}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6"><Target size={18} className="text-emerald-500" /><h3 className="font-black text-slate-800 uppercase text-sm">Comparativa de Flujo</h3></div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataBar} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Total']}
                  />
                  <Bar dataKey="monto" radius={[8, 8, 8, 8]} barSize={50}>
                    {dataBar.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <h3 className="font-black text-slate-800 uppercase text-xs mb-4">Últimos Movimientos del Mes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {movimientos.slice(-9).reverse().map((mov: any, idx: number) => {
                const esIngreso = mov.tipo === 'ingreso' || mov.tipo === 'ahorro_ingreso';
                const esAhorro = ['ahorro', 'ahorro_ingreso', 'ahorro_retiro'].includes(mov.tipo);
                return (
                <div key={idx} className={`p-3 rounded-xl flex items-center justify-between border ${esAhorro ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${esIngreso ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>{esIngreso ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}</div>
                    <div className="min-w-0 flex-1"><p className="text-xs font-black text-slate-700 truncate max-w-[140px] leading-tight">{mov.desc}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{mov.tipo.replace('_', ' ')}</p></div>
                  </div>
                  <span className={`text-xs font-black whitespace-nowrap ${esIngreso ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {esIngreso ? '+' : '-'}${mov.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )})}
          </div>
        </div>

      </div>
    </div>
  );
}