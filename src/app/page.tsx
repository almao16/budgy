"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { TrendingUp, Calendar, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [store, setStore] = useState<any>({ meses: {} });
  const [loading, setLoading] = useState(true);
  const [mesSeleccionado, setMesSeleccionado] = useState("");

  useEffect(() => {
    if (session) {
      fetch('/api/db')
        .then(res => res.json())
        .then(data => {
          setStore(data);
          const mesesDisponibles = Object.keys(data.meses || {});
          if (mesesDisponibles.length > 0) {
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
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium italic animate-pulse">Cargando...</p>
      </div>
    );
  }

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
  
  const hoy = new Date();
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const diasRestantes = (ultimoDiaMes - hoy.getDate()) || 1;
  const semanasRestantes = Math.ceil(diasRestantes / 7);
  const gastoSemanal = saldoReal > 0 ? saldoReal / semanasRestantes : 0;

  const dataGrafica = [
    { name: 'Ingresos', monto: totales.ingresos, color: '#10b981' },
    { name: 'Gastado', monto: totales.egresos, color: '#3b82f6' },
    { name: 'Pendiente', monto: totales.pendientes, color: '#f59e0b' },
  ];

  const mesesDisponibles = Object.keys(store.meses).sort().reverse();

  return (
    <div className="min-h-screen bg-slate-50 w-full">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pb-20 md:pb-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Resumen Financiero</h1>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <Calendar size={18} className="text-slate-500 ml-2" />
            <select 
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 pr-8"
            >
              {mesesDisponibles.length > 0 ? (
                mesesDisponibles.map(m => <option key={m} value={m}>{m}</option>)
              ) : <option>Sin datos</option>}
            </select>
          </div>
        </div>

        {/* EL FIX DE LA FILA: Cambiado a md:grid-cols-5 para que quepan las 4 tarjetas (2+1+1+1 = 5) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6">
          
          {/* Tarjeta Azul: Ocupa 2 espacios en móvil y 2 espacios en escritorio */}
          <div className="col-span-2 bg-blue-600 p-5 md:p-6 rounded-2xl shadow-md text-white flex flex-col justify-center">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-90 mb-1">Gasto Semanal Libre</span>
            <span className="text-3xl md:text-5xl font-black">${gastoSemanal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-emerald-500 flex flex-col justify-center text-center">
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-tight mb-1">Ingresos</span>
            <span className="text-xl md:text-2xl font-black text-emerald-600">${totales.ingresos.toLocaleString()}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-amber-400 flex flex-col justify-center text-center">
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-tight mb-1">Pendiente</span>
            <span className="text-xl md:text-2xl font-black text-amber-500">${totales.pendientes.toLocaleString()}</span>
          </div>

          {/* Tarjeta Negra: Ocupa 2 espacios en móvil para balancear, pero SOLO 1 en escritorio para encajar en la fila */}
          <div className="col-span-2 md:col-span-1 bg-slate-900 p-4 rounded-2xl shadow-md flex flex-col justify-center text-white text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Saldo Final</span>
            <span className="text-xl md:text-2xl font-black text-white">${saldoFinal.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 uppercase text-sm mb-6">Balance del Mes</h3>
            <div className="h-[250px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataGrafica} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="monto" radius={[8, 8, 8, 8]} barSize={40}>
                    {dataGrafica.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="font-black text-slate-800 uppercase text-xs mb-4">Últimos Movimientos</h3>
            <div className="space-y-3">
              {movimientos.slice(-5).reverse().map((mov: any, idx: number) => (
                <div key={idx} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm border border-slate-100 hover:shadow-md transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mov.tipo === 'ingreso' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
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
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}