import { proxyJson } from '../../../lib/backendApi'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(req.query)) {
      if (v !== undefined && v !== '') qs.set(k, String(v))
    }
    return proxyJson(req, res, { path: `/miru/characters?${qs}`, method: 'GET' })
  }
  if (req.method === 'POST') {
    return proxyJson(req, res, { path: '/miru/characters', method: 'POST' })
  }
  res.status(405).end()
}
