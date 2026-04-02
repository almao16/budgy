"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Home() {
  const { data: session, status } = useSession();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [store, setStore] = useState<any>({ meses: {}, plantilla: [] });
  const [mesActual, setMesActual] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (session) {
      fetch('/api/db').then(res => res.json()).then(data => {
        if (data.meses) setStore(data);
      });
    }
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) { setError(res.error); setLoading(false); }
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-slate-100"><p className="text-slate-500 font-bold animate-pulse">Cargando Budgy...</p></div>;

  // --- PANTALLA DE LOGIN ---
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full border-t-4 border-indigo-600">
          <h1 className="text-4xl font-black text-slate-800 mb-2">📊 Budgy</h1>
          <p className="text-slate-500 text-sm mb-6">Inicia sesión o regístrate con tu correo</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="tu@correo.com" required className="w-full border p-3 rounded-xl text-sm outline-none text-slate-900 bg-white placeholder-slate-400 focus:border-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Contraseña" required className="w-full border p-3 rounded-xl text-sm outline-none text-slate-900 bg-white placeholder-slate-400 focus:border-indigo-500" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white p-3 rounded-xl text-sm font-bold shadow-md hover:bg-slate-900">{loading ? "Verificando..." : "Entrar / Registrarse"}</button>
          </form>
        </div>
      </div>
    );
  }

  // --- PREPARACIÓN DE DATOS PARA EL DASHBOARD ---
  const list = store.meses[mesActual] || [];
  
  // Sumas de columnas
  let sumIn = 0;
  let egresos = 0;
  let pendientes = 0;
  let comprometido = 0;

  // Categorías para la gráfica de torta
  let gastosPorTipo = { fijo: 0, esencial: 0, variable: 0, ahorro: 0, deuda: 0 };

  list.forEach((m: any) => {
    if (m.tipo === 'ingreso') {
        sumIn += m.monto;
    } else {
        if (m.estado === 'pagado') egresos += m.monto;
        if (m.estado === 'pendiente') pendientes += m.monto;
        if (['fijo', 'ahorro', 'deuda'].includes(m.tipo)) comprometido += m.monto;
        
        // Sumamos a la categoría correspondiente
        if (gastosPorTipo[m.tipo as keyof typeof gastosPorTipo] !== undefined) {
             gastosPorTipo[m.tipo as keyof typeof gastosPorTipo] += m.monto;
        }
    }
  });

  const balanceNeto = sumIn - egresos - pendientes;
  const semanal = (sumIn - comprometido) > 0 ? ((sumIn - comprometido) / 4) : 0;

  // Datos para las gráficas
  const dataBalance = [
    { name: 'Ingresos', Monto: sumIn, fill: '#10b981' }, // emerald-500
    { name: 'Gastado', Monto: egresos, fill: '#475569' }, // slate-600
    { name: 'Pendiente', Monto: pendientes, fill: '#f59e0b' } // amber-500
  ];

  const dataCategorias = [
    { name: 'Fijo Mensual', value: gastosPorTipo.fijo, color: '#3b82f6' },
    { name: 'Esencial Irreg.', value: gastosPorTipo.esencial, color: '#8b5cf6' },
    { name: 'Deseo / Ocio', value: gastosPorTipo.variable, color: '#ec4899' },
    { name: 'Ahorro', value: gastosPorTipo.ahorro, color: '#10b981' },
    { name: 'Deuda', value: gastosPorTipo.deuda, color: '#ef4444' }
  ].filter(item => item.value > 0); // Ocultar los que están en cero

  const mesesKeys = Object.keys(store.meses);
  if (!mesesKeys.includes(mesActual)) mesesKeys.push(mesActual);
  mesesKeys.sort().reverse();

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Filtro de Mes */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Resumen Financiero</h2>
            <select value={mesActual} onChange={(e) => setMesActual(e.target.value)} className="p-2 rounded-lg border bg-slate-50 font-bold text-slate-700 outline-none">
              {mesesKeys.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>

        {/* Tarjetas Principales */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 bg-blue-600 p-6 rounded-xl shadow-md text-center text-white flex flex-col justify-center">
              <p className="text-[10px] uppercase font-black tracking-widest opacity-80">Gasto Semanal Libre</p>
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

        {/* Sección de Gráficas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Gráfica de Barras: Ingresos vs Gastos */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-6">Balance del Mes</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataBalance} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="Monto" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Gráfica de Torta: Distribución de Gastos */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-6">Distribución de Gastos (Planificado)</h3>
                <div className="h-64 w-full">
                    {dataCategorias.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={dataCategorias} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {dataCategorias.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            No hay gastos registrados este mes
                        </div>
                    )}
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}