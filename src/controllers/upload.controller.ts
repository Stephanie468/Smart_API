// src/controllers/upload.controller.ts
import { Request, Response, NextFunction } from 'express'
import multer from 'multer'

export async function uploadFichier(req: Request, res: Response): Promise<void> {
  try {
    const file = req.file as Express.Multer.File | undefined

    if (!file) {
      res.status(400).json({ message: 'Aucun fichier reçu.' })
      return
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const url = `${baseUrl}/uploads/cartes/${file.filename}`

    res.status(201).json({
      message: 'Fichier téléversé avec succès.',
      url,
      nomOriginal: file.originalname,
      taille: file.size,
    })
  } catch (error) {
    // Gestion des erreurs Multer spécifiquement
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ message: 'Fichier trop lourd. Maximum 5 Mo.' })
        return
      }
    }
    console.error('[Upload] Erreur :', error)
    res.status(500).json({ message: 'Erreur lors du téléversement.' })
  }
}