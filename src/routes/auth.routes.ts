import express from 'express'
import { inscrirePatient, inscrireMedecin, verifierOTP, connexion } from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/inscription/patient', inscrirePatient)
router.post('/inscription/medecin', inscrireMedecin)
router.post('/verification/otp', verifierOTP)
router.post('/connexion', connexion)

export default router