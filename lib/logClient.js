const ingestUrl = "/api/logs/ingest";

export async function logClient({ level = "info", message, meta = null }) {
    if (!message) return;
    try {
        await fetch(ingestUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source: "frontend",
                level,
                message,
                meta,
            }),
        });
    } catch (_) {
        // ignore
    }
}
