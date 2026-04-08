import { kv } from '@vercel/kv';
import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/authOptions';

// ESTO FUERZA A NEXT.JS A NO GUARDAR CACHÉ DE ESTA RUTA NUNCA
export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.id) return NextResponse.json({ message: "Error" }, { status: 401 });

    const DB_KEY = `budgy:user:${user.id}:data`;
    try {
        const data = await kv.get(DB_KEY);
        return NextResponse.json(data || { meses: {}, plantillas: [] });
    } catch(e) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.id) return NextResponse.json({ message: "Error" }, { status: 401 });

    const DB_KEY = `budgy:user:${user.id}:data`;
    try {
        const body = await req.json();
        await kv.set(DB_KEY, body);
        return NextResponse.json({ message: "Exitoso" });
    } catch(e) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}