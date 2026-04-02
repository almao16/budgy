"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar, 
  ArrowUpCircle, 
  ArrowDownCircle,
  AlertCircle
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [store, setStore] = useState<any>({ meses: {} });
  const [loading, setLoading] = useState(true);
  const [mesSeleccionado, setMesSeleccionado] = useState("");

  // 1. Cargar datos desde la API
  useEffect(() => {
    if (session) {
      fetch('/api/db')
        .then(res => res.json())
        .then(data => {
          setStore(data);
          const mesesDisponibles = Object.keys(data.meses || {});
          if (mesesDisponibles.length > 0) {
            // Seleccionar el mes actual o el más reciente
            const hoy = new Date().toISOString().substring(0, 7);
            setMesSeleccionado(mesesDisponibles.includes(hoy) ? hoy : mesesDisponibles.sort().reverse()[0]);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium italic">Cargando tu resumen financiero...</p>
        </div>
      </div>
    );
  }

  // 2. Lógica de Cálculos
  const movimientos = store.meses[mesSeleccionado] || [];
  
  const totales = movimientos.reduce((acc: any, mov: any) => {
    if (mov.tipo === 'ingreso') {
      acc.ingresos += mov.monto;
    } else {
      acc.egresos += (mov.estado === 'pagado' ? mov.monto : 0);
      acc.pendientes += (mov.estado === 'pendiente' ? mov.monto : 0);
    }
    return acc;
  }, { ingresos: 0, egresos: 0, pendientes: 0 });

  const saldoFinal = totales.ingresos - totales.egresos;
  const saldoReal = saldoFinal - totales.pendientes;
  
  // Cálculo de gasto semanal libre (basado en lo que queda del mes)
  const hoy = new Date();
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const diasRestantes = (ultimoDiaMes - hoy.getDate()) || 1;
  const semanasRestantes = Math.ceil(diasRestantes / 7);
  const gastoSemanal = saldoReal > 0 ? saldoReal / semanasRestantes : 0;

  // Datos para la gráfica
  const dataGrafica = [
    { name: 'Ingresos', monto: totales.ingresos, color: '#10b981' },
    { name: 'Gastado', monto: totales.egresos, color: '#64748b' },
    { name: 'Pendiente', monto: totales.pendientes, color: '#f59e0b' },
  ];

  const mesesDisponibles = Object.keys(store.meses).sort().reverse();

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-20 md:pb-8">
      
      {/* Selector de Mes y Título */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Resumen Financiero</h1>
          <p className="text-slate-500 text-sm font-medium">Controla tus gastos y ahorros</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <Calendar size={18} className="text-indigo-500 ml-2" />
          <select 
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8"
          >
            {mesesDisponibles.length > 0 ? (
              mesesDisponibles.map(m => <option key={m} value={m}>{m}</option>)
            ) : (
              <option>Sin datos</option>
            )}
          </select>
        </div>
      </div>

      {/* Grid de Tarjetas - OPTIMIZADO PARA MÓVIL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        
        {/* Tarjeta Principal: Gasto Semanal (2 columnas en móvil) */}
        <div className="col-span-2 bg-indigo-600 p-5 rounded-3xl shadow-xl text-white relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-70">Gasto Semanal Libre</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl md:text-5xl font-black">${gastoSemanal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-[10px] md:text-xs mt-4 opacity-90 font-medium flex items-center gap-1">
              <AlertCircle size={12} /> Basado en {semanasRestantes} semanas restantes
            </p>
          </div>
          {/* Decoración de fondo */}
          <div className="absolute -right-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Ingresos */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <ArrowUpCircle size={14} />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-tight">Ingresos</span>
          </div>
          <span className="text-lg md:text-2xl font-black text-emerald-600">${totales.ingresos.toLocaleString()}</span>
        </div>

        {/* Pendiente */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
              <AlertCircle size={14} />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-tight">Por Pagar</span>
          </div>
          <span className="text-lg md:text-2xl font-black text-amber-500">${totales.pendientes.toLocaleString()}</span>
        </div>

        {/* Saldo Final (Ocupa 2 columnas en móvil para balancear) */}
        <div className="col-span-2 md:col-span-1 bg-slate-900 p-4 rounded-2xl shadow-md flex flex-col justify-center text-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1 opacity-80">Saldo Final</span>
          <div className="flex items-center justify-between md:flex-col md:items-start">
            <span className="text-xl md:text-2xl font-black text-indigo-400">${saldoFinal.toLocaleString()}</span>
            <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-bold mt-1">Real: ${saldoReal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Gráfica y Detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfica de Balance */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-sm tracking-widest">
              <TrendingUp size={18} className="text-indigo-600" /> Balance del Mes
            </h3>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataGrafica} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                />
                <Bar dataKey="monto" radius={[10, 10, 10, 10]} barSize={50}>
                  {dataGrafica.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pequeño Resumen de Movimientos */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4">Últimos Movimientos</h3>
          <div className="space-y-3">
            {movimientos.slice(-5).reverse().map((mov: any, idx: number) => (
              <div key={idx} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    mov.tipo === 'ingreso' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {mov.tipo === 'ingreso' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700 truncate max-w-[100px]">{mov.descripcion}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{mov.categoria}</p>
                  </div>
                </div>
                <span className={`text-xs font-black ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {mov.tipo === 'ingreso' ? '+' : '-'}${mov.monto.toLocaleString()}
                </span>
              </div>
            ))}
            {movimientos.length === 0 && (
              <p className="text-center text-slate-400 text-xs py-10 font-bold">Sin movimientos este mes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}