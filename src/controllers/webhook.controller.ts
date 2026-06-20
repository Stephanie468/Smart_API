import { Router, Request, Response } from 'express'
import { traiterMessageEntrant } from '../services/chatbot.service.js'


// ── Vérification webhook par Meta ────────────────────────────
export const GetWebhook = async (req: Request, res: Response) => {
  const mode      = req.query['hub.mode']
  const token     = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('[Webhook] Vérifié par Meta ✅')
    res.status(200).send(challenge)
  } else {
    res.sendStatus(403)
  }
}

// ── Réception des messages entrants ─────────────────────────
export const WebhookEntrant = async (req: Request, res: Response) => {
  // Répond immédiatement à Meta (obligatoire sous 20 secondes)
  res.sendStatus(200)

  const body = req.body
  if (body.object !== 'whatsapp_business_account') return

  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  const contact = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]

  if (!message || message.type !== 'text') return

  const telephone = message.from          // "+237690000000"
  const texte     = message.text.body     // "j'ai de la fièvre"
  const nomWA     = contact?.profile?.name || 'Patient'

  // Traitement asynchrone — ne bloque pas Meta
  traiterMessageEntrant(telephone, texte, nomWA).catch(console.error)
}

