import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes    from './routes/auth.routes.js'
import uploadRoutes  from './routes/upload.routes.js'
import webhookRoutes from './controllers/webhook.routes.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3000

// Nécessaire en ESM pour avoir __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// ── Fichiers statiques (images uploadées) ────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',   // dev frontend
    'http://localhost:3000',   // dev backend
    process.env.FRONTEND_URL || '*'  // production
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Body parser ───────────────────────────────────────────────
// ⚠️ Le webhook Meta envoie du JSON brut — doit être AVANT les routes
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',    authRoutes)     // /api/auth/inscription/patient
app.use('/api/upload',  uploadRoutes)   // /api/upload
app.use('/api/webhook', webhookRoutes)  // /api/webhook (GET + POST)

// ── Route de test ─────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    message: '🏥 Smart-Santé Cameroun API',
    status:  'En ligne',
    version: '1.0.0',
    routes: {
      auth:    '/api/auth',
      upload:  '/api/upload',
      webhook: '/api/webhook',
    }
  })
})
// Route de ping — garde le serveur éveillé
app.get('/ping', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Démarrage ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`)
  console.log(`📡 Webhook URL : http://localhost:${PORT}/api/webhook`)
})