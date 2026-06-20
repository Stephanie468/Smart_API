-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('PATIENT', 'MEDECIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "Langue" AS ENUM ('FR', 'EN');

-- CreateEnum
CREATE TYPE "NiveauUrgence" AS ENUM ('VERT', 'ORANGE', 'ROUGE');

-- CreateEnum
CREATE TYPE "CanalConversation" AS ENUM ('WHATSAPP', 'WEB');

-- CreateEnum
CREATE TYPE "StatutConversation" AS ENUM ('EN_COURS', 'TERMINEE', 'ABANDONNEE');

-- CreateEnum
CREATE TYPE "ExpediteurMessage" AS ENUM ('PATIENT', 'BOT', 'IA');

-- CreateEnum
CREATE TYPE "TypeFormationSanitaire" AS ENUM ('HOPITAL', 'CENTRE_SANTE', 'PHARMACIE', 'CLINIQUE');

-- CreateEnum
CREATE TYPE "StatutRendezVous" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ANNULE', 'TERMINE');

-- CreateEnum
CREATE TYPE "StatutCertification" AS ENUM ('EN_ATTENTE', 'VALIDE', 'SUSPENDU', 'REJETE');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('RDV', 'ALERTE_SANTE', 'RAPPEL_MEDICAMENT', 'SYSTEME');

-- CreateEnum
CREATE TYPE "JourSemaine" AS ENUM ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE');

-- CreateEnum
CREATE TYPE "StatutAlerte" AS ENUM ('ACTIVE', 'RESOLUE', 'ARCHIVEE');

-- CreateTable
CREATE TABLE "utilisateur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT NOT NULL,
    "motDePasseHash" TEXT,
    "role" "RoleUtilisateur" NOT NULL,
    "statut" "StatutCompte" NOT NULL DEFAULT 'ACTIF',
    "otpCode" TEXT,
    "otpExpiration" TIMESTAMP(3),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMiseAJour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient" (
    "id" TEXT NOT NULL,
    "localisation" TEXT,
    "region" TEXT,
    "ville" TEXT,
    "langue" "Langue" NOT NULL DEFAULT 'FR',
    "groupeSanguin" TEXT,
    "antecedents" TEXT,
    "allergies" TEXT,

    CONSTRAINT "patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medecin" (
    "id" TEXT NOT NULL,
    "specialite" TEXT NOT NULL,
    "numeroOrdre" TEXT NOT NULL,
    "carteProfessionnelleUrl" TEXT NOT NULL,
    "tarifConsultation" DECIMAL(10,2) NOT NULL,
    "statutCertification" "StatutCertification" NOT NULL DEFAULT 'EN_ATTENTE',
    "bio" TEXT,
    "formationSanitaireId" TEXT,
    "valideParId" TEXT,

    CONSTRAINT "medecin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrateur" (
    "id" TEXT NOT NULL,
    "niveauAcces" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "administrateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "canal" "CanalConversation" NOT NULL DEFAULT 'WHATSAPP',
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" TIMESTAMP(3),
    "statut" "StatutConversation" NOT NULL DEFAULT 'EN_COURS',

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "expediteur" "ExpediteurMessage" NOT NULL,
    "horodatage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pathologie" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "pathologie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_ia" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "conversationId" TEXT,
    "symptomes" TEXT NOT NULL,
    "preDiagnostic" TEXT NOT NULL,
    "niveauUrgence" "NiveauUrgence" NOT NULL,
    "scoreConfiance" DOUBLE PRECISION,
    "recommandations" TEXT,
    "ficheUrl" TEXT,
    "suiviDateRelance" TIMESTAMP(3),
    "suiviReponse" TEXT,
    "suiviEffectue" BOOLEAN NOT NULL DEFAULT false,
    "dateConsultation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_pathologie" (
    "consultationId" TEXT NOT NULL,
    "pathologieId" TEXT NOT NULL,
    "probabilite" DOUBLE PRECISION,

    CONSTRAINT "consultation_pathologie_pkey" PRIMARY KEY ("consultationId","pathologieId")
);

-- CreateTable
CREATE TABLE "formation_sanitaire" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeFormationSanitaire" NOT NULL,
    "adresse" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "telephone" TEXT,
    "horaires" TEXT,

    CONSTRAINT "formation_sanitaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_orientation" (
    "consultationId" TEXT NOT NULL,
    "formationSanitaireId" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,

    CONSTRAINT "consultation_orientation_pkey" PRIMARY KEY ("consultationId","formationSanitaireId")
);

-- CreateTable
CREATE TABLE "creneau" (
    "id" TEXT NOT NULL,
    "medecinId" TEXT NOT NULL,
    "jourSemaine" "JourSemaine" NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "creneau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rendez_vous" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medecinId" TEXT NOT NULL,
    "creneauId" TEXT,
    "dateHeure" TIMESTAMP(3) NOT NULL,
    "statut" "StatutRendezVous" NOT NULL DEFAULT 'EN_ATTENTE',
    "motif" TEXT,

    CONSTRAINT "rendez_vous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordonnance" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medecinId" TEXT NOT NULL,
    "rendezVousId" TEXT,
    "contenu" TEXT NOT NULL,
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "envoyeeWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "cheminFichier" TEXT,

    CONSTRAINT "ordonnance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rappel_medicament" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicament" TEXT NOT NULL,
    "heurePrise" TEXT NOT NULL,
    "frequence" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "prochaineEnvoi" TIMESTAMP(3),

    CONSTRAINT "rappel_medicament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "dateEnvoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerte_epidemiologique" (
    "id" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "pathologieId" TEXT NOT NULL,
    "seuil" INTEGER NOT NULL,
    "variationPct" DOUBLE PRECISION NOT NULL,
    "dateDetection" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutAlerte" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "alerte_epidemiologique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_email_key" ON "utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_telephone_key" ON "utilisateur"("telephone");

-- CreateIndex
CREATE INDEX "patient_region_ville_idx" ON "patient"("region", "ville");

-- CreateIndex
CREATE UNIQUE INDEX "medecin_numeroOrdre_key" ON "medecin"("numeroOrdre");

-- CreateIndex
CREATE INDEX "medecin_specialite_statutCertification_idx" ON "medecin"("specialite", "statutCertification");

-- CreateIndex
CREATE INDEX "conversation_patientId_statut_idx" ON "conversation"("patientId", "statut");

-- CreateIndex
CREATE INDEX "message_conversationId_horodatage_idx" ON "message"("conversationId", "horodatage");

-- CreateIndex
CREATE UNIQUE INDEX "pathologie_nom_key" ON "pathologie"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "pathologie_code_key" ON "pathologie"("code");

-- CreateIndex
CREATE INDEX "consultation_ia_patientId_dateConsultation_idx" ON "consultation_ia"("patientId", "dateConsultation");

-- CreateIndex
CREATE INDEX "consultation_ia_niveauUrgence_dateConsultation_idx" ON "consultation_ia"("niveauUrgence", "dateConsultation");

-- CreateIndex
CREATE INDEX "formation_sanitaire_region_ville_type_idx" ON "formation_sanitaire"("region", "ville", "type");

-- CreateIndex
CREATE INDEX "creneau_medecinId_jourSemaine_disponible_idx" ON "creneau"("medecinId", "jourSemaine", "disponible");

-- CreateIndex
CREATE INDEX "rendez_vous_medecinId_dateHeure_idx" ON "rendez_vous"("medecinId", "dateHeure");

-- CreateIndex
CREATE INDEX "rendez_vous_patientId_statut_idx" ON "rendez_vous"("patientId", "statut");

-- CreateIndex
CREATE INDEX "ordonnance_patientId_dateEmission_idx" ON "ordonnance"("patientId", "dateEmission");

-- CreateIndex
CREATE INDEX "rappel_medicament_actif_prochaineEnvoi_idx" ON "rappel_medicament"("actif", "prochaineEnvoi");

-- CreateIndex
CREATE INDEX "notification_utilisateurId_lue_idx" ON "notification"("utilisateurId", "lue");

-- CreateIndex
CREATE INDEX "alerte_epidemiologique_zone_statut_idx" ON "alerte_epidemiologique"("zone", "statut");

-- AddForeignKey
ALTER TABLE "patient" ADD CONSTRAINT "patient_id_fkey" FOREIGN KEY ("id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medecin" ADD CONSTRAINT "medecin_id_fkey" FOREIGN KEY ("id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medecin" ADD CONSTRAINT "medecin_formationSanitaireId_fkey" FOREIGN KEY ("formationSanitaireId") REFERENCES "formation_sanitaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medecin" ADD CONSTRAINT "medecin_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "administrateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrateur" ADD CONSTRAINT "administrateur_id_fkey" FOREIGN KEY ("id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_ia" ADD CONSTRAINT "consultation_ia_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_ia" ADD CONSTRAINT "consultation_ia_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_pathologie" ADD CONSTRAINT "consultation_pathologie_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultation_ia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_pathologie" ADD CONSTRAINT "consultation_pathologie_pathologieId_fkey" FOREIGN KEY ("pathologieId") REFERENCES "pathologie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_orientation" ADD CONSTRAINT "consultation_orientation_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultation_ia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_orientation" ADD CONSTRAINT "consultation_orientation_formationSanitaireId_fkey" FOREIGN KEY ("formationSanitaireId") REFERENCES "formation_sanitaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creneau" ADD CONSTRAINT "creneau_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "medecin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "medecin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_creneauId_fkey" FOREIGN KEY ("creneauId") REFERENCES "creneau"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordonnance" ADD CONSTRAINT "ordonnance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordonnance" ADD CONSTRAINT "ordonnance_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "medecin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordonnance" ADD CONSTRAINT "ordonnance_rendezVousId_fkey" FOREIGN KEY ("rendezVousId") REFERENCES "rendez_vous"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rappel_medicament" ADD CONSTRAINT "rappel_medicament_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerte_epidemiologique" ADD CONSTRAINT "alerte_epidemiologique_pathologieId_fkey" FOREIGN KEY ("pathologieId") REFERENCES "pathologie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
