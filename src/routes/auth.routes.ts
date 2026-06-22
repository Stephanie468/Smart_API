import express from 'express'
import {
  inscrirePatient,
  inscrireMedecin,
  verifierOTP,
  connexion,
  getProfil,
  renvoyerOTP,
  deconnexion
} from '../controllers/auth.controller.js'
import { authentifierToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.post('/inscription/patient', inscrirePatient)
router.post('/inscription/medecin', inscrireMedecin)
router.post('/verification/otp', verifierOTP)
router.post('/connexion', connexion)
router.post('/otp/renvoyer', renvoyerOTP)

// Routes protégées par authentification JWT
router.get('/profil', authentifierToken, getProfil)
router.post('/deconnexion', authentifierToken, deconnexion)

export default router