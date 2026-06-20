import { Router } from 'express'
import { GetWebhook, WebhookEntrant } from '../controllers/webhook.controller.js'

const webhookRoutes = Router()

// GET /webhook  → vérification par Meta
webhookRoutes.get('/', GetWebhook)

// POST /webhook → réception des messages WhatsApp
webhookRoutes.post('/', WebhookEntrant)

export default webhookRoutes