import { Request, Response } from 'express'
import prisma from '../config/prisma.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { envoyerOTP } from '../services/whatsapp.service.js' 


// ── Génère un code OTP à 6 chiffres ─────────────────────────
function genererOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ── Inscription Patient ──────────────────────────────────────
export const inscrirePatient = async (req: Request, res: Response) => {
  try {
    const { nom, prenom, telephone, dateNaissance, ville } = req.body

    // Validation
    if (!nom?.trim() || nom.trim().length < 2)
      return res.status(400).json({ message: 'Nom complet requis.' })
    if (!telephone || !/^\+?\d{8,15}$/.test(telephone.replace(/\s+/g, '')))
      return res.status(400).json({ message: 'Numéro WhatsApp invalide.' })

    const telPropre = telephone.replace(/\s+/g, '')

    // Vérifie si le numéro existe déjà
    const existant = await prisma.utilisateur.findUnique({
      where: { telephone: telPropre }
    })
    if (existant)
      return res.status(409).json({ message: 'Ce numéro est déjà enregistré.' })

    const otpCode      = genererOTP()
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000)

    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom:    nom.trim(),
        prenom: prenom?.trim() || '',
        telephone: telPropre,
        role:   'PATIENT',
        // ✅ INACTIF jusqu'à vérification OTP
        statut: 'INACTIF',
        otpCode,
        otpExpiration,
        patient: {
          create: {
            ville:       ville || null,
            localisation: ville || null,
            langue:      'FR'
          }
        }
      }
    })

    // ✅ Envoie l'OTP via Twilio
    await envoyerOTP(telPropre, otpCode)

    return res.status(201).json({
      message: 'Compte créé. Code OTP envoyé sur WhatsApp.',
      utilisateurId: utilisateur.id
    })

  } catch (error: any) {
    if (error.code === 'P2002')
      return res.status(409).json({ message: 'Ce numéro est déjà enregistré.' })
    console.error('[InscrirePatient] Erreur:', error)
    return res.status(500).json({ message: 'Erreur serveur.' })
  }
}
// ── Inscription Médecin ──────────────────────────────────────
export const inscrireMedecin = async (req: Request, res: Response) => {
  try {
    const {
      nom, prenom, telephone, email,
      motDePasse, specialite, hopital, numeroOrdre, carteProfessionnelleUrl
    } = req.body

    // Validation
    if (!nom || nom.trim().length < 2)
      return res.status(400).json({ message: 'Nom complet requis.' })
    if (!telephone || !/^\+?\d{8,15}$/.test(telephone.replace(/\s+/g, '')))
      return res.status(400).json({ message: 'Numéro de téléphone invalide.' })
    if (!email || !/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ message: 'Adresse e-mail invalide.' })
    if (!motDePasse || motDePasse.length < 8)
      return res.status(400).json({ message: 'Mot de passe trop court (8 caractères minimum).' })
    if (!hopital || hopital.trim().length < 2)
      return res.status(400).json({ message: 'Établissement requis.' })
     if (!numeroOrdre || numeroOrdre.trim().length < 3)
      return res.status(400).json({ message: 'Le numéro de l\'Ordre des Médecins est requis.' })
    if (!carteProfessionnelleUrl)
      return res.status(400).json({ message: 'La photo de votre carte professionnelle est obligatoire.' })


    const hash = await bcrypt.hash(motDePasse, 12)
    const netTelephone = telephone.replace(/\s+/g, '')

    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom: nom.trim(),
        prenom: prenom?.trim() || '',
        telephone: netTelephone,
        email: email.toLowerCase().trim(),
        motDePasseHash: hash,
        role: 'MEDECIN',
        medecin: {
          create: {
            specialite,
            numeroOrdre: numeroOrdre.trim(),
            carteProfessionnelleUrl: carteProfessionnelleUrl,
            tarifConsultation: 0,
            bio: hopital.trim(),
            statutCertification: 'EN_ATTENTE'
          }
        }
      }
    })

    return res.status(201).json({
      message: 'Candidature soumise. Votre profil sera vérifié sous 48h.',
      utilisateurId: utilisateur.id
    })
  } catch (error: any) {
    if (error.code === 'P2002')
      return res.status(409).json({
        message: 'Ce numéro ou e-mail est déjà enregistré.'
      })
    console.error(error)
    return res.status(500).json({ message: 'Erreur serveur. Réessayez.' })
  }
}

// ── Vérification OTP ─────────────────────────────────────────
export const verifierOTP = async (req: Request, res: Response) => {
  try {
    const { telephone, code } = req.body

    if (!telephone || !code)
      return res.status(400).json({ message: 'Téléphone et code requis.' })

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { telephone },
      include: { patient: true, medecin: true }
    })

    if (!utilisateur)
      return res.status(404).json({ message: 'Aucun compte trouvé.' })

    if (utilisateur.otpCode !== code)
      return res.status(400).json({ message: 'Code incorrect.' })

    if (!utilisateur.otpExpiration || utilisateur.otpExpiration < new Date())
      return res.status(400).json({ message: 'Code expiré. Demandez un nouveau code.' })

    // ✅ Invalide le code ET active le compte
    await prisma.utilisateur.update({
      where: { telephone },
      data: {
        otpCode:       null,
        otpExpiration: null,
        statut:        'ACTIF'   // ← active le compte après vérification
      }
    })

    const token = jwt.sign(
      { id: utilisateur.id, role: utilisateur.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    return res.status(200).json({
      message: 'Compte vérifié avec succès.',
      token,
      utilisateur: {
        id:        utilisateur.id,
        nom:       utilisateur.nom,
        prenom:    utilisateur.prenom,
        telephone: utilisateur.telephone,
        role:      utilisateur.role
      }
    })

  } catch (error: any) {
    console.error('[VerifierOTP] Erreur:', error)
    return res.status(400).json({ message: error.message || 'Code invalide.' })
  }
}
// ── Connexion ─────────────────────────────────────────────────
export const connexion = async (req: Request, res: Response) => {
  try {
    const { telephone, email, motDePasse } = req.body

    const utilisateur = await prisma.utilisateur.findFirst({
      where: telephone ? { telephone } : { email },
      include: { patient: true, medecin: true }
    })

    if (!utilisateur)
      return res.status(401).json({ message: 'Aucun compte trouvé.' })

    // ── Patient → mot de passe si disponible, sinon OTP ───
    if (utilisateur.role === 'PATIENT') {
      if (motDePasse) {
        if (!utilisateur.motDePasseHash) {
          return res.status(401).json({ message: 'Mot de passe invalide ou compte non configuré pour la connexion par mot de passe.' })
        }

        const valide = await bcrypt.compare(motDePasse, utilisateur.motDePasseHash)
        if (!valide) {
          return res.status(401).json({ message: 'Mot de passe incorrect.' })
        }

        const token = jwt.sign(
          { id: utilisateur.id, role: utilisateur.role },
          process.env.JWT_SECRET as string,
          { expiresIn: '7d' }
        )

        return res.status(200).json({
          message: 'Connexion réussie.',
          token,
          utilisateur: {
            id: utilisateur.id,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            telephone: utilisateur.telephone,
            role: utilisateur.role
          }
        })
      }

      const otpCode = genererOTP()
      const otpExpiration = new Date(Date.now() + 5 * 60 * 1000)

      await prisma.utilisateur.update({
        where: { id: utilisateur.id },
        data: {
          otpCode,
          otpExpiration,
          statut: 'ACTIF'
        }
      })

      await envoyerOTP(utilisateur.telephone!, otpCode)

      return res.status(200).json({
        message: 'OTP_SENT',
        telephone: utilisateur.telephone,
        nom: utilisateur.nom
      })
    }

    // ── Médecin → vérifie le statut de certification ──────
    if (utilisateur.role === 'MEDECIN') {
      const medecin = utilisateur.medecin

      if (medecin?.statutCertification === 'EN_ATTENTE') {
        return res.status(403).json({
          message: 'COMPTE_EN_ATTENTE',
          details: 'Votre dossier est en cours de vérification par notre équipe.'
        })
      }

      if (medecin?.statutCertification === 'SUSPENDU' ||
          medecin?.statutCertification === 'REJETE') {
        return res.status(403).json({
          message: 'COMPTE_SUSPENDU',
          details: 'Votre accès a été suspendu. Contactez support@smartsante.cm'
        })
      }
    }

    // ── Médecin + Admin → vérification mot de passe ───────
    // ✅ CORRECTION : vérifie que motDePasseHash existe avant bcrypt
    if (!utilisateur.motDePasseHash) {
      return res.status(401).json({
        message: 'Ce compte ne supporte pas la connexion par mot de passe.'
      })
    }

    if (!motDePasse) {
      return res.status(400).json({ message: 'Mot de passe requis.' })
    }

    const valide = await bcrypt.compare(motDePasse, utilisateur.motDePasseHash)

    if (!valide)
      return res.status(401).json({ message: 'Mot de passe incorrect.' })

    const token = jwt.sign(
      { id: utilisateur.id, role: utilisateur.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    return res.status(200).json({
      message: 'Connexion réussie.',
      token,
      utilisateur: {
        id:     utilisateur.id,
        nom:    utilisateur.nom,
        prenom: utilisateur.prenom,
        email:  utilisateur.email,
        role:   utilisateur.role
      }
    })

  } catch (error: any) {
    console.error('[Connexion] Erreur:', error)
    return res.status(500).json({ message: error.message || 'Erreur serveur.' })
  }
}

// ── Récupérer le Profil de l'utilisateur connecté ────────────
export const getProfil = async (req: any, res: Response) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(401).json({ message: 'Non authentifié.' })
    }

    // Récupère les informations complémentaires selon le rôle
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: user.id },
      include: {
        patient: true,
        medecin: {
          include: {
            formationSanitaire: true
          }
        },
        administrateur: true
      }
    })

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' })
    }

    // Supprime le hash du mot de passe et le code OTP de la réponse
    const { motDePasseHash, otpCode, otpExpiration, ...cleanUtilisateur } = utilisateur

    return res.status(200).json(cleanUtilisateur)
  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ message: 'Erreur lors de la récupération du profil.' })
  }
}

// ── Renvoyer un nouveau code OTP ─────────────────────────────
export const renvoyerOTP = async (req: Request, res: Response) => {
  try {
    const { telephone } = req.body
    if (!telephone) {
      return res.status(400).json({ message: 'Numéro de téléphone requis.' })
    }

    const netTelephone = telephone.replace(/\s+/g, '')
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { telephone: netTelephone }
    })

    if (!utilisateur) {
      return res.status(404).json({ message: 'Aucun utilisateur avec ce numéro.' })
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { otpCode, otpExpiration }
    })

    await envoyerOTP(netTelephone, otpCode)

    return res.status(200).json({ message: 'Code OTP renvoyé avec succès.' })
  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ message: 'Erreur lors du renvoi du code OTP.' })
  }
}

// ── Déconnexion de l'utilisateur ─────────────────────────────
export const deconnexion = async (req: Request, res: Response) => {
  return res.status(200).json({ message: 'Déconnexion réussie.' })
}