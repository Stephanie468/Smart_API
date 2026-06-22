import { Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js'
import prisma from '../config/prisma.js'

// ── GET /api/patients/dashboard ──────────────────────────────
export const getDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patientId = req.user?.id
    if (!patientId) return res.status(401).json({ message: 'Non autorisé.' })

    // 1. Infos du patient et de son compte
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { utilisateur: true }
    })

    if (!patient) return res.status(404).json({ message: 'Profil patient introuvable.' })

    // 2. Dernières consultations IA (limité à 3)
    const consultationsIA = await prisma.consultationIA.findMany({
      where: { patientId },
      orderBy: { dateConsultation: 'desc' },
      take: 3,
      include: {
        pathologies: {
          include: { pathologie: true }
        }
      }
    })

    // 3. Prochain rendez-vous à venir (le plus proche dans le futur)
    const prochainRdv = await prisma.rendezVous.findFirst({
      where: {
        patientId,
        dateHeure: { gte: new Date() },
        statut: { in: ['CONFIRME', 'EN_ATTENTE'] }
      },
      orderBy: { dateHeure: 'asc' },
      include: {
        medecin: {
          include: {
            utilisateur: {
              select: { nom: true, prenom: true, telephone: true }
            },
            formationSanitaire: true
          }
        }
      }
    })

    // 4. Prescriptions / Ordonnances actives (les 5 plus récentes)
    const ordonnances = await prisma.ordonnance.findMany({
      where: { patientId },
      orderBy: { dateEmission: 'desc' },
      take: 5,
      include: {
        medecin: {
          include: {
            utilisateur: {
              select: { nom: true, prenom: true }
            }
          }
        }
      }
    })

    // 5. Structures sanitaires recommandées (selon la ville du patient)
    const structuresProches = await prisma.formationSanitaire.findMany({
      where: patient.ville ? { ville: { equals: patient.ville, mode: 'insensitive' } } : undefined,
      take: 3
    })

    // 6. Constantes médicales (simulées/statiques pour la présentation)
    const constantes = {
      temperature: '37.2°C',
      rythmeCardiaque: '72 bpm',
      tension: '12/8',
      glycemie: '0.95 g/L'
    }

    return res.status(200).json({
      patient: {
        id: patient.id,
        nom: patient.utilisateur.nom,
        prenom: patient.utilisateur.prenom,
        telephone: patient.utilisateur.telephone,
        ville: patient.ville,
        region: patient.region,
        groupeSanguin: patient.groupeSanguin,
        antecedents: patient.antecedents,
        allergies: patient.allergies
      },
      constantes,
      consultationsIA,
      prochainRdv,
      ordonnances,
      structuresProches
    })
  } catch (error: any) {
    console.error('[PatientDashboard] Erreur :', error)
    return res.status(500).json({ message: 'Erreur serveur lors du chargement du tableau de bord.' })
  }
}

// ── GET /api/patients/consultations ──────────────────────────
export const getConsultations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patientId = req.user?.id
    if (!patientId) return res.status(401).json({ message: 'Non autorisé.' })

    const consultations = await prisma.consultationIA.findMany({
      where: { patientId },
      orderBy: { dateConsultation: 'desc' },
      include: {
        pathologies: {
          include: { pathologie: true }
        }
      }
    })

    return res.status(200).json(consultations)
  } catch (error: any) {
    console.error('[PatientConsultations] Erreur :', error)
    return res.status(500).json({ message: 'Erreur serveur lors du chargement des consultations.' })
  }
}

// ── GET /api/patients/ordonnances ────────────────────────────
export const getOrdonnances = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patientId = req.user?.id
    if (!patientId) return res.status(401).json({ message: 'Non autorisé.' })

    const ordonnances = await prisma.ordonnance.findMany({
      where: { patientId },
      orderBy: { dateEmission: 'desc' },
      include: {
        medecin: {
          include: {
            utilisateur: {
              select: { nom: true, prenom: true }
            },
            formationSanitaire: true
          }
        }
      }
    })

    return res.status(200).json(ordonnances)
  } catch (error: any) {
    console.error('[PatientOrdonnances] Erreur :', error)
    return res.status(500).json({ message: 'Erreur serveur lors du chargement des prescriptions.' })
  }
}

// ── GET /api/patients/rendez-vous ────────────────────────────
export const getRendezVous = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patientId = req.user?.id
    if (!patientId) return res.status(401).json({ message: 'Non autorisé.' })

    const rendezVous = await prisma.rendezVous.findMany({
      where: { patientId },
      orderBy: { dateHeure: 'desc' },
      include: {
        medecin: {
          include: {
            utilisateur: {
              select: { nom: true, prenom: true }
            },
            formationSanitaire: true
          }
        },
        creneau: true
      }
    })

    return res.status(200).json(rendezVous)
  } catch (error: any) {
    console.error('[PatientRendezVous] Erreur :', error)
    return res.status(500).json({ message: 'Erreur serveur lors du chargement des rendez-vous.' })
  }
}

// ── POST /api/patients/rendez-vous ───────────────────────────
export const creerRendezVous = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patientId = req.user?.id
    if (!patientId) return res.status(401).json({ message: 'Non autorisé.' })

    const { medecinId, creneauId, dateHeure, motif } = req.body

    if (!medecinId || !dateHeure) {
      return res.status(400).json({ message: 'Médecin et date du rendez-vous obligatoires.' })
    }

    // Si un creneauId est fourni, on vérifie sa disponibilité
    if (creneauId) {
      const creneau = await prisma.creneau.findUnique({
        where: { id: creneauId }
      })

      if (!creneau || !creneau.disponible) {
        return res.status(400).json({ message: 'Ce créneau horaire n\'est plus disponible.' })
      }

      // Réserve le créneau
      await prisma.creneau.update({
        where: { id: creneauId },
        data: { disponible: false }
      })
    }

    const rdv = await prisma.rendezVous.create({
      data: {
        patientId,
        medecinId,
        creneauId: creneauId || null,
        dateHeure: new Date(dateHeure),
        motif: motif || '',
        statut: 'EN_ATTENTE'
      },
      include: {
        medecin: {
          include: {
            utilisateur: { select: { nom: true, prenom: true } }
          }
        }
      }
    })

    return res.status(201).json({
      message: 'Rendez-vous réservé avec succès.',
      rendezVous: rdv
    })
  } catch (error: any) {
    console.error('[CreerRendezVous] Erreur :', error)
    return res.status(500).json({ message: 'Erreur lors de la réservation du rendez-vous.' })
  }
}

// ── PUT /api/patients/profil ─────────────────────────────────
export const modifierProfil = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patientId = req.user?.id
    if (!patientId) return res.status(401).json({ message: 'Non autorisé.' })

    const { nom, prenom, groupeSanguin, antecedents, allergies, ville, region, langue } = req.body

    // Mise à jour de la table Utilisateur (commune)
    if (nom || prenom) {
      await prisma.utilisateur.update({
        where: { id: patientId },
        data: {
          nom: nom ? nom.trim() : undefined,
          prenom: prenom ? prenom.trim() : undefined
        }
      })
    }

    // Mise à jour de la table Patient (spécifique)
    const patientModifie = await prisma.patient.update({
      where: { id: patientId },
      data: {
        groupeSanguin: groupeSanguin || undefined,
        antecedents: antecedents || undefined,
        allergies: allergies || undefined,
        ville: ville || undefined,
        region: region || undefined,
        langue: langue || undefined,
        localisation: ville || undefined
      },
      include: { utilisateur: true }
    })

    return res.status(200).json({
      message: 'Profil mis à jour avec succès.',
      patient: {
        id: patientModifie.id,
        nom: patientModifie.utilisateur.nom,
        prenom: patientModifie.utilisateur.prenom,
        telephone: patientModifie.utilisateur.telephone,
        ville: patientModifie.ville,
        region: patientModifie.region,
        groupeSanguin: patientModifie.groupeSanguin,
        antecedents: patientModifie.antecedents,
        allergies: patientModifie.allergies,
        langue: patientModifie.langue
      }
    })
  } catch (error: any) {
    console.error('[ModifierProfil] Erreur :', error)
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.' })
  }
}

// ── GET /api/patients/medecins ───────────────────────────────
// Permet au patient de lister les médecins disponibles pour la prise de rendez-vous
export const getMedecinsDisponibles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const medecins = await prisma.medecin.findMany({
      where: {
        statutCertification: 'VALIDE'
      },
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
            email: true
          }
        },
        formationSanitaire: true,
        creneaux: {
          where: { disponible: true }
        }
      }
    })

    return res.status(200).json(medecins)
  } catch (error: any) {
    console.error('[GetMedecinsDisponibles] Erreur :', error)
    return res.status(500).json({ message: 'Erreur lors du chargement des médecins disponibles.' })
  }
}

// ── GET /api/patients/structures ─────────────────────────────
export const getStructuresSanitaires = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const structures = await prisma.formationSanitaire.findMany()
    return res.status(200).json(structures)
  } catch (error: any) {
    console.error('[getStructuresSanitaires] Erreur :', error)
    return res.status(500).json({ message: 'Erreur lors du chargement des structures sanitaires.' })
  }
}
