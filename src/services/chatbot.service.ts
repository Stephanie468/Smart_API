import prisma from '../config/prisma.js'
import { envoyerMessage, envoyerFicheDiagnostic, envoyerBienvenue } from './whatsapp.service.js'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `Tu es Smart-Santé, un assistant médical bienveillant au Cameroun.
Tu aides les patients à identifier leurs symptômes en français ou en anglais.

Pathologies que tu couvres : paludisme, typhoïde, infections respiratoires, dermatoses, diarrhées infectieuses, hypertension légère.

Règles absolues :
1. Pose UNE seule question courte et claire à la fois
2. Après 5 à 7 échanges, génère un résumé avec :
   - Pré-diagnostic probable
   - Niveau d'urgence : VERT (pharmacie), ORANGE (médecin 48h), ROUGE (urgences maintenant)
   - 2-3 recommandations concrètes
3. Termine TOUJOURS par : "⚠️ Je ne suis pas un médecin. Consultez un professionnel pour un diagnostic définitif."
4. Sois chaleureux, concis, et adapte ton langage au contexte camerounais
5. Si urgence ROUGE : insiste immédiatement sur les soins d'urgence`

// ── Appel à l'API Claude ─────────────────────────────────────
async function appellerClaude(historique: Array<{role: string, content: string}>, nouveauMessage: string): Promise<string> {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-20240307',   // rapide + économique
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        ...historique,
        { role: 'user', content: nouveauMessage }
      ]
    })
  })

  if (!response.ok) {
    const err = await response.json()
    console.error('[Claude] Erreur:', err)
    throw new Error('Erreur API Claude')
  }

  const data = await response.json()
  return data.content[0].text
}

// ── Traitement principal du message WhatsApp ─────────────────
export async function traiterMessageEntrant(
  telephone: string,
  texte: string,
  nomWA: string
): Promise<void> {
  // 1. Trouve ou crée le patient
  let utilisateur = await prisma.utilisateur.findUnique({
    where: { telephone },
    include: { patient: true }
  })

  if (!utilisateur) {
    // Nouveau patient — crée automatiquement un profil minimal
    utilisateur = await prisma.utilisateur.create({
      data: {
        nom: nomWA.split(' ')[0] || 'Patient',
        prenom: nomWA.split(' ')[1] || '',
        telephone,
        role: 'PATIENT',
        statut: 'ACTIF',
        patient: {
          create: { langue: 'FR' }
        }
      },
      include: { patient: true }
    })

    // Message de bienvenue pour les nouveaux
    await envoyerBienvenue(telephone, nomWA)
    return
  }

  const patientId = utilisateur.patient!.id

  // 2. Récupère ou crée la conversation active
  let conversation = await prisma.conversation.findFirst({
    where: {
      patientId,
      statut: 'EN_COURS',
      canal: 'WHATSAPP'
    },
    include: { messages: { orderBy: { horodatage: 'asc' } } }
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { patientId, canal: 'WHATSAPP', statut: 'EN_COURS' },
      include: { messages: true }
    })
  }

  // 3. Construit l'historique pour Claude
  const historique = conversation.messages.map(m => ({
    role: m.expediteur === 'PATIENT' ? 'user' : 'assistant',
    content: m.contenu
  }))

  // 4. Sauvegarde le message du patient
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      contenu: texte,
      expediteur: 'PATIENT'
    }
  })

  // 5. Appelle Claude
  const reponseIA = await appellerClaude(historique, texte)

  // 6. Sauvegarde la réponse de l'IA
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      contenu: reponseIA,
      expediteur: 'IA'
    }
  })

  // 7. Détecte si c'est un diagnostic final
  const estDiagnosticFinal = reponseIA.includes('VERT') ||
                              reponseIA.includes('ORANGE') ||
                              reponseIA.includes('ROUGE')

  if (estDiagnosticFinal) {
    // Détermine le niveau d'urgence
    const urgence = reponseIA.includes('ROUGE') ? 'ROUGE'
                  : reponseIA.includes('ORANGE') ? 'ORANGE'
                  : 'VERT'

    // Sauvegarde la consultation IA en base
    await prisma.consultationIA.create({
      data: {
        patientId,
        conversationId: conversation.id,
        symptomes: historique.filter(m => m.role === 'user').map(m => m.content).join(' | '),
        preDiagnostic: reponseIA,
        niveauUrgence: urgence,
        suiviDateRelance: new Date(Date.now() + 48 * 60 * 60 * 1000)
      }
    })

    // Ferme la conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { statut: 'TERMINEE', dateFin: new Date() }
    })
  }

  // 8. Envoie la réponse au patient
  await envoyerMessage(telephone, reponseIA)
}

// Helper pour envoyerMessage depuis whatsapp.service
async function envoyerMessages(telephone: string, message: string): Promise<void> {
  const { envoyerMessage: send } = await import('./whatsapp.service.js')
  await send(telephone, message)
}