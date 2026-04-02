import { kv } from '@vercel/kv';
import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    
    // Buscamos si el usuario ya personalizó su perfil
    const perfil = await kv.get(`budgy:user:${session.user.id}:perfil`);
    
    // Si no tiene, le damos datos por defecto
    return NextResponse.json(perfil || { 
        nombre: session.user.name, 
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${session.user.name}` 
    });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    
    const body = await req.json();
    
    // 1. Guardamos el perfil visual
    await kv.set(`budgy:user:${session.user.id}:perfil`, body);
    
    // 2. Actualizamos también el nombre en la configuración de cuenta
    const userKey = `budgy:user:auth:${session.user.email}`;
    const authUser: any = await kv.get(userKey);
    if(authUser) {
        authUser.name = body.nombre;
        await kv.set(userKey, authUser);
    }
    
    return NextResponse.json({ message: "Perfil actualizado" });
}