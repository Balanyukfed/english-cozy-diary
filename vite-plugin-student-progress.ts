import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const progressFile = path.resolve(dir, '../student-progress.json')

function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/**
 * Dev-only: app POSTs answers/errors/notes → english/student-progress.json
 * so the teacher can read them on «урок прошли» without copy-paste.
 */
export function studentProgressApi(): Plugin {
  return {
    name: 'student-progress-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/api/student-progress') {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8')

        if (req.method === 'GET') {
          if (!fs.existsSync(progressFile)) {
            res.end(JSON.stringify({ lessons: {}, updatedAt: null }))
            return
          }
          res.end(fs.readFileSync(progressFile, 'utf8'))
          return
        }

        if (req.method === 'POST') {
          try {
            const raw = await readBody(req)
            const payload = JSON.parse(raw) as {
              lessonId: string
              answers: Record<string, unknown>
              updatedAt?: string
            }
            if (!payload.lessonId || typeof payload.answers !== 'object') {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: 'bad payload' }))
              return
            }

            let doc: {
              lessons: Record<string, unknown>
              updatedAt: string | null
            } = { lessons: {}, updatedAt: null }

            if (fs.existsSync(progressFile)) {
              try {
                doc = JSON.parse(fs.readFileSync(progressFile, 'utf8')) as typeof doc
              } catch {
                doc = { lessons: {}, updatedAt: null }
              }
            }

            doc.lessons[payload.lessonId] = payload.answers
            doc.updatedAt = payload.updatedAt ?? new Date().toISOString()
            fs.writeFileSync(progressFile, JSON.stringify(doc, null, 2), 'utf8')
            res.end(JSON.stringify({ ok: true, updatedAt: doc.updatedAt }))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, error: String(e) }))
          }
          return
        }

        res.statusCode = 405
        res.end(JSON.stringify({ ok: false }))
      })
    },
  }
}
