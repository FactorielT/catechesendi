-- CATECHESENDI (PostgreSQL) : mise à jour sans risque, ne supprime rien et ne modifie aucune donnée
-- CATECHESENDI : base de données PostgreSQL (version 11 ou plus)
-- À exécuter dans la base vide créée chez l'hébergeur (pgAdmin, phpPgAdmin ou psql).
-- Aucune donnée personnelle : seules les tables vides, l'année en cours et le compte SUPERADMIN par défaut.
SET client_encoding = 'UTF8';

CREATE TABLE IF NOT EXISTS inscription (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "matricule" VARCHAR(255) NULL,
  "code" VARCHAR(255) NULL,
  "annee" VARCHAR(255) NULL,
  "statut" VARCHAR(255) NULL,
  "civilite" VARCHAR(255) NULL,
  "nom" VARCHAR(255) NULL,
  "prenoms" VARCHAR(255) NULL,
  "date_naissance" VARCHAR(255) NULL,
  "lieu_naissance" VARCHAR(255) NULL,
  "categorie" VARCHAR(255) NULL,
  "niveau" VARCHAR(255) NULL,
  "decision" VARCHAR(255) NULL,
  "contact1" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_inscription_matricule ON inscription ("matricule");
CREATE INDEX IF NOT EXISTS ix_inscription_code ON inscription ("code");
CREATE INDEX IF NOT EXISTS ix_inscription_annee ON inscription ("annee");
CREATE INDEX IF NOT EXISTS ix_inscription_nom ON inscription ("nom");
CREATE INDEX IF NOT EXISTS ix_inscription_date_naissance ON inscription ("date_naissance");
CREATE INDEX IF NOT EXISTS ix_inscription_contact1 ON inscription ("contact1");

CREATE TABLE IF NOT EXISTS preinscription (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "matricule" VARCHAR(255) NULL,
  "code" VARCHAR(255) NULL,
  "annee" VARCHAR(255) NULL,
  "statut" VARCHAR(255) NULL,
  "civilite" VARCHAR(255) NULL,
  "nom" VARCHAR(255) NULL,
  "prenoms" VARCHAR(255) NULL,
  "date_naissance" VARCHAR(255) NULL,
  "lieu_naissance" VARCHAR(255) NULL,
  "categorie" VARCHAR(255) NULL,
  "niveau" VARCHAR(255) NULL,
  "decision" VARCHAR(255) NULL,
  "contact1" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_preinscription_matricule ON preinscription ("matricule");
CREATE INDEX IF NOT EXISTS ix_preinscription_code ON preinscription ("code");
CREATE INDEX IF NOT EXISTS ix_preinscription_annee ON preinscription ("annee");
CREATE INDEX IF NOT EXISTS ix_preinscription_nom ON preinscription ("nom");
CREATE INDEX IF NOT EXISTS ix_preinscription_date_naissance ON preinscription ("date_naissance");
CREATE INDEX IF NOT EXISTS ix_preinscription_contact1 ON preinscription ("contact1");

CREATE TABLE IF NOT EXISTS historique_inscription (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "matricule" VARCHAR(255) NULL,
  "code" VARCHAR(255) NULL,
  "annee" VARCHAR(255) NULL,
  "statut" VARCHAR(255) NULL,
  "civilite" VARCHAR(255) NULL,
  "nom" VARCHAR(255) NULL,
  "prenoms" VARCHAR(255) NULL,
  "date_naissance" VARCHAR(255) NULL,
  "lieu_naissance" VARCHAR(255) NULL,
  "categorie" VARCHAR(255) NULL,
  "niveau" VARCHAR(255) NULL,
  "decision" VARCHAR(255) NULL,
  "contact1" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_historique_inscription_matricule ON historique_inscription ("matricule");
CREATE INDEX IF NOT EXISTS ix_historique_inscription_code ON historique_inscription ("code");
CREATE INDEX IF NOT EXISTS ix_historique_inscription_annee ON historique_inscription ("annee");
CREATE INDEX IF NOT EXISTS ix_historique_inscription_nom ON historique_inscription ("nom");
CREATE INDEX IF NOT EXISTS ix_historique_inscription_date_naissance ON historique_inscription ("date_naissance");
CREATE INDEX IF NOT EXISTS ix_historique_inscription_contact1 ON historique_inscription ("contact1");

CREATE TABLE IF NOT EXISTS historique_preinscription (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "matricule" VARCHAR(255) NULL,
  "code" VARCHAR(255) NULL,
  "annee" VARCHAR(255) NULL,
  "statut" VARCHAR(255) NULL,
  "civilite" VARCHAR(255) NULL,
  "nom" VARCHAR(255) NULL,
  "prenoms" VARCHAR(255) NULL,
  "date_naissance" VARCHAR(255) NULL,
  "lieu_naissance" VARCHAR(255) NULL,
  "categorie" VARCHAR(255) NULL,
  "niveau" VARCHAR(255) NULL,
  "decision" VARCHAR(255) NULL,
  "contact1" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_historique_preinscription_matricule ON historique_preinscription ("matricule");
CREATE INDEX IF NOT EXISTS ix_historique_preinscription_code ON historique_preinscription ("code");
CREATE INDEX IF NOT EXISTS ix_historique_preinscription_annee ON historique_preinscription ("annee");
CREATE INDEX IF NOT EXISTS ix_historique_preinscription_nom ON historique_preinscription ("nom");
CREATE INDEX IF NOT EXISTS ix_historique_preinscription_date_naissance ON historique_preinscription ("date_naissance");
CREATE INDEX IF NOT EXISTS ix_historique_preinscription_contact1 ON historique_preinscription ("contact1");

CREATE TABLE IF NOT EXISTS animateur (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "code" VARCHAR(255) NULL,
  "annee" VARCHAR(255) NULL,
  "civilite" VARCHAR(255) NULL,
  "nom" VARCHAR(255) NULL,
  "prenoms" VARCHAR(255) NULL,
  "contact1" VARCHAR(255) NULL,
  "categorie" VARCHAR(255) NULL,
  "niveau" VARCHAR(255) NULL,
  "debut_ndi" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_animateur_code ON animateur ("code");
CREATE INDEX IF NOT EXISTS ix_animateur_annee ON animateur ("annee");
CREATE INDEX IF NOT EXISTS ix_animateur_nom ON animateur ("nom");
CREATE INDEX IF NOT EXISTS ix_animateur_contact1 ON animateur ("contact1");

CREATE TABLE IF NOT EXISTS formation_continue (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "annee" VARCHAR(255) NULL,
  "statut" VARCHAR(255) NULL,
  "civilite" VARCHAR(255) NULL,
  "nom" VARCHAR(255) NULL,
  "prenoms" VARCHAR(255) NULL,
  "contact1" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_formation_continue_annee ON formation_continue ("annee");
CREATE INDEX IF NOT EXISTS ix_formation_continue_nom ON formation_continue ("nom");
CREATE INDEX IF NOT EXISTS ix_formation_continue_contact1 ON formation_continue ("contact1");

CREATE TABLE IF NOT EXISTS bureau_membre (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "annee" VARCHAR(255) NULL,
  "bureau" VARCHAR(255) NULL,
  "nom" VARCHAR(255) NULL,
  "contact1" VARCHAR(255) NULL,
  "fonction" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_bureau_membre_annee ON bureau_membre ("annee");
CREATE INDEX IF NOT EXISTS ix_bureau_membre_nom ON bureau_membre ("nom");
CREATE INDEX IF NOT EXISTS ix_bureau_membre_contact1 ON bureau_membre ("contact1");

CREATE TABLE IF NOT EXISTS sacrement (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "matricule" VARCHAR(255) NULL,
  "nom" VARCHAR(255) NULL,
  "prenoms" VARCHAR(255) NULL,
  "num_bapteme" VARCHAR(255) NULL,
  "date_bapteme" VARCHAR(255) NULL,
  "date_confirmation" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_sacrement_matricule ON sacrement ("matricule");
CREATE INDEX IF NOT EXISTS ix_sacrement_nom ON sacrement ("nom");

CREATE TABLE IF NOT EXISTS compilation (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "annee" VARCHAR(255) NULL,
  "categorie" VARCHAR(255) NULL,
  "date_compilation" VARCHAR(255) NULL,
  "par" VARCHAR(255) NULL,
  "effectif" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_compilation_annee ON compilation ("annee");

CREATE TABLE IF NOT EXISTS resultat (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "annee" VARCHAR(255) NULL,
  "matricule" VARCHAR(255) NULL,
  "resultat" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_resultat_annee ON resultat ("annee");
CREATE INDEX IF NOT EXISTS ix_resultat_matricule ON resultat ("matricule");

CREATE TABLE IF NOT EXISTS correction_identite (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "nom" VARCHAR(255) NULL,
  "prenoms" VARCHAR(255) NULL,
  "date_naissance" VARCHAR(255) NULL,
  "lieu_naissance" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_correction_identite_nom ON correction_identite ("nom");
CREATE INDEX IF NOT EXISTS ix_correction_identite_date_naissance ON correction_identite ("date_naissance");

CREATE TABLE IF NOT EXISTS attestation_catechumene (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "matricule" VARCHAR(255) NULL,
  "numero" VARCHAR(255) NULL,
  "date_edition" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_attestation_catechumene_matricule ON attestation_catechumene ("matricule");

CREATE TABLE IF NOT EXISTS attestation_animateur (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "matricule" VARCHAR(255) NULL,
  "numero" VARCHAR(255) NULL,
  "date_edition" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_attestation_animateur_matricule ON attestation_animateur ("matricule");

CREATE TABLE IF NOT EXISTS annee_catechetique (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "statut" VARCHAR(255) NULL,
  "ouverture" VARCHAR(255) NULL,
  "fermeture" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS archivage (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "annee" VARCHAR(255) NULL,
  "table_archivee" VARCHAR(255) NULL,
  "lignes" VARCHAR(255) NULL,
  "date_archivage" VARCHAR(255) NULL,
  "par" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_archivage_annee ON archivage ("annee");

CREATE TABLE IF NOT EXISTS historique_operation (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "date_op" VARCHAR(255) NULL,
  "profil" VARCHAR(255) NULL,
  "action" TEXT NULL,
  "matricule" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_historique_operation_matricule ON historique_operation ("matricule");

CREATE TABLE IF NOT EXISTS utilisateur (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "nom" VARCHAR(255) NULL,
  "groupe" VARCHAR(255) NULL,
  "categorie" VARCHAR(255) NULL,
  "niveau" VARCHAR(255) NULL,
  "actif" VARCHAR(255) NULL,
  "doit_changer" VARCHAR(255) NULL,
  mot_de_passe_hash VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_utilisateur_nom ON utilisateur ("nom");

CREATE TABLE IF NOT EXISTS parametres (
  cle VARCHAR(60) PRIMARY KEY,
  valeur TEXT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

