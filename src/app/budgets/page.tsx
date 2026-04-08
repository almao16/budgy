"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function BudgetsPage() {
  const { data: session, status } = useSession();
  const [store, setStore] = useState<any>({ meses: {} });

  useEffect(() => {
    if (session) {
      fetch('/api/db').then(res => res.json()).then(data => {
        if (data.meses) setStore(data);
      });
    }
  }, [session]);

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-slate-100"><p className="text-slate-500 font-bold animate-pulse">Cargando...</p></div>;
  if (!session) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><p className="text-slate-500 font-bold">Acceso denegado.</p></div>;

  const mesesGuardados = Object.keys(store.meses).sort().reverse();

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabecera con botón de agregar */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h1 className="text-3xl font-bold text-slate-800">🗓️ Mis Presupuestos</h1>
            <Link href="/transactions">
                <button className="mt-4 md:mt-0 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition">
                    + Nuevo Presupuesto
                </button>
            </Link>
        </div>

        {mesesGuardados.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center shadow-sm text-slate-500 border border-dashed border-slate-300">
                <p className="text-lg">No tienes meses registrados aún.</p>
                <p className="text-sm mt-2">Haz clic en <b>+ Nuevo Presupuesto</b> para empezar.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mesesGuardados.map(mes => {
                    const list = store.meses[mes] || [];
                    let sumIn = 0; let egresos = 0; let pendientes = 0;
                    list.forEach((m: any) => {
                        if (m.tipo === 'ingreso') sumIn += m.monto;
                        else {
                            if (m.estado === 'pagado') egresos += m.monto;
                            if (m.estado === 'pendiente') pendientes += m.monto;
                        }
                    });

                    return (
                        <div key={mes} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                            <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                                <h2 className="text-xl font-black tracking-widest">{mes}</h2>
                                <span className="text-xs bg-slate-700 px-2 py-1 rounded font-bold">{list.length} movs</span>
                            </div>
                            
                            <div className="p-5 space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <span className="text-sm font-bold text-slate-400">Ingresos:</span>
                                    <span className="text-emerald-600 font-bold">${sumIn.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <span className="text-sm font-bold text-slate-400">Gastado:</span>
                                    <span className="text-slate-600 font-bold">${egresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <span className="text-sm font-bold text-slate-400">Por pagar:</span>
                                    <span className="text-amber-500 font-bold">${pendientes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                                
                                <Link href={`/transactions?month=${mes}`}>
                                    <button className="w-full mt-4 bg-indigo-50 text-indigo-600 py-2 rounded-lg font-bold text-sm hover:bg-indigo-600 hover:text-white transition border border-indigo-200 hover:border-indigo-600">
                                        ✏️ Ver y Editar Mes
                                    </button>
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
}