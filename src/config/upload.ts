// src/config/upload.ts
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// Chemin absolu vers le dossier uploads
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'cartes')

// Crée le dossier s'il n'existe pas
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `carte-${Date.now()}${ext}`)
  },
})

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const autorises = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (autorises.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Format non accepté. JPG, PNG, WEBP ou PDF uniquement.'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
})