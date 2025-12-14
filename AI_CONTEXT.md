Project: Frontend (Next.js)

Principles
- Page Router. All protected pages require login; public pages (mensagem do dia, eventos, confissões) stay open. Admin pages (triggers, logs, persona, schedules) only after auth.
- Use `/api/*` proxies; no hardcoded backend host. Media previews must use the public URL returned by backend (`urlPublic`); internal URLs like `http://backend:3000` should be converted to current origin for display.
- Upload scopes: default (mensagem do dia), trigger, daily (agendamentos). Keep scopes separated to avoid pool mixing. Do not surface daily uploads in mensagem do dia.
- Schedules UI: choose texto ou mídia; media type inferred by extension/upload. Cron override is optional; default is hora+dias. Include flags includeIntro/includeRandomPool as per backend contract.
- Persona UI: only edit the user-provided prompt; guardrails are fixed and should not be editable or shown as editable.
- Layout: keep existing nav rules (hide admin items when logged out, show after login). Keep chips/counts concise. Maintain current color theme and typography choices already in the project.

Do not
- Do not call backend with absolute internal hosts. Do not expose guardrails as editable. Do not mix scopes when uploading/listing media.
