const BACKEND =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3000'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end('Method Not Allowed')
  }
  try {
    const upstream = await fetch(`${BACKEND}/whatsapp-qr`)
    if (upstream.status === 404) return res.status(404).end()
    if (!upstream.ok) return res.status(upstream.status).end()
    const data = await upstream.json()
    return res.status(200).json(data)
  } catch {
    return res.status(503).end()
  }
}
