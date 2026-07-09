import express from 'express'
import {
  getDashboard,
  getPatients,
  validerPrescription,
  getPlanning,
  getDemandesRendezVous,
  mettreAJourDemandeRendezVous,
  creerCreneau
} from '../controllers/medecin.controller.js'
import { authentifierToken, exigerRole } from '../middlewares/auth.middleware.js'

const medecinRoutes = express.Router()

// Protection de toutes les routes médecin par Token et Rôle MEDECIN
medecinRoutes.use(authentifierToken)
medecinRoutes.use(exigerRole('MEDECIN'))

// Tableau de bord médecin
medecinRoutes.get('/dashboard', getDashboard)

// Liste des fiches / patients IA
medecinRoutes.get('/patients', getPatients)

// Validation et prescription d'ordonnance
medecinRoutes.post('/prescription', validerPrescription)

// Gestion du planning
medecinRoutes.get('/planning', getPlanning)
medecinRoutes.get('/planning/demandes', getDemandesRendezVous)
medecinRoutes.put('/planning/demandes/:id', mettreAJourDemandeRendezVous)
medecinRoutes.post('/planning/creneau', creerCreneau)

export default medecinRoutes
