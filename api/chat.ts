import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Serverless proxy so the AI chat works for every visitor: the browser calls
 * /api/chat (same origin), and this function calls Ollama Cloud with the
 * secret key. Set OLLAMA_API_KEY in the Vercel project settings.
 */
const OLLAMA_CLOUD_URL = process.env.OLLAMA_CLOUD_URL ?? 'https://ollama.com'
// Cloud model names drop the local "-cloud" suffix (gemma4:31b-cloud → gemma4:31b).
const MODEL = (process.env.OLLAMA_MODEL ?? 'gemma4:31b-cloud').replace(/-cloud$/, '')

interface ChatMessage {
  role: string
  content: string
}

function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== 'object') return null
  const msgs = (body as { messages?: unknown }).messages
  if (!Array.isArray(msgs) || msgs.length === 0 || msgs.length > 20) return null
  for (const m of msgs) {
    if (!m || typeof m !== 'object') return null
    const { role, content } = m as ChatMessage
    if (typeof role !== 'string' || typeof content !== 'string' || content.length > 20_000) return null
  }
  return msgs as ChatMessage[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.OLLAMA_API_KEY

  // GET is the availability probe for the chat UI's online/offline badge.
  if (req.method === 'GET') {
    if (!key) return res.status(503).json({ ok: false, error: 'OLLAMA_API_KEY not configured' })
    return res.status(200).json({ ok: true, model: MODEL })
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!key) return res.status(503).json({ error: 'OLLAMA_API_KEY not configured' })

  const messages = parseMessages(req.body)
  if (!messages) return res.status(400).json({ error: 'Body must be {"messages":[{role,content},...]}' })

  const upstream = await fetch(`${OLLAMA_CLOUD_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      format: 'json',
      options: { temperature: 0.3 },
      messages,
    }),
  })

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')
    return res.status(502).json({ error: `Ollama Cloud ${upstream.status}`, detail: detail.slice(0, 500) })
  }
  return res.status(200).json(await upstream.json())
}
