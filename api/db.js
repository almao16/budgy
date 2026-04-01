import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Nombre de la "llave" donde guardaremos todo tu JSON
    const DB_KEY = 'finanzas_betzabeth';

    try {
        if (req.method === 'GET') {
            const data = await kv.get(DB_KEY);
            // Si la base de datos está vacía, devolvemos una estructura inicial
            return res.status(200).json(data || { meses: {}, plantilla: [] });
        }

        if (req.method === 'POST') {
            await kv.set(DB_KEY, req.body);
            return res.status(200).json({ success: true });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}