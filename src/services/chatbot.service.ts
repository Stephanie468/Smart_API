import prisma from '../config/prisma.js'
import { envoyerMessage } from './whatsapp.service.js'

// ── Prompt système pour Groq ─────────────────────────────────
const SYSTEM_PROMPT = `Tu es Smart-Santé, un assistant médical bienveillant au Cameroun.
Tu aides les patients à identifier leurs symptômes en français ou en anglais.

Pathologies que tu connais : paludisme, typhoïde, infections respiratoires, dermatoses, diarrhées infectieuses.

Règles :
1. Pose UNE seule question courte à la fois
2. Après 5 à 7 échanges, génère un résumé avec :
   - Pré-diagnostic probable
   - Niveau d'urgence : VERT (pharmacie), ORANGE (médecin 48h), ROUGE (urgences maintenant)
3. Termine TOUJOURS par : "⚠️ Je ne suis pas un médecin. Consultez un professionnel."
4. Sois chaleureux et concis`

// ── Appel à l'API Groq (Gratuit & Ultra-rapide) ───────────────
async function appellerGroq(
  historique: Array<{ role: string; content: string }>,
  nouveauMessage: string
): Promise<string> {

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.error("[Groq] GROQ_API_KEY manquante")
    return "Configuration manquante. Contactez l'administrateur."
  }

  // ✅ Messages bien formatés — role doit être 'user' ou 'assistant' uniquement
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...historique.map(m => ({
      role:    m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    })),
    { role: 'user', content: nouveauMessage }
  ]

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({
        // ✅ Modèles Groq gratuits disponibles en 2026
        // llama-3.3-70b-versatile → meilleur pour le médical
        // llama-3.1-8b-instant    → plus rapide mais moins précis
        model:       'llama-3.3-70b-versatile',
        messages,
        temperature: 0.4,
        max_tokens:  500,
        // ✅ IMPORTANT : désactive explicitement les tools
        // C'est ce qui causait l'erreur "tool choice is none but model called a tool"
        tool_choice: 'none',
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Groq] Erreur API:', response.status, errText.substring(0, 300))
      return "Je rencontre une difficulté technique. Réessayez dans quelques instants. 🏥"
    }

    const data = await response.json()

    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content
    }

    console.error('[Groq] Réponse inattendue:', JSON.stringify(data).substring(0, 200))
    return "Réponse invalide reçue."

  } catch (error) {
    console.error('[Groq] Erreur réseau:', error)
    return "Impossible de contacter le service. Réessayez."
  }
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
    utilisateur = await prisma.utilisateur.create({
      data: {
        nom:      nomWA.split(' ')[0] || 'Patient',
        prenom:   nomWA.split(' ').slice(1).join(' ') || '',
        telephone,
        role:     'PATIENT',
        statut:   'ACTIF',
        patient:  { create: { langue: 'FR' } }
      },
      include: { patient: true }
    })

    await envoyerMessage(telephone,
      `👋 Bonjour *${nomWA}* ! Bienvenue sur *Smart-Santé Cameroun* 🏥\n\n` +
      `Je suis votre assistant médical IA.\n\n` +
      `Avant de commencer, puis-je connaître votre *ville de résidence* ?\n` +
      `_(Ex: Douala, Yaoundé, Bafoussam...)_`
    )
    return
  }

  // Gestion de l'onboarding progressif
  const patient = utilisateur.patient!

  if (!patient.ville) {
    await prisma.patient.update({
      where: { id: patient.id },
      data: { ville: texte.trim(), localisation: texte.trim() }
    })
    await envoyerMessage(telephone,
      `✅ Noté ! Vous êtes à *${texte.trim()}*.\n\n` +
      `Quel est votre *âge* approximatif ?\n_(Ex: 25 ans)_`
    )
    return
  }

  if (!patient.antecedents) {
    await prisma.patient.update({
      where: { id: patient.id },
      data: { antecedents: `Âge déclaré : ${texte.trim()}` }
    })
    await envoyerMessage(telephone,
      `✅ Parfait !\n\n` +
      `Votre profil est maintenant complet. 🎉\n\n` +
      `Vous pouvez maintenant *décrire vos symptômes* et je vous aiderai à comprendre votre état de santé.\n\n` +
      `_Exemple : "j'ai de la fièvre depuis 2 jours et des maux de tête"_`
    )
    return
  }

  const patientId = utilisateur.patient!.id

  // 2. Récupère ou crée la conversation active
  let conversation = await prisma.conversation.findFirst({
    where: { patientId, statut: 'EN_COURS', canal: 'WHATSAPP' },
    include: { messages: { orderBy: { horodatage: 'asc' } } }
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { patientId, canal: 'WHATSAPP', statut: 'EN_COURS' },
      include: { messages: true }
    })
  }

  // 3. Construit l'historique pour Groq
 const historique = conversation.messages.map(m => ({
  role:    m.expediteur === 'PATIENT' ? 'user' : 'assistant',
  content: m.contenu
}))

  // 4. Sauvegarde le message du patient
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      contenu:        texte,
      expediteur:     'PATIENT'
    }
  })

  // 5. Appelle Groq au lieu de Gemini
  const reponseIA = await appellerGroq(historique, texte)

  // 6. Sauvegarde la réponse
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      contenu:        reponseIA,
      expediteur:     'IA'
    }
  })

  // 7. Détecte si c'est un diagnostic final
  const estFinal =
    reponseIA.includes('VERT') ||
    reponseIA.includes('ORANGE') ||
    reponseIA.includes('ROUGE')

  if (estFinal) {
    const urgence = reponseIA.includes('ROUGE') ? 'ROUGE'
                  : reponseIA.includes('ORANGE') ? 'ORANGE'
                  : 'VERT'

    await prisma.consultationIA.create({
      data: {
        patientId,
        conversationId:   conversation.id,
        symptomes:        historique.filter(m => m.role === 'user').map(m => m.content).join(' | '),
        preDiagnostic:    reponseIA,
        niveauUrgence:    urgence,
        suiviDateRelance: new Date(Date.now() + 48 * 60 * 60 * 1000)
      }
    })

    await prisma.conversation.update({
      where: { id: conversation.id },
      data:  { statut: 'TERMINEE', dateFin: new Date() }
    })
  }

  // 8. Envoie la réponse au patient
  await envoyerMessage(telephone, reponseIA)
}