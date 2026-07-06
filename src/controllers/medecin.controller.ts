import { Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js'
import { MedecinService } from '../services/medecin.service.js'

/**
 * Récupère les données du tableau de bord médecin.
 * GET /api/medecin/dashboard
 */
export const getDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const medecinId = req.user?.id
    if (!medecinId) {
      return res.status(401).json({ message: 'Non autorisé.' })
    }

    const data = await MedecinService.getDashboardData(medecinId)
    return res.status(200).json(data)
  } catch (error: any) {
    console.error('[MedecinController.getDashboard] Erreur :', error)
    return res.status(500).json({ message: error.message || 'Erreur lors de la récupération des données du tableau de bord.' })
  }
}

/**
 * Récupère la liste des fiches de consultations IA.
 * GET /api/medecin/patients
 */
export const getPatients = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const medecinId = req.user?.id
    if (!medecinId) {
      return res.status(401).json({ message: 'Non autorisé.' })
    }

    const consultations = await MedecinService.getPatientsConsultations(medecinId)
    return res.status(200).json(consultations)
  } catch (error: any) {
    console.error('[MedecinController.getPatients] Erreur :', error)
    return res.status(500).json({ message: 'Erreur lors de la récupération des fiches patients.' })
  }
}

/**
 * Valide le diagnostic et crée une ordonnance.
 * POST /api/medecin/prescription
 */
export const validerPrescription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const medecinId = req.user?.id
    if (!medecinId) {
      return res.status(401).json({ message: 'Non autorisé.' })
    }

    const { consultationId, patientId, contenu, rendezVousId } = req.body

    if (!consultationId || !patientId || !contenu) {
      return res.status(400).json({ message: 'Identifiant consultation, patient et contenu requis.' })
    }

    const ordonnance = await MedecinService.creerPrescription(medecinId, {
      consultationId,
      patientId,
      contenu,
      rendezVousId
    })

    return res.status(201).json({
      message: 'Prescription validée avec succès.',
      ordonnance
    })
  } catch (error: any) {
    console.error('[MedecinController.validerPrescription] Erreur :', error)
    return res.status(500).json({ message: 'Erreur lors de la validation de la prescription.' })
  }
}

/**
 * Récupère le planning du médecin (créneaux et rendez-vous).
 * GET /api/medecin/planning
 */
export const getPlanning = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const medecinId = req.user?.id
    if (!medecinId) {
      return res.status(401).json({ message: 'Non autorisé.' })
    }

    const planning = await MedecinService.getPlanning(medecinId)
    return res.status(200).json(planning)
  } catch (error: any) {
    console.error('[MedecinController.getPlanning] Erreur :', error)
    return res.status(500).json({ message: 'Erreur lors du chargement du planning.' })
  }
}

/**
 * Crée un nouveau créneau de disponibilité.
 * POST /api/medecin/planning/creneau
 */
export const creerCreneau = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const medecinId = req.user?.id
    if (!medecinId) {
      return res.status(401).json({ message: 'Non autorisé.' })
    }

    const { jourSemaine, heureDebut, heureFin } = req.body

    if (!jourSemaine || !heureDebut || !heureFin) {
      return res.status(400).json({ message: 'Jour de la semaine, heure de début et heure de fin requis.' })
    }

    const creneau = await MedecinService.creerCreneau(medecinId, {
      jourSemaine,
      heureDebut,
      heureFin
    })

    return res.status(201).json({
      message: 'Créneau créé avec succès.',
      creneau
    })
  } catch (error: any) {
    console.error('[MedecinController.creerCreneau] Erreur :', error)
    return res.status(500).json({ message: 'Erreur lors de la création du créneau.' })
  }
}
