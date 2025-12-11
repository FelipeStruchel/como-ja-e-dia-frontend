const BACKEND =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:3000";
const LOG_TOKEN = process.env.LOG_INGEST_TOKEN || "";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end("Method Not Allowed");
    }
    if (!LOG_TOKEN) {
        return res.status(500).json({ error: "LOG_INGEST_TOKEN não configurado no frontend" });
    }
    try {
        const upstream = await fetch(`${BACKEND}/logs/ingest`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-log-token": LOG_TOKEN,
            },
            body: JSON.stringify(req.body || {}),
        });
        const text = await upstream.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (_) {
            data = text;
        }
        res.status(upstream.status).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message || "Erro ao enviar log" });
    }
}
