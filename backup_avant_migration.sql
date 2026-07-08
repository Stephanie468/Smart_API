--
-- PostgreSQL database dump
--

\restrict Q73xOBTT5P4dICEoc7yma2PXNkiGuGIwW4barFWVMDdFkKQImRSGtLqDdHpbWLc

-- Dumped from database version 18.4 (Debian 18.4-1.pgdg12+1)
-- Dumped by pg_dump version 18.4 (Debian 18.4-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: smart_sante_db_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO smart_sante_db_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: smart_sante_db_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: CanalConversation; Type: TYPE; Schema: public; Owner: smart_sante_db_user
--

CREATE TYPE public."CanalConversation" AS ENUM (
    'WHATSAPP',
    'WEB'
);


ALTER TYPE public."CanalConversation" OWNER TO smart_sante_db_user;

--
-- Name: ExpediteurMessage; Type: TYPE; Schema: public; Owner: smart_sante_db_user
--

CREATE TYPE public."ExpediteurMessage" AS ENUM (
    'PATIENT',
    'BOT',
    'IA'
);


ALTER TYPE public."ExpediteurMessage" OWNER TO smart_sante_db_user;

--
-- Name: JourSemaine; Type: TYPE; Schema: public; Owner: smart_sante_db_user
--

CREATE TYPE public."JourSemaine" AS ENUM (
    'LUNDI',
    'MARDI',
    'MERCREDI',
    'JEUDI',
    'VENDREDI',
    'SAMEDI',
    'DIMANCHE'
);


ALTER TYPE public."JourSemaine" OWNER TO smart_sante_db_user;

--
-- Name: Langue; Type: TYPE; Schema: public; Owner: smart_sante_db_user
--

CREATE TYPE public."Langue" AS ENUM (
    'FR',
    'EN'
);


ALTER TYPE public."Langue" OWNER TO smart_sante_db_user;

--
-- Name: NiveauUrgence; Type: TYPE; Schema: public; Owner: smart_sante_db_user
--

CREATE TYPE public."NiveauUrgence" AS ENUM (
    'VERT',
    'ORANGE',
    'ROUGE'
);


ALTER TYPE public."NiveauUrgence" OWNER TO smart_sante_db_user;

--
-- Name: RoleUtilisateur; Type: TYPE; Schema: public; Owner: smart_sante_db_user
--

CREATE TYPE public."RoleUtilisateur" AS ENUM (
    'PATIENT',
    'MEDECIN',
    'ADMIN'
);


ALTER TYPE public."RoleUtilisateur" OWNER TO smart_sante_db_user;

--
-- Name: StatutAlerte; Type: TYPE; Schema: public; Owner: smart_sante_db_user
--

CREATE TYPE public."StatutAlerte" AS ENUM (
    'ACTIVE',
    'RESOLUE',
    'ARCHIVEE'
);


ALTER TYPE public."StatutAlerte" OWNER TO smart_sante_db_user;

--
-- Name: StatutCertification; Type: TYPE; Schema: public; Owner: smart_sante_db_user
--

CREATE TYPE public."StatutCertification" AS ENUM (
    'EN_ATTENTE',
    'VALIDE',
    'SUSPENDU',
    'REJETE'
);


ALTER TYPE public."StatutCertification" OWNER TO smart_sante_db_user;

--
-- Name: StatutCompte; Type: TYPE; Schema: public; Owner: smart_sante_db_user
--

CREATE TYPE public."StatutCompte" AS ENUM (
    'ACTIF',
    'INACTIF',
    'SUSPENDU'
);


ALTER TYPE public."StatutCompte" OWNER TO smart_sante_db_user;

--
-- Name: StatutConversation; Type: TYPE; Schema: public; Owner: smart_sante_db_user
--

CREATE TYPE public."StatutConversation" AS ENUM (
    'EN_COURS',
    'TERMINEE',
    'ABANDONNEE'
);


ALTER TYPE public."StatutConversation" OWNER TO smart_sante_db_user;

--
-- Name: StatutRendezVous; Type: TYPE; Schema: public; Owner: smart_sante_db_user
--

CREATE TYPE public."StatutRendezVous" AS ENUM (
    'EN_ATTENTE',
    'CONFIRME',
    'ANNULE',
    'TERMINE'
);


ALTER TYPE public."StatutRendezVous" OWNER TO smart_sante_db_user;

--
-- Name: TypeFormationSanitaire; Type: TYPE; Schema: public; Owner: smart_sante_db_user
--

CREATE TYPE public."TypeFormationSanitaire" AS ENUM (
    'HOPITAL',
    'CENTRE_SANTE',
    'PHARMACIE',
    'CLINIQUE'
);


ALTER TYPE public."TypeFormationSanitaire" OWNER TO smart_sante_db_user;

--
-- Name: TypeNotification; Type: TYPE; Schema: public; Owner: smart_sante_db_user
--

CREATE TYPE public."TypeNotification" AS ENUM (
    'RDV',
    'ALERTE_SANTE',
    'RAPPEL_MEDICAMENT',
    'SYSTEME'
);


ALTER TYPE public."TypeNotification" OWNER TO smart_sante_db_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO smart_sante_db_user;

--
-- Name: administrateur; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.administrateur (
    id text NOT NULL,
    "niveauAcces" integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.administrateur OWNER TO smart_sante_db_user;

--
-- Name: alerte_epidemiologique; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.alerte_epidemiologique (
    id text NOT NULL,
    zone text NOT NULL,
    "pathologieId" text NOT NULL,
    seuil integer NOT NULL,
    "variationPct" double precision NOT NULL,
    "dateDetection" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    statut public."StatutAlerte" DEFAULT 'ACTIVE'::public."StatutAlerte" NOT NULL
);


ALTER TABLE public.alerte_epidemiologique OWNER TO smart_sante_db_user;

--
-- Name: consultation_ia; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.consultation_ia (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "conversationId" text,
    symptomes text NOT NULL,
    "preDiagnostic" text NOT NULL,
    "niveauUrgence" public."NiveauUrgence" NOT NULL,
    "scoreConfiance" double precision,
    recommandations text,
    "ficheUrl" text,
    "suiviDateRelance" timestamp(3) without time zone,
    "suiviReponse" text,
    "suiviEffectue" boolean DEFAULT false NOT NULL,
    "dateConsultation" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.consultation_ia OWNER TO smart_sante_db_user;

--
-- Name: consultation_orientation; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.consultation_orientation (
    "consultationId" text NOT NULL,
    "formationSanitaireId" text NOT NULL,
    "distanceKm" double precision
);


ALTER TABLE public.consultation_orientation OWNER TO smart_sante_db_user;

--
-- Name: consultation_pathologie; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.consultation_pathologie (
    "consultationId" text NOT NULL,
    "pathologieId" text NOT NULL,
    probabilite double precision
);


ALTER TABLE public.consultation_pathologie OWNER TO smart_sante_db_user;

--
-- Name: conversation; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.conversation (
    id text NOT NULL,
    "patientId" text NOT NULL,
    canal public."CanalConversation" DEFAULT 'WHATSAPP'::public."CanalConversation" NOT NULL,
    "dateDebut" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dateFin" timestamp(3) without time zone,
    statut public."StatutConversation" DEFAULT 'EN_COURS'::public."StatutConversation" NOT NULL
);


ALTER TABLE public.conversation OWNER TO smart_sante_db_user;

--
-- Name: creneau; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.creneau (
    id text NOT NULL,
    "medecinId" text NOT NULL,
    "jourSemaine" public."JourSemaine" NOT NULL,
    "heureDebut" text NOT NULL,
    "heureFin" text NOT NULL,
    disponible boolean DEFAULT true NOT NULL
);


ALTER TABLE public.creneau OWNER TO smart_sante_db_user;

--
-- Name: formation_sanitaire; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.formation_sanitaire (
    id text NOT NULL,
    nom text NOT NULL,
    type public."TypeFormationSanitaire" NOT NULL,
    adresse text NOT NULL,
    region text NOT NULL,
    ville text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    telephone text,
    horaires text
);


ALTER TABLE public.formation_sanitaire OWNER TO smart_sante_db_user;

--
-- Name: medecin; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.medecin (
    id text NOT NULL,
    specialite text NOT NULL,
    "numeroOrdre" text NOT NULL,
    "carteProfessionnelleUrl" text NOT NULL,
    "tarifConsultation" numeric(10,2) NOT NULL,
    "statutCertification" public."StatutCertification" DEFAULT 'EN_ATTENTE'::public."StatutCertification" NOT NULL,
    bio text,
    "formationSanitaireId" text,
    "valideParId" text
);


ALTER TABLE public.medecin OWNER TO smart_sante_db_user;

--
-- Name: message; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.message (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    contenu text NOT NULL,
    expediteur public."ExpediteurMessage" NOT NULL,
    horodatage timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.message OWNER TO smart_sante_db_user;

--
-- Name: notification; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.notification (
    id text NOT NULL,
    "utilisateurId" text NOT NULL,
    type public."TypeNotification" NOT NULL,
    titre text NOT NULL,
    message text NOT NULL,
    lue boolean DEFAULT false NOT NULL,
    "dateEnvoi" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notification OWNER TO smart_sante_db_user;

--
-- Name: ordonnance; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.ordonnance (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "medecinId" text NOT NULL,
    "rendezVousId" text,
    contenu text NOT NULL,
    "dateEmission" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "envoyeeWhatsApp" boolean DEFAULT false NOT NULL,
    "cheminFichier" text
);


ALTER TABLE public.ordonnance OWNER TO smart_sante_db_user;

--
-- Name: pathologie; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.pathologie (
    id text NOT NULL,
    nom text NOT NULL,
    code text NOT NULL,
    categorie text NOT NULL,
    description text
);


ALTER TABLE public.pathologie OWNER TO smart_sante_db_user;

--
-- Name: patient; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.patient (
    id text NOT NULL,
    localisation text,
    region text,
    ville text,
    langue public."Langue" DEFAULT 'FR'::public."Langue" NOT NULL,
    "groupeSanguin" text,
    antecedents text,
    allergies text
);


ALTER TABLE public.patient OWNER TO smart_sante_db_user;

--
-- Name: rappel_medicament; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.rappel_medicament (
    id text NOT NULL,
    "patientId" text NOT NULL,
    medicament text NOT NULL,
    "heurePrise" text NOT NULL,
    frequence text NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "prochaineEnvoi" timestamp(3) without time zone
);


ALTER TABLE public.rappel_medicament OWNER TO smart_sante_db_user;

--
-- Name: rendez_vous; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.rendez_vous (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "medecinId" text NOT NULL,
    "creneauId" text,
    "dateHeure" timestamp(3) without time zone NOT NULL,
    statut public."StatutRendezVous" DEFAULT 'EN_ATTENTE'::public."StatutRendezVous" NOT NULL,
    motif text
);


ALTER TABLE public.rendez_vous OWNER TO smart_sante_db_user;

--
-- Name: utilisateur; Type: TABLE; Schema: public; Owner: smart_sante_db_user
--

CREATE TABLE public.utilisateur (
    id text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    email text,
    telephone text NOT NULL,
    "motDePasseHash" text,
    role public."RoleUtilisateur" NOT NULL,
    statut public."StatutCompte" DEFAULT 'ACTIF'::public."StatutCompte" NOT NULL,
    "otpCode" text,
    "otpExpiration" timestamp(3) without time zone,
    "dateCreation" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dateMiseAJour" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.utilisateur OWNER TO smart_sante_db_user;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
5f182543-626d-4f75-8958-2b0638483421	af00bf2c3701257115f3a12aa3f9cb0a4413dd63512c818940263701e1a9224e	2026-06-25 10:38:45.171393+00	20260620111831_init	\N	\N	2026-06-25 10:38:43.462838+00	1
\.


--
-- Data for Name: administrateur; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.administrateur (id, "niveauAcces") FROM stdin;
4a885810-3e2c-4e71-a07d-fe48333c437b	1
\.


--
-- Data for Name: alerte_epidemiologique; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.alerte_epidemiologique (id, zone, "pathologieId", seuil, "variationPct", "dateDetection", statut) FROM stdin;
\.


--
-- Data for Name: consultation_ia; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.consultation_ia (id, "patientId", "conversationId", symptomes, "preDiagnostic", "niveauUrgence", "scoreConfiance", recommandations, "ficheUrl", "suiviDateRelance", "suiviReponse", "suiviEffectue", "dateConsultation") FROM stdin;
c73a3afc-e723-4ca4-90c8-94adb41522e3	6ebe9c1a-1440-4bd3-a7fd-4d86fdc42aa7	e9dafb35-7ab6-4765-aae0-5a7589fd319a	Bonjour smart santé j'ai mal à la tête depuis hier | Bonjour smart santé j'ai mal à la tête depuis hier | J'ai mal au ventre depuis hier | J'ai mal au ventre depuis hier | J'ai également de la fièvre | J'ai très des boutons sur le visage	Résumé : \n- Pré-diagnostic probable : Dermatose ou infection cutanée\n- Niveau d'urgence : VERT (pharmacie)\n\nIl est recommandé de consulter un pharmacien pour obtenir des conseils et des traitements adaptés à votre situation. Il pourrait vous aider à déterminer la cause exacte de vos symptômes et vous prescrire un traitement approprié. N'oubliez pas de consulter un médecin si les symptômes persistent ou s'aggravent. Prenez soin de vous ! 🏥	VERT	\N	\N	\N	2026-06-28 11:46:23.379	\N	f	2026-06-26 11:46:23.379
\.


--
-- Data for Name: consultation_orientation; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.consultation_orientation ("consultationId", "formationSanitaireId", "distanceKm") FROM stdin;
\.


--
-- Data for Name: consultation_pathologie; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.consultation_pathologie ("consultationId", "pathologieId", probabilite) FROM stdin;
\.


--
-- Data for Name: conversation; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.conversation (id, "patientId", canal, "dateDebut", "dateFin", statut) FROM stdin;
e9dafb35-7ab6-4765-aae0-5a7589fd319a	6ebe9c1a-1440-4bd3-a7fd-4d86fdc42aa7	WHATSAPP	2026-06-25 10:59:52.811	2026-06-26 11:46:23.391	TERMINEE
\.


--
-- Data for Name: creneau; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.creneau (id, "medecinId", "jourSemaine", "heureDebut", "heureFin", disponible) FROM stdin;
cce6fda3-1ce6-42a3-aa0b-3312c8a27438	28f83877-1b1d-4294-aa2d-4f5dd21c6828	LUNDI	09:00	10:00	t
\.


--
-- Data for Name: formation_sanitaire; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.formation_sanitaire (id, nom, type, adresse, region, ville, latitude, longitude, telephone, horaires) FROM stdin;
\.


--
-- Data for Name: medecin; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.medecin (id, specialite, "numeroOrdre", "carteProfessionnelleUrl", "tarifConsultation", "statutCertification", bio, "formationSanitaireId", "valideParId") FROM stdin;
28f83877-1b1d-4294-aa2d-4f5dd21c6828	Médecine générale	ONMC-12234	https://res.cloudinary.com/haayjckq/image/upload/v1783346099/smart-sante/cartes/nwqf5zlzga6c7gvrk8rw.png	0.00	VALIDE	Hopital régional de Bafoussam	\N	4a885810-3e2c-4e71-a07d-fe48333c437b
\.


--
-- Data for Name: message; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.message (id, "conversationId", contenu, expediteur, horodatage) FROM stdin;
301934fc-2bb4-4c20-b16c-7d1909d47990	e9dafb35-7ab6-4765-aae0-5a7589fd319a	Bonjour smart santé j'ai mal à la tête depuis hier	PATIENT	2026-06-25 10:59:52.826
75c8929d-12e5-4ab4-af15-22a42f39906b	e9dafb35-7ab6-4765-aae0-5a7589fd319a	Bonjour smart santé j'ai mal à la tête depuis hier	PATIENT	2026-06-26 02:02:39.22
f59df595-1111-45c7-8d42-4c610600b246	e9dafb35-7ab6-4765-aae0-5a7589fd319a	Je rencontre une difficulté technique. Veuillez réessayer dans quelques instants. 🏥	IA	2026-06-26 02:02:39.561
7a817422-f241-4fcd-8853-324ed462ec65	e9dafb35-7ab6-4765-aae0-5a7589fd319a	J'ai mal au ventre depuis hier	PATIENT	2026-06-26 02:23:13.292
fcd48dc2-964a-45bf-9828-73c4c2a2f931	e9dafb35-7ab6-4765-aae0-5a7589fd319a	Je rencontre une difficulté technique. Veuillez réessayer dans quelques instants. 🏥	IA	2026-06-26 02:23:13.729
646a04b2-8995-4d9d-958d-3e55c7bbbaa7	e9dafb35-7ab6-4765-aae0-5a7589fd319a	J'ai mal au ventre depuis hier	PATIENT	2026-06-26 02:36:41.33
bc26e5e0-a39e-45d8-83eb-4cbcbfce484f	e9dafb35-7ab6-4765-aae0-5a7589fd319a	Avez-vous également de la fièvre ou des diarrhées ? ⚠️ Je ne suis pas un médecin. Consultez un professionnel.	IA	2026-06-26 02:36:41.638
aab92005-09e2-4336-9f48-43d75b2fc3b1	e9dafb35-7ab6-4765-aae0-5a7589fd319a	J'ai également de la fièvre	PATIENT	2026-06-26 02:39:33.729
48ff03a8-08f8-4225-b3ca-3cb27502ab84	e9dafb35-7ab6-4765-aae0-5a7589fd319a	Avez-vous récemment bu de l'eau non potable ou mangé quelque chose qui pourrait avoir provoqué une infection ? ⚠️	IA	2026-06-26 02:39:34.201
9cf3e1bf-7266-43db-bf43-09bcd0c0ca24	e9dafb35-7ab6-4765-aae0-5a7589fd319a	J'ai très des boutons sur le visage	PATIENT	2026-06-26 11:45:20.753
8021e2c8-7303-446d-b09e-cbe4d127fa59	e9dafb35-7ab6-4765-aae0-5a7589fd319a	Ces boutons sont-ils accompagnés de démangeaisons ou de douleur ? ⚠️	IA	2026-06-26 11:45:21.08
da54cbbc-a5a4-427d-9467-d1e5bc1d5f55	e9dafb35-7ab6-4765-aae0-5a7589fd319a	Ces boutons démange parfois lorsque je touche mais c'est blanc	PATIENT	2026-06-26 11:46:22.852
92356c94-083a-44a0-81f1-8f58784aa838	e9dafb35-7ab6-4765-aae0-5a7589fd319a	Résumé : \n- Pré-diagnostic probable : Dermatose ou infection cutanée\n- Niveau d'urgence : VERT (pharmacie)\n\nIl est recommandé de consulter un pharmacien pour obtenir des conseils et des traitements adaptés à votre situation. Il pourrait vous aider à déterminer la cause exacte de vos symptômes et vous prescrire un traitement approprié. N'oubliez pas de consulter un médecin si les symptômes persistent ou s'aggravent. Prenez soin de vous ! 🏥	IA	2026-06-26 11:46:23.374
\.


--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.notification (id, "utilisateurId", type, titre, message, lue, "dateEnvoi") FROM stdin;
\.


--
-- Data for Name: ordonnance; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.ordonnance (id, "patientId", "medecinId", "rendezVousId", contenu, "dateEmission", "envoyeeWhatsApp", "cheminFichier") FROM stdin;
\.


--
-- Data for Name: pathologie; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.pathologie (id, nom, code, categorie, description) FROM stdin;
\.


--
-- Data for Name: patient; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.patient (id, localisation, region, ville, langue, "groupeSanguin", antecedents, allergies) FROM stdin;
6ebe9c1a-1440-4bd3-a7fd-4d86fdc42aa7	Bafoussam	\N	Bafoussam	FR	\N	Âge déclaré : Bonjour smart santé j'ai mal à la tête depuis hier	\N
\.


--
-- Data for Name: rappel_medicament; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.rappel_medicament (id, "patientId", medicament, "heurePrise", frequence, actif, "prochaineEnvoi") FROM stdin;
\.


--
-- Data for Name: rendez_vous; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.rendez_vous (id, "patientId", "medecinId", "creneauId", "dateHeure", statut, motif) FROM stdin;
\.


--
-- Data for Name: utilisateur; Type: TABLE DATA; Schema: public; Owner: smart_sante_db_user
--

COPY public.utilisateur (id, nom, prenom, email, telephone, "motDePasseHash", role, statut, "otpCode", "otpExpiration", "dateCreation", "dateMiseAJour") FROM stdin;
4a885810-3e2c-4e71-a07d-fe48333c437b	Admin	Stephanie	SmartSanteCameroun237@gmail.com	+237683641781	$2b$12$ux/gDkJQuR.LeNGzVcaL2.eM0CpNP0ef98svYlTqFP5WV32AxDnpy	ADMIN	ACTIF	\N	\N	2026-06-25 10:38:55.603	2026-06-25 10:38:55.603
6ebe9c1a-1440-4bd3-a7fd-4d86fdc42aa7	MAFFO	Laure	\N	+237697430836	$2b$12$OHyOLvyTnpsuT/OzdiL95uFuokiQ9Z9bcMtdTs7CftwB81tcysP0m	PATIENT	ACTIF	\N	\N	2026-06-25 10:57:06.621	2026-06-26 11:43:20.28
28f83877-1b1d-4294-aa2d-4f5dd21c6828	MOIFO	Laure	laurestephanie412@gmail.com	+237677752165	$2b$12$.Egx5Il2AKPXfL1FOw.3Eed1IKqz/yDHhlm1y6uk0/g.E6W5OHRqy	MEDECIN	ACTIF	\N	\N	2026-07-06 14:01:15.137	2026-07-06 14:16:13.251
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: administrateur administrateur_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.administrateur
    ADD CONSTRAINT administrateur_pkey PRIMARY KEY (id);


--
-- Name: alerte_epidemiologique alerte_epidemiologique_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.alerte_epidemiologique
    ADD CONSTRAINT alerte_epidemiologique_pkey PRIMARY KEY (id);


--
-- Name: consultation_ia consultation_ia_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.consultation_ia
    ADD CONSTRAINT consultation_ia_pkey PRIMARY KEY (id);


--
-- Name: consultation_orientation consultation_orientation_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.consultation_orientation
    ADD CONSTRAINT consultation_orientation_pkey PRIMARY KEY ("consultationId", "formationSanitaireId");


--
-- Name: consultation_pathologie consultation_pathologie_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.consultation_pathologie
    ADD CONSTRAINT consultation_pathologie_pkey PRIMARY KEY ("consultationId", "pathologieId");


--
-- Name: conversation conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT conversation_pkey PRIMARY KEY (id);


--
-- Name: creneau creneau_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.creneau
    ADD CONSTRAINT creneau_pkey PRIMARY KEY (id);


--
-- Name: formation_sanitaire formation_sanitaire_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.formation_sanitaire
    ADD CONSTRAINT formation_sanitaire_pkey PRIMARY KEY (id);


--
-- Name: medecin medecin_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.medecin
    ADD CONSTRAINT medecin_pkey PRIMARY KEY (id);


--
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- Name: ordonnance ordonnance_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.ordonnance
    ADD CONSTRAINT ordonnance_pkey PRIMARY KEY (id);


--
-- Name: pathologie pathologie_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.pathologie
    ADD CONSTRAINT pathologie_pkey PRIMARY KEY (id);


--
-- Name: patient patient_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.patient
    ADD CONSTRAINT patient_pkey PRIMARY KEY (id);


--
-- Name: rappel_medicament rappel_medicament_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.rappel_medicament
    ADD CONSTRAINT rappel_medicament_pkey PRIMARY KEY (id);


--
-- Name: rendez_vous rendez_vous_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_pkey PRIMARY KEY (id);


--
-- Name: utilisateur utilisateur_pkey; Type: CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id);


--
-- Name: alerte_epidemiologique_zone_statut_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX alerte_epidemiologique_zone_statut_idx ON public.alerte_epidemiologique USING btree (zone, statut);


--
-- Name: consultation_ia_niveauUrgence_dateConsultation_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX "consultation_ia_niveauUrgence_dateConsultation_idx" ON public.consultation_ia USING btree ("niveauUrgence", "dateConsultation");


--
-- Name: consultation_ia_patientId_dateConsultation_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX "consultation_ia_patientId_dateConsultation_idx" ON public.consultation_ia USING btree ("patientId", "dateConsultation");


--
-- Name: conversation_patientId_statut_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX "conversation_patientId_statut_idx" ON public.conversation USING btree ("patientId", statut);


--
-- Name: creneau_medecinId_jourSemaine_disponible_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX "creneau_medecinId_jourSemaine_disponible_idx" ON public.creneau USING btree ("medecinId", "jourSemaine", disponible);


--
-- Name: formation_sanitaire_region_ville_type_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX formation_sanitaire_region_ville_type_idx ON public.formation_sanitaire USING btree (region, ville, type);


--
-- Name: medecin_numeroOrdre_key; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE UNIQUE INDEX "medecin_numeroOrdre_key" ON public.medecin USING btree ("numeroOrdre");


--
-- Name: medecin_specialite_statutCertification_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX "medecin_specialite_statutCertification_idx" ON public.medecin USING btree (specialite, "statutCertification");


--
-- Name: message_conversationId_horodatage_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX "message_conversationId_horodatage_idx" ON public.message USING btree ("conversationId", horodatage);


--
-- Name: notification_utilisateurId_lue_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX "notification_utilisateurId_lue_idx" ON public.notification USING btree ("utilisateurId", lue);


--
-- Name: ordonnance_patientId_dateEmission_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX "ordonnance_patientId_dateEmission_idx" ON public.ordonnance USING btree ("patientId", "dateEmission");


--
-- Name: pathologie_code_key; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE UNIQUE INDEX pathologie_code_key ON public.pathologie USING btree (code);


--
-- Name: pathologie_nom_key; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE UNIQUE INDEX pathologie_nom_key ON public.pathologie USING btree (nom);


--
-- Name: patient_region_ville_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX patient_region_ville_idx ON public.patient USING btree (region, ville);


--
-- Name: rappel_medicament_actif_prochaineEnvoi_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX "rappel_medicament_actif_prochaineEnvoi_idx" ON public.rappel_medicament USING btree (actif, "prochaineEnvoi");


--
-- Name: rendez_vous_medecinId_dateHeure_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX "rendez_vous_medecinId_dateHeure_idx" ON public.rendez_vous USING btree ("medecinId", "dateHeure");


--
-- Name: rendez_vous_patientId_statut_idx; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE INDEX "rendez_vous_patientId_statut_idx" ON public.rendez_vous USING btree ("patientId", statut);


--
-- Name: utilisateur_email_key; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE UNIQUE INDEX utilisateur_email_key ON public.utilisateur USING btree (email);


--
-- Name: utilisateur_telephone_key; Type: INDEX; Schema: public; Owner: smart_sante_db_user
--

CREATE UNIQUE INDEX utilisateur_telephone_key ON public.utilisateur USING btree (telephone);


--
-- Name: administrateur administrateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.administrateur
    ADD CONSTRAINT administrateur_id_fkey FOREIGN KEY (id) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alerte_epidemiologique alerte_epidemiologique_pathologieId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.alerte_epidemiologique
    ADD CONSTRAINT "alerte_epidemiologique_pathologieId_fkey" FOREIGN KEY ("pathologieId") REFERENCES public.pathologie(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consultation_ia consultation_ia_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.consultation_ia
    ADD CONSTRAINT "consultation_ia_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public.conversation(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: consultation_ia consultation_ia_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.consultation_ia
    ADD CONSTRAINT "consultation_ia_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patient(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consultation_orientation consultation_orientation_consultationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.consultation_orientation
    ADD CONSTRAINT "consultation_orientation_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES public.consultation_ia(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consultation_orientation consultation_orientation_formationSanitaireId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.consultation_orientation
    ADD CONSTRAINT "consultation_orientation_formationSanitaireId_fkey" FOREIGN KEY ("formationSanitaireId") REFERENCES public.formation_sanitaire(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consultation_pathologie consultation_pathologie_consultationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.consultation_pathologie
    ADD CONSTRAINT "consultation_pathologie_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES public.consultation_ia(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consultation_pathologie consultation_pathologie_pathologieId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.consultation_pathologie
    ADD CONSTRAINT "consultation_pathologie_pathologieId_fkey" FOREIGN KEY ("pathologieId") REFERENCES public.pathologie(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation conversation_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.conversation
    ADD CONSTRAINT "conversation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patient(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: creneau creneau_medecinId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.creneau
    ADD CONSTRAINT "creneau_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES public.medecin(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: medecin medecin_formationSanitaireId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.medecin
    ADD CONSTRAINT "medecin_formationSanitaireId_fkey" FOREIGN KEY ("formationSanitaireId") REFERENCES public.formation_sanitaire(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: medecin medecin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.medecin
    ADD CONSTRAINT medecin_id_fkey FOREIGN KEY (id) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: medecin medecin_valideParId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.medecin
    ADD CONSTRAINT "medecin_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES public.administrateur(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: message message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public.conversation(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification notification_utilisateurId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT "notification_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ordonnance ordonnance_medecinId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.ordonnance
    ADD CONSTRAINT "ordonnance_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES public.medecin(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ordonnance ordonnance_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.ordonnance
    ADD CONSTRAINT "ordonnance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patient(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ordonnance ordonnance_rendezVousId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.ordonnance
    ADD CONSTRAINT "ordonnance_rendezVousId_fkey" FOREIGN KEY ("rendezVousId") REFERENCES public.rendez_vous(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.patient
    ADD CONSTRAINT patient_id_fkey FOREIGN KEY (id) REFERENCES public.utilisateur(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rappel_medicament rappel_medicament_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.rappel_medicament
    ADD CONSTRAINT "rappel_medicament_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patient(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rendez_vous rendez_vous_creneauId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT "rendez_vous_creneauId_fkey" FOREIGN KEY ("creneauId") REFERENCES public.creneau(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: rendez_vous rendez_vous_medecinId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT "rendez_vous_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES public.medecin(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rendez_vous rendez_vous_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smart_sante_db_user
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT "rendez_vous_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public.patient(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: smart_sante_db_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO smart_sante_db_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO smart_sante_db_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO smart_sante_db_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO smart_sante_db_user;


--
-- PostgreSQL database dump complete
--

\unrestrict Q73xOBTT5P4dICEoc7yma2PXNkiGuGIwW4barFWVMDdFkKQImRSGtLqDdHpbWLc

