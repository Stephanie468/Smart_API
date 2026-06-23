import { Request, Response } from 'express'
import { traiterMessageEntrant } from '../services/chatbot.service.js'

// ── Webhook Twilio — réception des messages WhatsApp ─────────
// Twilio envoie les données en POST avec Content-Type: application/x-www-form-urlencoded
export const WebhookEntrant = async (req: Request, res: Response) => {
  try {
    // Twilio envoie les données dans req.body (urlencoded, pas JSON)
    const telephone = req.body.From?.replace('whatsapp:', '') // "+237690000000"
    const texte     = req.body.Body                           // "j'ai de la fièvre"
    const nomWA     = req.body.ProfileName || 'Patient'

    if (!telephone || !texte) {
      // Répond à Twilio avec une réponse vide TwiML
      res.set('Content-Type', 'text/xml')
      res.send('<Response></Response>')
      return
    }

    console.log(`[Webhook] Message de ${telephone}: ${texte}`)

    // Traitement asynchrone — répond à Twilio immédiatement
    traiterMessageEntrant(telephone, texte, nomWA).catch(console.error)

    // Twilio attend une réponse TwiML — on renvoie une réponse vide
    // car on envoie la réponse via l'API Twilio, pas via TwiML
    res.set('Content-Type', 'text/xml')
    res.send('<Response></Response>')

  } catch (error) {
    console.error('[Webhook] Erreur:', error)
    res.set('Content-Type', 'text/xml')
    res.send('<Response></Response>')
  }
}

// ── GET /api/webhook — test de santé ─────────────────────────
// Twilio n'a pas besoin de vérification GET comme Meta
// On garde quand même une route GET pour tester que l'endpoint existe
export const GetWebhook = async (req: Request, res: Response) => {
  res.json({
    message: '✅ Webhook Smart-Santé opérationnel',
    provider: 'Twilio WhatsApp Sandbox'
  })
}