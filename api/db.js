import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const DB_KEY = 'app_core_storage'; // Clave neutra

    try {
        if (req.method === 'GET') {
            const data = await kv.get(DB_KEY);
            return res.status(200).json(data || { meses: {}, plantilla: [] });
        }
        
        if (req.method === 'POST') {
            await kv.set(DB_KEY, req.body);
            return res.status(200).json({ success: true });
        }
    } catch (e) {
        return res.status(500).json({ error: "Error de conexión con KV" });
    }
}