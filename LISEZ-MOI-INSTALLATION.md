# CATECHESENDI — Nouvelle installation chez un hébergeur (PHP + PostgreSQL)

> Ce paquet sert à une **première mise en ligne** (base de données vide). Pour un site déjà en service, utilisez le paquet de mise à jour : n'exécutez jamais `schema.sql` sur une base qui contient déjà des données : utilisez `install/mise-a-jour.sql`.

Site officiel et application de gestion de la catéchèse de la paroisse Notre-Dame de l'Incarnation, Riviera Palmeraie (Abidjan).

**Ce paquet ne contient aucune donnée** : ni catéchumène, ni animateur, ni historique importé. La base est créée vide ; seuls existent l'année 2026-2027 (ouverte) et le compte SUPERADMIN par défaut.

---

## 1. Ce qu'il faut chez l'hébergeur

| Élément | Minimum |
|---|---|
| PHP | 7.4 ou plus récent (8.x recommandé), extensions **pdo_pgsql** et **mbstring** (intl conseillée) |
| Base de données | **PostgreSQL 11 ou plus récent**, avec un outil d'administration : **phpPgAdmin** (cPanel), **pgAdmin** ou la ligne de commande **psql** |
| Serveur web | Apache (fichiers `.htaccess` fournis) ou LiteSpeed |
| HTTPS | Fortement recommandé (certificat SSL gratuit Let's Encrypt chez la plupart des hébergeurs) |

## 2. Contenu du dossier

```
catechesendi/
├── index.html                    Accueil du site
├── inscription.html              Page « Inscription »
├── connexion.html                Connexion de l'équipe catéchèse
├── gestion.html                  Application de gestion (connexion obligatoire)
├── preinscription.html           Pré-inscription nouveau (elle)          ┐
├── preinscription-ancien.html    Pré-inscription des anciens             │ pages publiques
├── inscription-animateur.html    Inscription nouvel(le) animateur(trice) │
├── reinscription-animateur.html  Ré-inscription des animateurs           │
├── resultat.html                 Consultation du résultat de fin d'année ┘
├── assets/kt-api.js              Liaison entre les pages et la base de données
├── assets/kt-site.js             Textes du site et état des résultats (pages du site)
├── api/                          Serveur PHP (connexion, lecture, enregistrement)
│   ├── config.php                ← À RENSEIGNER (accès à la base PostgreSQL)
│   └── …
├── install/schema.sql            Création des tables (première installation uniquement)
└── install/mise-a-jour.sql       Mise à jour sans risque (crée seulement les tables manquantes)
```

## 3. Installation pas à pas

1. **Créer la base de données** — dans le panneau de l'hébergeur (cPanel › *Bases de données PostgreSQL*, ou l'espace client) :
   créez une base (ex. `catechesendi`, encodage **UTF8**), un utilisateur PostgreSQL avec un mot de passe solide, et donnez-lui **tous les privilèges** sur la base (idéalement, faites-en le propriétaire).
2. **Créer les tables** — exécutez le fichier `install/schema.sql` dans la base :
   - **phpPgAdmin** : sélectionnez la base › onglet **SQL** › choisissez le fichier `schema.sql` › **Exécuter** ;
   - **pgAdmin** : clic droit sur la base › **Query Tool** › ouvrez `schema.sql` › exécuter (F5) ;
   - **psql** : `psql -h HOTE -U UTILISATEUR -d catechesendi -f install/schema.sql`
   Vous obtenez 18 tables : `inscription`, `preinscription`, `historique_inscription`, `historique_preinscription`, `animateur`, `formation_continue`, `bureau_membre`, `sacrement`, `compilation`, `resultat`, `correction_identite`, `attestation_catechumene`, `attestation_animateur`, `annee_catechetique`, `archivage`, `historique_operation`, `utilisateur`, `parametres`.
3. **Renseigner la connexion** — ouvrez `api/config.php` et remplacez l'hôte, le port (5432 par défaut), le nom de la base, l'utilisateur et le mot de passe PostgreSQL. Chez certains hébergeurs, l'hôte n'est pas `localhost` mais une adresse fournie dans l'espace client.
4. **Envoyer les fichiers** — par le *Gestionnaire de fichiers* de l'hébergeur ou par FTP (FileZilla), copiez **tout le contenu** du dossier `catechesendi/` dans `public_html/` (ou dans un sous-dossier, par exemple `public_html/catechese/`). Pensez aux fichiers cachés `.htaccess`.
5. **Supprimer le dossier `install/`** du serveur une fois la base créée (il est déjà protégé, mais il n'est plus utile).
6. **Première connexion** — ouvrez `https://votre-domaine/connexion.html` :
   - Login : **SUPERADMIN**
   - Mot de passe : **Ndi@2026**

   ⚠️ Changez ce mot de passe tout de suite (bouton « Changer mon mot de passe » en haut de l'application), puis créez les comptes de l'équipe dans *Administration › Création des comptes utilisateurs*.
7. **Reprendre l'historique** — dans *Administration › Importation Excel*, importez vos fichiers Excel : historique des inscriptions, animateurs, puis **sacrements** (baptêmes et confirmations ; un modèle Excel vide est téléchargeable pour chaque table). Les données vont directement dans la base PostgreSQL ; l'indicateur « Enregistrement… / ✔ Enregistré » en bas à gauche montre l'avancement (un gros fichier peut prendre une à deux minutes).
8. **Vérifier** — dans phpPgAdmin ou pgAdmin, les tables se remplissent au fur et à mesure des saisies.

## 4. Comment les données sont rangées

- Chaque table a des **colonnes lisibles** (matricule, année, nom, prénoms, date et lieu de naissance, catégorie, niveau, décision, contact…) pour consulter, trier et filtrer dans phpPgAdmin ou pgAdmin, et une colonne **`data`** qui contient la fiche complète au format JSON. **Ne modifiez pas la colonne `data` à la main** : utilisez plutôt *Administration › Modification des données* dans l'application (chaque modification y est tracée dans l'historique des opérations).
- Les mots de passe sont **chiffrés** (colonne `mot_de_passe_hash`) ; ils ne sont jamais renvoyés aux navigateurs.
- La table `parametres` contient la configuration (paiement, professions, compteurs de matricules), l'année en cours et les textes du site.
- Les **matricules** sont attribués par le serveur : deux personnes qui s'inscrivent en même temps ne peuvent pas recevoir le même numéro.

## 5. Sécurité et confidentialité

- L'application de gestion et toutes les données ne sont accessibles **qu'après connexion** ; les droits (SuperAdmin, Admin, Responsables, Opérateurs) sont contrôlés aussi par le serveur pour les actions sensibles (comptes utilisateurs, paramètres).
- Les pages publiques ne téléchargent **jamais la base** : une recherche (ancien, animateur, résultat) ne renvoie que la fiche qui correspond exactement au matricule, ou au nom + prénoms + date de naissance saisis.
- Un visiteur du site peut seulement **ajouter** une pré-inscription, une inscription en ligne ou une inscription d'animateur : il ne peut ni modifier ni supprimer quoi que ce soit.

## 6. Sauvegardes

Faites une sauvegarde régulière (au moins une fois par semaine, et avant chaque archivage) :
phpPgAdmin › base › **Exporter** (format SQL), pgAdmin › clic droit sur la base › **Backup**, ou en ligne de commande : `pg_dump -h HOTE -U UTILISATEUR catechesendi > sauvegarde.sql`. Conservez les fichiers en lieu sûr.

## 7. En cas de problème

| Symptôme | Cause probable |
|---|---|
| « Connexion à la base impossible » | Informations incorrectes dans `api/config.php` (hôte, port 5432, base, utilisateur, mot de passe), extension **pdo_pgsql** non activée dans PHP, ou utilisateur PostgreSQL sans droits sur les tables |
| Retour permanent à la page de connexion | Cookies bloqués par le navigateur, ou site ouvert en `http://` puis `https://` : utilisez toujours la même adresse |
| « ⚠ Non enregistré » en bas à gauche | Connexion internet coupée ou session expirée : l'application réessaie automatiquement ; si cela persiste, reconnectez-vous |
| Pages sans mise en forme / erreur 500 | Version de PHP trop ancienne : choisissez PHP 8.x dans le panneau de l'hébergeur |
