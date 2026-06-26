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

  // 1. Sécurité : Vérifier la clé API
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[Groq] Erreur : La variable d'environnement GROQ_API_KEY n'est pas définie.");
    return "Configuration manquante. Veuillez vérifier les variables d'environnement.";
  }

  // 2. Structurer les messages au format standard requis par Groq
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...historique.map(m => ({
      // Groq utilise 'assistant' au lieu de 'model'
      role: m.role === 'user' ? 'user' : 'assistant', 
      content: m.content
    })),
    { role: 'user', content: nouveauMessage }
  ];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b", // Modèle Llama 3 optimisé pour la vitesse et gratuit
        messages: messages,
        temperature: 0.5 // Légèrement abaissé pour des réponses médicales plus stables
      })
    });  

    // 3. Gestion des erreurs HTTP
    if (!response.ok) {
      const errText = await response.text();
      console.error('[Groq] Erreur API :', response.status, errText.substring(0, 500));
      return "Je rencontre une difficulté technique. Veuillez réessayer dans quelques instants. 🏥";
    }

    // 4. Extraction de la réponse
    const data = await response.json();
    
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    } else {
      console.error("[Groq] Structure de réponse inattendue :", data);
      return "La réponse reçue est invalide.";
    }

  } catch (error) {
    console.error('[Groq] Erreur réseau ou système :', error);
    return "Impossible de contacter le service pour le moment.";
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
    role:    m.expediteur === 'PATIENT' ? 'user' : 'model',
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