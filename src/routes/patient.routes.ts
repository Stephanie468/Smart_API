import express from 'express'
import {
  getDashboard,
  getConsultations,
  getOrdonnances,
  getRendezVous,
  creerRendezVous,
  modifierProfil,
  getMedecinsDisponibles,
  getStructuresSanitaires
} from '../controllers/patient.controller.js'
import { authentifierToken, exigerRole } from '../middlewares/auth.middleware.js'

const router = express.Router()

// Toutes les routes patients nécessitent d'être connecté et d'avoir le rôle PATIENT
router.use(authentifierToken)
router.use(exigerRole('PATIENT'))

router.get('/dashboard', getDashboard)
router.get('/consultations', getConsultations)
router.get('/ordonnances', getOrdonnances)
router.get('/rendez-vous', getRendezVous)
router.post('/rendez-vous', creerRendezVous)
router.put('/profil', modifierProfil)
router.get('/medecins', getMedecinsDisponibles)
router.get('/structures', getStructuresSanitaires)

export default router
