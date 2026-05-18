import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin, Connect } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'

// Simple in-memory rate limiter: max 30 requests per IP per hour
const rateMap = new Map<string, { count: number; resetAt: number }>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const rec = rateMap.get(ip)
  if (!rec || now > rec.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 3_600_000 })
    return false
  }
  if (rec.count >= 30) return true
  rec.count++
  return false
}

function aiProxyPlugin(): Plugin {
  return {
    name: 'ai-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/ai/explain',
        async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          if (req.method !== 'POST') { next(); return }

          const apiKey = process.env.DEEPSEEK_API_KEY
          if (!apiKey) {
            res.writeHead(503, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'No server API key configured' }))
            return
          }

          const ip = (req.headers['x-forwarded-for'] as string) || '127.0.0.1'
          if (isRateLimited(ip)) {
            res.writeHead(429, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Rate limit exceeded' }))
            return
          }

          const body = await new Promise<string>((resolve) => {
            let data = ''
            req.on('data', (chunk: Buffer) => { data += chunk.toString() })
            req.on('end', () => resolve(data))
          })

          try {
            const upstream = await fetch('https://api.deepseek.com/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
              body,
            })
            const json = await upstream.json()
            res.writeHead(upstream.status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(json))
          } catch (e) {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Upstream error' }))
          }
        },
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), aiProxyPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
