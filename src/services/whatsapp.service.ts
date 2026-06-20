const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN

// ── Fonction générique d'envoi de message ────────────────────
export async function envoyerMessage(telephone: string, message: string): Promise<void> {
  const response = await fetch(WHATSAPP_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: telephone,
      type: 'text',
      text: { body: message }
    })
  })

  if (!response.ok) {
    const err = await response.json()
    console.error('[WhatsApp] Erreur envoi:', err)
    throw new Error('Échec envoi WhatsApp')
  }

  console.log(`[WhatsApp] Message envoyé à ${telephone}`)
}

// ── Envoi du code OTP ────────────────────────────────────────
export async function envoyerOTP(telephone: string, code: string): Promise<void> {
  const message = `🏥 *Smart-Santé Cameroun*\n\nVotre code de vérification est :\n\n*${code}*\n\n⏱️ Ce code expire dans 5 minutes.\n\n_Ne partagez ce code avec personne._`
  await envoyerMessage(telephone, message)
}

// ── Envoi de la fiche PDF après diagnostic ───────────────────
export async function envoyerFicheDiagnostic(
  telephone: string,
  nomPatient: string,
  diagnostic: string,
  urgence: 'VERT' | 'ORANGE' | 'ROUGE',
  orientations: string[]
): Promise<void> {
  const emoji = urgence === 'VERT' ? '🟢' : urgence === 'ORANGE' ? '🟠' : '🔴'

  const message = [
    `🏥 *Smart-Santé Cameroun — Résumé de consultation*`,
    ``,
    `Bonjour *${nomPatient}*,`,
    ``,
    `📋 *Pré-diagnostic IA :*`,
    diagnostic,
    ``,
    `${emoji} *Niveau d'urgence : ${urgence}*`,
    ``,
    orientations.length > 0 ? `📍 *Structures proches de vous :*` : '',
    ...orientations.map(o => `• ${o}`),
    ``,
    `⚠️ _Ce pré-diagnostic est une aide à l'orientation. Consultez un médecin pour un diagnostic définitif._`,
  ].filter(Boolean).join('\n')

  await envoyerMessage(telephone, message)
}

// ── Message de bienvenue ─────────────────────────────────────
export async function envoyerBienvenue(telephone: string, nom: string): Promise<void> {
  const message = `👋 Bonjour *${nom}* !\n\nBienvenue sur *Smart-Santé Cameroun*. 🏥\n\nJe suis votre assistant médical IA. Décrivez vos symptômes en quelques mots et je vous aide à comprendre votre état de santé.\n\n_Exemple : "j'ai de la fièvre depuis 2 jours et des maux de tête"_`
  await envoyerMessage(telephone, message)
}