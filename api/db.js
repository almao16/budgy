import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Clave técnica neutra
    const DB_KEY = 'app_core_storage';

    try {
        if (req.method === 'GET') {
            const data = await kv.get(DB_KEY);
            // Estructura inicial si la base de datos está nueva
            return res.status(200).json(data || { meses: {}, plantilla: [] });
        }
        
        if (req.method === 'POST') {
            await kv.set(DB_KEY, req.body);
            return res.status(200).json({ success: true });
        }
    } catch (e) {
        console.error("Error en KV:", e);
        return res.status(500).json({ error: "Error de comunicación con el almacenamiento" });
    }
}