import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const DB_KEY = 'app_core_storage';

    try {
        if (req.method === 'GET') {
            const data = await kv.get(DB_KEY);
            // Si la base de datos está vacía, devuelve una estructura inicial limpia
            return res.status(200).json(data || { movimientos: [] });
        }
        
        if (req.method === 'POST') {
            await kv.set(DB_KEY, req.body);
            return res.status(200).json({ success: true });
        }
    } catch (e) {
        console.error("Error KV:", e);
        return res.status(500).json({ error: "Error de conexión con la base de datos" });
    }
}