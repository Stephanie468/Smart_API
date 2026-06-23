import twilio from 'twilio'

// ── Initialisation du client Twilio ──────────────────────────
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

// ── Formate le numéro pour WhatsApp ──────────────────────────
// Twilio exige le format "whatsapp:+237XXXXXXXXX"
function formatTelephone(telephone: string): string {
  const propre = telephone.replace(/\s+/g, '')
  const avecPlus = propre.startsWith('+') ? propre : `+${propre}`
  return `whatsapp:${avecPlus}`
}

// ── Envoi d'un message texte simple ──────────────────────────
export async function envoyerMessage(telephone: string, message: string): Promise<void> {
  try {
    await client.messages.create({
      from: FROM,
      to: formatTelephone(telephone),
      body: message
    })
    console.log(`[WhatsApp] Message envoyé à ${telephone}`)
  } catch (error: any) {
    console.error('[WhatsApp] Erreur envoi:', error.message)
    throw new Error('Échec envoi WhatsApp')
  }
}

// ── Envoi du code OTP ────────────────────────────────────────
export async function envoyerOTP(telephone: string, code: string): Promise<void> {
  const message = `🏥 *Smart-Santé Cameroun*\n\nVotre code de vérification est :\n\n*${code}*\n\n⏱️ Ce code expire dans 5 minutes.\n\n_Ne partagez ce code avec personne._`
  await envoyerMessage(telephone, message)
}

// ── Message de bienvenue nouveau patient ─────────────────────
export async function envoyerBienvenue(telephone: string, nom: string): Promise<void> {
  const message = `👋 Bonjour *${nom}* !\n\nBienvenue sur *Smart-Santé Cameroun*. 🏥\n\nJe suis votre assistant médical IA. Décrivez vos symptômes et je vous aide.\n\n_Exemple : "j'ai de la fièvre depuis 2 jours"_`
  await envoyerMessage(telephone, message)
}

// ── Envoi du résumé de diagnostic ────────────────────────────
export async function envoyerFicheDiagnostic(
  telephone: string,
  nomPatient: string,
  diagnostic: string,
  urgence: 'VERT' | 'ORANGE' | 'ROUGE'
): Promise<void> {
  const emoji = urgence === 'VERT' ? '🟢' : urgence === 'ORANGE' ? '🟠' : '🔴'
  const conseil = urgence === 'VERT'
    ? 'Rendez-vous en pharmacie.'
    : urgence === 'ORANGE'
    ? 'Consultez un médecin dans les 48h.'
    : '⚠️ Rendez-vous aux urgences immédiatement !'

  const message = [
    `🏥 *Smart-Santé Cameroun — Résumé consultation*`,
    ``,
    `Bonjour *${nomPatient}*,`,
    ``,
    `${emoji} *Niveau d'urgence : ${urgence}*`,
    `📋 *Pré-diagnostic :*`,
    diagnostic,
    ``,
    `👉 ${conseil}`,
    ``,
    `⚠️ _Ce pré-diagnostic est une aide à l'orientation. Consultez un médecin pour un diagnostic définitif._`
  ].join('\n')

  await envoyerMessage(telephone, message)
}