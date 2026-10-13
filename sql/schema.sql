-- CATECHESENDI : base de données PostgreSQL (version 11 ou plus)
-- Exécuté par « npm run init-db » (ou à la main avec psql / pgAdmin) dans une base VIDE.
-- Aucune donnée personnelle : seules les tables vides, l'année en cours et le compte SUPERADMIN par défaut.
SET client_encoding = 'UTF8';

DROP TABLE IF EXISTS inscription;
CREATE TABLE inscription (
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
COMMENT ON TABLE inscription IS 'Inscriptions de l''année (catéchumènes)';
CREATE INDEX ix_inscription_matricule ON inscription ("matricule");
CREATE INDEX ix_inscription_code ON inscription ("code");
CREATE INDEX ix_inscription_annee ON inscription ("annee");
CREATE INDEX ix_inscription_nom ON inscription ("nom");
CREATE INDEX ix_inscription_date_naissance ON inscription ("date_naissance");
CREATE INDEX ix_inscription_contact1 ON inscription ("contact1");

DROP TABLE IF EXISTS preinscription;
CREATE TABLE preinscription (
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
COMMENT ON TABLE preinscription IS 'Pré-inscriptions en cours';
CREATE INDEX ix_preinscription_matricule ON preinscription ("matricule");
CREATE INDEX ix_preinscription_code ON preinscription ("code");
CREATE INDEX ix_preinscription_annee ON preinscription ("annee");
CREATE INDEX ix_preinscription_nom ON preinscription ("nom");
CREATE INDEX ix_preinscription_date_naissance ON preinscription ("date_naissance");
CREATE INDEX ix_preinscription_contact1 ON preinscription ("contact1");

DROP TABLE IF EXISTS historique_inscription;
CREATE TABLE historique_inscription (
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
COMMENT ON TABLE historique_inscription IS 'Historique des inscriptions (archives)';
CREATE INDEX ix_historique_inscription_matricule ON historique_inscription ("matricule");
CREATE INDEX ix_historique_inscription_code ON historique_inscription ("code");
CREATE INDEX ix_historique_inscription_annee ON historique_inscription ("annee");
CREATE INDEX ix_historique_inscription_nom ON historique_inscription ("nom");
CREATE INDEX ix_historique_inscription_date_naissance ON historique_inscription ("date_naissance");
CREATE INDEX ix_historique_inscription_contact1 ON historique_inscription ("contact1");

DROP TABLE IF EXISTS historique_preinscription;
CREATE TABLE historique_preinscription (
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
COMMENT ON TABLE historique_preinscription IS 'Historique des pré-inscriptions (archives)';
CREATE INDEX ix_historique_preinscription_matricule ON historique_preinscription ("matricule");
CREATE INDEX ix_historique_preinscription_code ON historique_preinscription ("code");
CREATE INDEX ix_historique_preinscription_annee ON historique_preinscription ("annee");
CREATE INDEX ix_historique_preinscription_nom ON historique_preinscription ("nom");
CREATE INDEX ix_historique_preinscription_date_naissance ON historique_preinscription ("date_naissance");
CREATE INDEX ix_historique_preinscription_contact1 ON historique_preinscription ("contact1");

DROP TABLE IF EXISTS animateur;
CREATE TABLE animateur (
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
COMMENT ON TABLE animateur IS 'Animateurs (table unique, toutes années)';
CREATE INDEX ix_animateur_code ON animateur ("code");
CREATE INDEX ix_animateur_annee ON animateur ("annee");
CREATE INDEX ix_animateur_nom ON animateur ("nom");
CREATE INDEX ix_animateur_contact1 ON animateur ("contact1");

DROP TABLE IF EXISTS formation_continue;
CREATE TABLE formation_continue (
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
COMMENT ON TABLE formation_continue IS 'Inscrits de la formation continue';
CREATE INDEX ix_formation_continue_annee ON formation_continue ("annee");
CREATE INDEX ix_formation_continue_nom ON formation_continue ("nom");
CREATE INDEX ix_formation_continue_contact1 ON formation_continue ("contact1");

DROP TABLE IF EXISTS bureau_membre;
CREATE TABLE bureau_membre (
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
COMMENT ON TABLE bureau_membre IS 'Membres des bureaux de la catéchèse';
CREATE INDEX ix_bureau_membre_annee ON bureau_membre ("annee");
CREATE INDEX ix_bureau_membre_nom ON bureau_membre ("nom");
CREATE INDEX ix_bureau_membre_contact1 ON bureau_membre ("contact1");

DROP TABLE IF EXISTS sacrement;
CREATE TABLE sacrement (
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
COMMENT ON TABLE sacrement IS 'Sacrements : baptêmes et confirmations';
CREATE INDEX ix_sacrement_matricule ON sacrement ("matricule");
CREATE INDEX ix_sacrement_nom ON sacrement ("nom");

DROP TABLE IF EXISTS compilation;
CREATE TABLE compilation (
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
COMMENT ON TABLE compilation IS 'Compilations des résultats (par année et catégorie)';
CREATE INDEX ix_compilation_annee ON compilation ("annee");

DROP TABLE IF EXISTS resultat;
CREATE TABLE resultat (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "annee" VARCHAR(255) NULL,
  "matricule" VARCHAR(255) NULL,
  "resultat" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE resultat IS 'Résultats de fin d''année';
CREATE INDEX ix_resultat_annee ON resultat ("annee");
CREATE INDEX ix_resultat_matricule ON resultat ("matricule");

DROP TABLE IF EXISTS correction_identite;
CREATE TABLE correction_identite (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "nom" VARCHAR(255) NULL,
  "prenoms" VARCHAR(255) NULL,
  "date_naissance" VARCHAR(255) NULL,
  "lieu_naissance" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE correction_identite IS 'Corrections d''identité des anciens';
CREATE INDEX ix_correction_identite_nom ON correction_identite ("nom");
CREATE INDEX ix_correction_identite_date_naissance ON correction_identite ("date_naissance");

DROP TABLE IF EXISTS attestation_catechumene;
CREATE TABLE attestation_catechumene (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "matricule" VARCHAR(255) NULL,
  "numero" VARCHAR(255) NULL,
  "date_edition" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE attestation_catechumene IS 'Attestations de sortie catéchumènes';
CREATE INDEX ix_attestation_catechumene_matricule ON attestation_catechumene ("matricule");

DROP TABLE IF EXISTS attestation_animateur;
CREATE TABLE attestation_animateur (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "matricule" VARCHAR(255) NULL,
  "numero" VARCHAR(255) NULL,
  "date_edition" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE attestation_animateur IS 'Attestations de sortie animateurs';
CREATE INDEX ix_attestation_animateur_matricule ON attestation_animateur ("matricule");

DROP TABLE IF EXISTS annee_catechetique;
CREATE TABLE annee_catechetique (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "statut" VARCHAR(255) NULL,
  "ouverture" VARCHAR(255) NULL,
  "fermeture" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE annee_catechetique IS 'Années catéchétiques';

DROP TABLE IF EXISTS archivage;
CREATE TABLE archivage (
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
COMMENT ON TABLE archivage IS 'Archivages effectués';
CREATE INDEX ix_archivage_annee ON archivage ("annee");

DROP TABLE IF EXISTS historique_operation;
CREATE TABLE historique_operation (
  id VARCHAR(120) PRIMARY KEY,
  seq BIGSERIAL NOT NULL UNIQUE,
  "date_op" VARCHAR(255) NULL,
  "profil" VARCHAR(255) NULL,
  "action" TEXT NULL,
  "matricule" VARCHAR(255) NULL,
  data TEXT NOT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE historique_operation IS 'Historique des opérations';
CREATE INDEX ix_historique_operation_matricule ON historique_operation ("matricule");

DROP TABLE IF EXISTS utilisateur;
CREATE TABLE utilisateur (
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
COMMENT ON TABLE utilisateur IS 'Comptes utilisateurs (id = login)';
CREATE INDEX ix_utilisateur_nom ON utilisateur ("nom");

DROP TABLE IF EXISTS parametres;
CREATE TABLE parametres (
  cle VARCHAR(60) PRIMARY KEY,
  valeur TEXT NULL,
  maj TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE parametres IS 'Paramètres de l''application (configuration, année en cours, textes du site)';

-- Compte par défaut : login SUPERADMIN, mot de passe Ndi@2026 (à changer dès la première connexion)
INSERT INTO utilisateur (id,nom,groupe,categorie,niveau,actif,doit_changer,mot_de_passe_hash,data) VALUES ('SUPERADMIN','Super administrateur','SuperAdmin','','','1','1','$2b$10$LQKzKbP8TX//db4n63T8YOJ2RXyeNv8LUsFmcPrvDP877hlG2GL5y','{"login": "SUPERADMIN", "nom": "Super administrateur", "groupe": "SuperAdmin", "cat": "", "niv": "", "actif": true, "chg": true, "defaut": 1}');
INSERT INTO annee_catechetique (id,statut,ouverture,fermeture,data) VALUES ('2026-2027','ouverte','','','{"id": "2026-2027", "st": "ouverte", "ouv": "", "fer": ""}');
INSERT INTO parametres (cle,valeur) VALUES ('cur','{"v":"2026-2027"}');
