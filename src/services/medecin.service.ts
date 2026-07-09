import prisma from '../config/prisma.js'
import { JourSemaine } from '@prisma/client'
import type { ConsultationIA, Patient, Utilisateur, Pathologie, ConsultationPathologie } from '@prisma/client'

type ConsultationIAAvecRelations = ConsultationIA & {
  patient: Patient & { utilisateur: Pick<Utilisateur, 'nom' | 'prenom' | 'telephone'> }
  pathologies: (ConsultationPathologie & { pathologie: Pathologie })[]
}

/**
 * Service gérant la logique métier pour l'espace médecin.
 *
 * ⚠️ RÈGLE DE CONFIDENTIALITÉ CENTRALE (secret médical / RGPD) :
 * Un médecin ne voit la fiche de pré-diagnostic IA d'un patient QUE si :
 *   1. Le patient a pris rendez-vous avec CE médecin précis (relation explicite)
 *   2. La fiche IA a été générée avant (ou à) la date de ce rendez-vous
 *      (dateConsultation <= dateHeure du rendez-vous). On utilise `dateHeure`
 *      (champ déjà existant, pas de migration) plutôt qu'une date de création
 *      du RDV : ça permet au médecin de voir l'état de santé le plus à jour
 *      du patient jusqu'à la date du rendez-vous, ce qui est le comportement
 *      attendu (le médecin doit connaître le dernier pré-diagnostic avant de
 *      recevoir le patient).
 *   3. Seule LA PLUS RÉCENTE fiche répondant aux deux conditions ci-dessus
 *      est affichée — jamais tout l'historique du patient.
 *
 * Si le patient prend un nouveau rendez-vous plus tardif avec ce médecin,
 * la fenêtre d'autorisation s'élargit automatiquement jusqu'à cette nouvelle
 * date, et la fiche la plus récente à ce moment-là devient visible.
 */
export class MedecinService {

  /**
   * Calcule, pour ce médecin, la fiche IA la plus récente autorisée pour
   * chaque patient ayant un rendez-vous avec lui.
   *
   * On utilise `dateHeure` (date du rendez-vous, déjà existante dans le
   * schéma — pas besoin de migration) comme ligne de démarcation : seules
   * les fiches IA antérieures ou égales à la date du rendez-vous le plus
   * tardif sont visibles. Cela garantit que le médecin voit l'état de santé
   * le plus à jour du patient avant de le recevoir, sans jamais dévoiler
   * une fiche postérieure à un rendez-vous déjà passé sans suite.
   *
   * Retourne une Map<patientId, ConsultationIA> — une seule fiche par patient.
   */
  private static async getConsultationsAutoriseesMap(
    medecinId: string
  ): Promise<Map<string, ConsultationIAAvecRelations>> {

    // 1. Date du rendez-vous le plus tardif, par patient, pour ce médecin
    const groupes = await prisma.rendezVous.groupBy({
      by: ['patientId'],
      where: { medecinId },
      _max: { dateHeure: true }
    })

    if (groupes.length === 0) {
      return new Map()
    }

    // 2. Récupère les fiches IA de ces patients, uniquement celles antérieures
    // ou égales à la date de leur rendez-vous le plus tardif avec CE médecin
    const consultations = await prisma.consultationIA.findMany({
      where: {
        OR: groupes.map(g => ({
          patientId: g.patientId,
          dateConsultation: { lte: g._max.dateHeure! }
        }))
      },
      orderBy: { dateConsultation: 'desc' },
      include: {
        patient: {
          include: {
            utilisateur: { select: { nom: true, prenom: true, telephone: true } }
          }
        },
        pathologies: { include: { pathologie: true } }
      }
    })

    // 3. Ne garde que LA PLUS RÉCENTE fiche par patient
    // (la liste est déjà triée desc, donc la première rencontrée par patient = la plus récente)
    const dernieresParPatient = new Map<string, ConsultationIAAvecRelations>()
    for (const consultation of consultations) {
      if (!dernieresParPatient.has(consultation.patientId)) {
        dernieresParPatient.set(consultation.patientId, consultation as ConsultationIAAvecRelations)
      }
    }

    return dernieresParPatient
  }

  /**
   * Vérifie qu'un médecin a le droit de voir UNE fiche IA précise, et que
   * cette fiche est bien la plus récente autorisée pour ce patient (pas une
   * fiche plus ancienne remplacée, ni une fiche future non liée au rendez-vous).
   * Lève une erreur explicite si l'accès est refusé.
   */
  private static async verifierAccesConsultation(
    medecinId: string,
    consultationId: string
  ): Promise<ConsultationIAAvecRelations> {

    const consultation = await prisma.consultationIA.findUnique({
      where: { id: consultationId },
      include: {
        patient: {
          include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } }
        },
        pathologies: { include: { pathologie: true } }
      }
    })

    if (!consultation) {
      throw new Error('Consultation introuvable')
    }

    // Date du rendez-vous le plus tardif pris par ce patient avec ce médecin
    const dernierRendezVous = await prisma.rendezVous.findFirst({
      where: { medecinId, patientId: consultation.patientId },
      orderBy: { dateHeure: 'desc' },
      select: { dateHeure: true }
    })

    if (!dernierRendezVous) {
      throw new Error("Accès refusé : ce patient n'a jamais pris rendez-vous avec vous.")
    }

    if (consultation.dateConsultation > dernierRendezVous.dateHeure) {
      throw new Error(
        "Accès refusé : cette fiche est postérieure à votre rendez-vous avec ce patient."
      )
    }

    // Vérifie qu'il n'existe pas une fiche plus récente qui aurait dû
    // remplacer celle-ci dans l'affichage (on ne montre jamais une fiche périmée)
    const ficheLaPlusRecenteAutorisee = await prisma.consultationIA.findFirst({
      where: {
        patientId: consultation.patientId,
        dateConsultation: { lte: dernierRendezVous.dateHeure }
      },
      orderBy: { dateConsultation: 'desc' },
      select: { id: true }
    })

    if (!ficheLaPlusRecenteAutorisee || ficheLaPlusRecenteAutorisee.id !== consultation.id) {
      throw new Error("Accès refusé : seule la fiche la plus récente de ce patient est consultable.")
    }

    return consultation as ConsultationIAAvecRelations
  }

  /**
   * Récupère les données du tableau de bord d'un médecin.
   * @param medecinId ID du médecin connecté.
   */
  static async getDashboardData(medecinId: string) {
    const medecin = await prisma.medecin.findUnique({
      where: { id: medecinId },
      include: {
        utilisateur: { select: { nom: true, prenom: true } },
        formationSanitaire: true
      }
    })

    if (!medecin) {
      throw new Error('Médecin introuvable')
    }

    // ── Fiches IA autorisées : une seule par patient, la plus récente,
    // et uniquement pour les patients ayant pris rendez-vous avec ce médecin ──
    const dernieresConsultations = await this.getConsultationsAutoriseesMap(medecinId)
    const consultationsAutorisees = Array.from(dernieresConsultations.values())

    const fichesNonTraitees = consultationsAutorisees.filter(c => !c.suiviEffectue)
    const fichesEnAttenteCount = fichesNonTraitees.length
    const fileAttente = fichesNonTraitees.slice(0, 10)

    // Téléconsultations du jour
    const debutJour = new Date()
    debutJour.setHours(0, 0, 0, 0)
    const finJour = new Date()
    finJour.setHours(23, 59, 59, 999)

    const teleconsultationsCount = await prisma.rendezVous.count({
      where: { medecinId, dateHeure: { gte: debutJour, lte: finJour } }
    })

    // Patients uniques vus ce mois-ci
    const debutMois = new Date()
    debutMois.setDate(1)
    debutMois.setHours(0, 0, 0, 0)

    const rendezVousCeMois = await prisma.rendezVous.findMany({
      where: { medecinId, dateHeure: { gte: debutMois } },
      select: { patientId: true }
    })
    const patientsCeMoisCount = new Set(rendezVousCeMois.map(r => r.patientId)).size

    // Planning du jour (déjà sécurisé : filtré par medecinId)
    const planningJour = await prisma.rendezVous.findMany({
      where: { medecinId, dateHeure: { gte: debutJour, lte: finJour } },
      orderBy: { dateHeure: 'asc' },
      include: {
        patient: { include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } } },
        creneau: true
      }
    })

    return {
      medecin: {
        nom: medecin.utilisateur.nom,
        prenom: medecin.utilisateur.prenom,
        specialite: medecin.specialite,
        structure: medecin.formationSanitaire?.nom || 'Cabinet Indépendant'
      },
      kpis: {
        fichesEnAttente: fichesEnAttenteCount,
        teleconsultations: teleconsultationsCount,
        patientsCeMois: patientsCeMoisCount,
        tempsMoyen: '18 min'
      },
      fileAttente,
      planningJour
    }
  }

  /**
   * Récupère, pour chaque patient ayant un rendez-vous avec ce médecin,
   * uniquement SA fiche IA la plus récente autorisée.
   */
  static async getPatientsConsultations(medecinId: string) {
    const medecin = await prisma.medecin.findUnique({
      where: { id: medecinId },
      select: { id: true }
    })

    if (!medecin) {
      throw new Error('Médecin introuvable')
    }

    const dernieresConsultations = await this.getConsultationsAutoriseesMap(medecinId)
    return Array.from(dernieresConsultations.values())
  }

  /**
   * Récupère le détail d'UNE fiche de consultation IA précise.
   * Vérifie que la fiche est bien autorisée ET qu'elle est la plus récente
   * (protection contre un accès direct par ID — IDOR — et contre l'affichage
   * d'une fiche périmée ou postérieure au rendez-vous).
   */
  static async getConsultationDetail(medecinId: string, consultationId: string) {
    return this.verifierAccesConsultation(medecinId, consultationId)
  }

  /**
   * Valide un diagnostic, crée une ordonnance et marque la consultation IA comme traitée.
   * Vérifie d'abord que le médecin a bien le droit d'agir sur CETTE fiche précise
   * (même règle que la consultation : la plus récente, antérieure au rendez-vous).
   */
  static async creerPrescription(
    medecinId: string,
    data: {
      consultationId: string
      patientId: string
      contenu: string
      rendezVousId?: string
    }
  ) {
    // ── Vérification d'autorisation AVANT toute écriture ──
    const consultation = await this.verifierAccesConsultation(medecinId, data.consultationId)

    // Cohérence défensive : le patientId fourni doit correspondre à la consultation
    if (consultation.patientId !== data.patientId) {
      throw new Error('Incohérence : le patient ne correspond pas à la consultation fournie.')
    }

    return prisma.$transaction(async (tx) => {
      const ordonnance = await tx.ordonnance.create({
        data: {
          patientId: data.patientId,
          medecinId,
          rendezVousId: data.rendezVousId || null,
          contenu: data.contenu,
          dateEmission: new Date()
        }
      })

      await tx.consultationIA.update({
        where: { id: data.consultationId },
        data: {
          suiviEffectue: true,
          suiviReponse: data.contenu,
          suiviDateRelance: new Date()
        }
      })

      return ordonnance
    })
  }

  /**
   * Récupère les créneaux et les rendez-vous hebdomadaires du médecin.
   * (Déjà sécurisé : filtré par medecinId dès le départ.)
   */
  static async getPlanning(medecinId: string) {
    const creneaux = await prisma.creneau.findMany({
      where: { medecinId },
      orderBy: [{ jourSemaine: 'asc' }, { heureDebut: 'asc' }]
    })

    const rendezVous = await prisma.rendezVous.findMany({
      where: { medecinId },
      orderBy: { dateHeure: 'asc' },
      include: {
        patient: { include: { utilisateur: { select: { nom: true, prenom: true } } } }
      }
    })

    return { creneaux, rendezVous }
  }

  /**
   * Récupère les demandes de rendez-vous en attente d'un médecin.
   */
  static async getDemandesRendezVous(medecinId: string) {
    return prisma.rendezVous.findMany({
      where: { medecinId, statut: 'EN_ATTENTE' },
      orderBy: { dateHeure: 'asc' },
      include: {
        patient: { include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } } },
        creneau: true
      }
    })
  }

  /**
   * Met à jour le statut d'une demande de rendez-vous du médecin.
   */
  static async mettreAJourStatutRendezVous(
    medecinId: string,
    rendezVousId: string,
    statut: 'CONFIRME' | 'ANNULE'
  ) {
    if (!['CONFIRME', 'ANNULE'].includes(statut)) {
      throw new Error('Statut de rendez-vous invalide.')
    }

    return prisma.$transaction(async (tx) => {
      const rendezVous = await tx.rendezVous.findUnique({
        where: { id: rendezVousId },
        include: { creneau: true }
      })

      if (!rendezVous || rendezVous.medecinId !== medecinId) {
        throw new Error('Rendez-vous introuvable.')
      }

      if (rendezVous.statut !== 'EN_ATTENTE') {
        throw new Error('Cette demande de rendez-vous ne peut plus être modifiée.')
      }

      if (statut === 'ANNULE' && rendezVous.creneauId && rendezVous.creneau) {
        await tx.creneau.update({
          where: { id: rendezVous.creneauId },
          data: { disponible: true }
        })
      }

      const updated = await tx.rendezVous.update({
        where: { id: rendezVousId },
        data: { statut },
        include: {
          patient: { include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } } },
          creneau: true
        }
      })

      return updated
    })
  }

  /**
   * Crée un nouveau créneau de disponibilité pour le médecin.
   */
  static async creerCreneau(
    medecinId: string,
    data: { jourSemaine: JourSemaine; heureDebut: string; heureFin: string }
  ) {
    return prisma.creneau.create({
      data: {
        medecinId,
        jourSemaine: data.jourSemaine,
        heureDebut: data.heureDebut,
        heureFin: data.heureFin,
        disponible: true
      }
    })
  }
}