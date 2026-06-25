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
import {motDePasseOubliePatient, motDePasseOublieMedecin, verifierOTPReset, reinitialiserMotDePasse, modifierMotDePasse
} from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/inscription/patient', inscrirePatient)
router.post('/inscription/medecin', inscrireMedecin)
router.post('/verification/otp', verifierOTP)
router.post('/connexion', connexion)
router.post('/otp/renvoyer', renvoyerOTP)

// Routes protégées par authentification JWT
router.get('/profil', authentifierToken, getProfil)
router.post('/deconnexion', authentifierToken, deconnexion)



// Ajoute ces routes
router.post('/mot-de-passe-oublie/patient',  motDePasseOubliePatient)
router.post('/mot-de-passe-oublie/medecin',  motDePasseOublieMedecin)
router.post('/mot-de-passe-oublie/verifier', verifierOTPReset)
router.post('/mot-de-passe-oublie/reset',    reinitialiserMotDePasse)
router.put('/mot-de-passe',                  authentifierToken, modifierMotDePasse)


export default router