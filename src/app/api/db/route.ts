import { kv } from '@vercel/kv';
import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route'; // Importamos las opciones

export async function GET() {
    // Le pasamos las opciones aquí para que no de error 401
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Error" }, { status: 401 });

    const DB_KEY = `budgy:user:${session.user.id}:data`;
    try {
        const data = await kv.get(DB_KEY);
        return NextResponse.json(data || { 
            meses: {}, 
            plantilla: [
                { desc: "Sueldo", monto: 1000, tipo: "ingreso" },
                { desc: "Internet", monto: 30, tipo: "fijo" }
            ] 
        });
    } catch(e) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // Aquí también validamos correctamente
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Error" }, { status: 401 });

    const DB_KEY = `budgy:user:${session.user.id}:data`;
    try {
        const body = await req.json();
        await kv.set(DB_KEY, body);
        // Validaciones simples, un solo mensaje de éxito
        return NextResponse.json({ message: "Exitoso" });
    } catch(e) {
        // Un solo mensaje si hubo error
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}