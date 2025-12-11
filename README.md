# Frontend (Next.js + MUI)

Interface web para administrar e consumir o bot:
- Páginas públicas: Mensagem do dia (upload de mídia/texto), Eventos, Confissões.
- Páginas admin: Triggers, Logs, hub /admin (necessitam login).
- API proxy interna para backend e ingest de logs do frontend.

## Rodando local
```bash
npm install
npm run dev
# ou
npm run build && npm start
```

Env principais (`.env`):
- `BACKEND_API_URL=https://<seu backend>` (ou http://localhost:3000 em dev)
- `LOG_INGEST_TOKEN=<token compartilhado com backend>` (para `/api/logs/ingest`)

## Logs do frontend
Use `logClient` (lib/logClient.js) para enviar logs relevantes para o backend via `/api/logs/ingest` (server-side com token).

## Docker
```bash
docker build -t frontend .
docker run -d --env-file .env -p 3001:3001 frontend
```
