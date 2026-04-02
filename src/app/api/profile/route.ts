import { kv } from '@vercel/kv';
import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    
    const perfil = await kv.get(`budgy:user:${user.id}:perfil`);
    
    return NextResponse.json(perfil || { 
        nombre: user.name, 
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}` 
    });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    
    const body = await req.json();
    await kv.set(`budgy:user:${user.id}:perfil`, body);
    
    // Actualizar nombre en auth
    const userKey = `budgy:user:auth:${user.email}`;
    const authUser: any = await kv.get(userKey);
    if(authUser) {
        authUser.name = body.nombre;
        await kv.set(userKey, authUser);
    }
    
    return NextResponse.json({ message: "Perfil actualizado" });
}