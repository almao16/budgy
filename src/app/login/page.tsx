"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Credenciales incorrectas. Inténtalo de nuevo.");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      
      {/* SECCIÓN IZQUIERDA: Imagen Minimalista */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#536173] items-center justify-center p-12 relative overflow-hidden">
        
        {/* Cambiamos max-w-md por max-w-xl para darle mucho más espacio al contenedor */}
        <div className="max-w-xl w-full space-y-8 text-center relative z-20">
          
          <div className="relative group flex justify-center items-center">
            {/* Sombra difuminada (blur aumentado a 2xl para acompañar el nuevo tamaño) */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            
            {/* Quitamos el max-w-[320px], ahora w-full ocupará todo el max-w-xl */}
            <img 
              src="/login-visual.png" 
              alt="Budgy Financial Control" 
              className="relative rounded-[2rem] shadow-2xl object-contain w-full h-auto"
            />
          </div>
          
          {/* Si decides volver a activar el texto, aquí está */}
          {/* <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Control total.</h2>
            <p className="text-white/80 font-medium mt-2">La forma más simple y minimalista de gestionar tu dinero.</p>
          </div> */}
        </div>
      </div>

      {/* SECCIÓN DERECHA: Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="max-w-sm w-full space-y-10">
          
          {/* Logo y Bienvenida */}
          <div className="text-center lg:text-left flex items-center justify-center lg:justify-start gap-4">
            <h1 className="text-4xl font-black text-indigo-600">
                 Budgy
            </h1>
          </div>
          <p className="text-center lg:text-left text-slate-500 font-bold tracking-tight">Bienvenido de nuevo</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 animate-shake">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="almaodeveloper@gmail.com"
                  className="w-full bg-[#F5F7FA] border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contraseña</label>
                <Link href="#" className="text-[10px] font-bold text-indigo-600 hover:underline">¿La olvidaste?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••••"
                  className="w-full bg-[#F5F7FA] border border-slate-200 rounded-xl py-4 pl-12 pr-12 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Botón de Entrada */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Entrar a Budgy
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Registro */}
          <p className="text-center text-sm text-slate-500 font-medium">
            ¿Aún no tienes cuenta?{" "}
            <Link href="/register" className="text-indigo-600 font-black hover:underline">
              Crea una ahora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}