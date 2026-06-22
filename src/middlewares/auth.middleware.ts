import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    role: string
    nom: string
    prenom: string
    email: string | null
    telephone: string
  }
}

// ── Middleware de validation du token JWT ────────────────────
export const authentifierToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' })
  }

  try {
    const secret = process.env.JWT_SECRET || 'smart_sante_secret_key_2025'
    const payload = jwt.verify(token, secret) as { id: string; role: string }

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        statut: true
      }
    })

    if (!utilisateur) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' })
    }

    if (utilisateur.statut !== 'ACTIF') {
      return res.status(403).json({ message: 'Ce compte n\'est pas actif.' })
    }

    // Attache l'utilisateur à la requête
    req.user = utilisateur
    next()
  } catch (error) {
    console.error('[AuthMiddleware] Erreur de vérification du token :', error)
    return res.status(403).json({ message: 'Jeton invalide ou expiré.' })
  }
}

// ── Middleware d'autorisation par rôle ───────────────────────
export const exigerRole = (roleExige: 'PATIENT' | 'MEDECIN' | 'ADMIN') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié.' })
    }
    if (req.user.role !== roleExige) {
      return res.status(403).json({ message: 'Accès interdit. Permission insuffisante.' })
    }
    next()
  }
}
