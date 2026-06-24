// src/controllers/upload.controller.ts
import { Request, Response, NextFunction } from 'express'
import multer from 'multer'

export async function uploadFichier(req: Request, res: Response): Promise<void> {
  try {
    const file = req.file as any
    if (!file) {
      res.status(400).json({ message: 'Aucun fichier reçu.' })
      return
    }

    // Cloudinary stocke l'URL dans file.path ou file.secure_url
    const url = file.path || file.secure_url

    res.status(201).json({
      message: 'Fichier téléversé avec succès.',
      url,
      nomOriginal: file.originalname,
    })
  } catch (error) {
    console.error('[Upload] Erreur:', error)
    res.status(500).json({ message: 'Erreur lors du téléversement.' })
  }
}