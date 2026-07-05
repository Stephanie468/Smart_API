import express from 'express'
import {
  getStatistiques,
  getMedecins,
  validerMedecin,
  getStructures,
  creerStructure,
  modifierStructure,
  deleteStructure,
  getPathologies,
  creerPathologie,
  modifierPathologie,
  deletePathologie,
  getAlertes,
  creerAlerte,
  validerAlerte
} from '../controllers/admin.controller.js'
import { authentifierToken, exigerRole } from '../middlewares/auth.middleware.js'

const adminRoutes = express.Router()

// Protection de toutes les routes admin
adminRoutes.use(authentifierToken)
adminRoutes.use(exigerRole('ADMIN'))

// Statistiques / Dashboard
adminRoutes.get('/statistiques', getStatistiques)

// Modération Médecins
adminRoutes.get('/medecins', getMedecins)
adminRoutes.put('/medecins/:id/statut', validerMedecin)

// Structures Sanitaires
adminRoutes.get('/structures', getStructures)
adminRoutes.post('/structures', creerStructure)
adminRoutes.put('/structures/:id', modifierStructure)
adminRoutes.delete('/structures/:id', deleteStructure)

// Pathologies
adminRoutes.get('/pathologies', getPathologies)
adminRoutes.post('/pathologies', creerPathologie)
adminRoutes.put('/pathologies/:id', modifierPathologie)
adminRoutes.delete('/pathologies/:id', deletePathologie)

// Alertes épidémiologiques
adminRoutes.get('/alertes', getAlertes)
adminRoutes.post('/alertes', creerAlerte)
adminRoutes.put('/alertes/:id/statut', validerAlerte)

export default adminRoutes
