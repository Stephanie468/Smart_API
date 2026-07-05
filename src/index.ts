import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes    from './routes/auth.routes.js'
import uploadRoutes  from './routes/upload.routes.js'
import webhookRoutes from './routes/webhook.routes.js'
import patientRoutes from './routes/patient.routes.js'
import adminRoutes   from './routes/admin.routes.js'

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
    'https://smartsante-cameroun.onrender.com',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Très important - ajoute cette ligne aussi
app.options('*', cors());
// ── Body parser ───────────────────────────────────────────────
// ⚠️ IMPORTANT : Twilio envoie les données en urlencoded, pas en JSON
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',    authRoutes)     // /api/auth/inscription/patient
app.use('/api/upload',  uploadRoutes)   // /api/upload
app.use('/api/webhook', webhookRoutes)  // /api/webhook (GET + POST)
app.use('/api/patients', patientRoutes)  // /api/patients
app.use('/api/admin',    adminRoutes)    // /api/admin

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