import prisma from '../config/prisma.js'
import { JourSemaine } from '@prisma/client'

/**
 * Service gérant la logique métier pour l'espace médecin.
 */
export class MedecinService {
  /**
   * Récupère les données du tableau de bord d'un médecin.
   * @param medecinId ID du médecin connecté.
   */
  static async getDashboardData(medecinId: string) {
    // 1. Infos du médecin et sa structure sanitaire
    const medecin = await prisma.medecin.findUnique({
      where: { id: medecinId },
      include: {
        utilisateur: {
          select: { nom: true, prenom: true }
        },
        formationSanitaire: true
      }
    })

    if (!medecin) {
      throw new Error('Médecin introuvable')
    }

    const structureId = medecin.formationSanitaireId

    // Clause de filtrage : si le médecin est rattaché à un hôpital, on filtre les consultationsIA
    // orientées vers cet hôpital. Sinon, on affiche tout.
    const whereClause = structureId
      ? {
          orientations: {
            some: { formationSanitaireId: structureId }
          }
        }
      : {}

    // 2. KPIs
    // A. Fiches IA en attente (non traitées)
    const fichesEnAttenteCount = await prisma.consultationIA.count({
      where: {
        ...whereClause,
        suiviEffectue: false
      }
    })

    // B. Téléconsultations / Rendez-vous du jour
    const debutJour = new Date()
    debutJour.setHours(0, 0, 0, 0)
    const finJour = new Date()
    finJour.setHours(23, 59, 59, 999)

    const teleconsultationsCount = await prisma.rendezVous.count({
      where: {
        medecinId,
        dateHeure: {
          gte: debutJour,
          lte: finJour
        }
      }
    })

    // C. Patients uniques vus ce mois-ci
    const debutMois = new Date()
    debutMois.setDate(1)
    debutMois.setHours(0, 0, 0, 0)

    const rendezVousCeMois = await prisma.rendezVous.findMany({
      where: {
        medecinId,
        dateHeure: { gte: debutMois }
      },
      select: { patientId: true }
    })

    const patientIds = new Set(rendezVousCeMois.map(rdv => rdv.patientId))
    const patientsCeMoisCount = patientIds.size

    // 3. File d'attente (5 consultations IA les plus récentes non traitées)
    const fileAttente = await prisma.consultationIA.findMany({
      where: {
        ...whereClause,
        suiviEffectue: false
      },
      orderBy: { dateConsultation: 'desc' },
      take: 10,
      include: {
        patient: {
          include: {
            utilisateur: {
              select: { nom: true, prenom: true, telephone: true }
            }
          }
        },
        pathologies: {
          include: { pathologie: true }
        }
      }
    })

    // 4. Planning du jour
    const planningJour = await prisma.rendezVous.findMany({
      where: {
        medecinId,
        dateHeure: {
          gte: debutJour,
          lte: finJour
        }
      },
      orderBy: { dateHeure: 'asc' },
      include: {
        patient: {
          include: {
            utilisateur: {
              select: { nom: true, prenom: true, telephone: true }
            }
          }
        },
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
   * Récupère la liste de toutes les consultations IA orientées vers le médecin/sa structure.
   */
  static async getPatientsConsultations(medecinId: string) {
    const medecin = await prisma.medecin.findUnique({
      where: { id: medecinId },
      select: { formationSanitaireId: true }
    })

    const structureId = medecin?.formationSanitaireId

    const whereClause = structureId
      ? {
          orientations: {
            some: { formationSanitaireId: structureId }
          }
        }
      : {}

    return prisma.consultationIA.findMany({
      where: whereClause,
      orderBy: { dateConsultation: 'desc' },
      include: {
        patient: {
          include: {
            utilisateur: {
              select: { nom: true, prenom: true, telephone: true }
            }
          }
        },
        pathologies: {
          include: { pathologie: true }
        }
      }
    })
  }

  /**
   * Valide un diagnostic, crée une ordonnance et marque la consultation IA comme traitée.
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
    return prisma.$transaction(async (tx) => {
      // 1. Crée l'ordonnance
      const ordonnance = await tx.ordonnance.create({
        data: {
          patientId: data.patientId,
          medecinId,
          rendezVousId: data.rendezVousId || null,
          contenu: data.contenu,
          dateEmission: new Date()
        }
      })

      // 2. Marque la consultation IA comme traitée
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
   */
  static async getPlanning(medecinId: string) {
    const creneaux = await prisma.creneau.findMany({
      where: { medecinId },
      orderBy: [
        { jourSemaine: 'asc' },
        { heureDebut: 'asc' }
      ]
    })

    const rendezVous = await prisma.rendezVous.findMany({
      where: { medecinId },
      orderBy: { dateHeure: 'asc' },
      include: {
        patient: {
          include: {
            utilisateur: {
              select: { nom: true, prenom: true }
            }
          }
        }
      }
    })

    return {
      creneaux,
      rendezVous
    }
  }

  /**
   * Crée un nouveau créneau de disponibilité pour le médecin.
   */
  static async creerCreneau(
    medecinId: string,
    data: {
      jourSemaine: JourSemaine
      heureDebut: string
      heureFin: string
    }
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
