# CATECHESENDI — Installation et mise en ligne (Node.js + PostgreSQL)

Site officiel et application de gestion de la catéchèse de la paroisse Notre-Dame de l'Incarnation, Riviera Palmeraie (Abidjan).
Tout le projet est en **JavaScript** : les pages (dossier `public/`) et le serveur (**Node.js / Express**, fichier `server.js`), avec une base **PostgreSQL**.

**Aucune donnée n'est incluse** : la base est créée vide, avec seulement l'année 2026-2027 (ouverte) et le compte SUPERADMIN.

---

## 1. Prérequis

| Élément | Version |
|---|---|
| Node.js | **18 ou plus** (20 LTS recommandé) |
| PostgreSQL | **12 ou plus** (base hébergée ou installée sur le serveur) |
| Hébergement | un VPS (Ubuntu), un hébergement cPanel avec « Setup Node.js App », ou une plateforme Node (Render, Railway, etc.) |
| Nom de domaine + HTTPS | recommandé (certificat gratuit Let's Encrypt) |

## 2. Contenu

```
catechesendi-node/
├── server.js                 Serveur : API + envoi des pages
├── tables.js                 Correspondance tables / colonnes
├── package.json              Dépendances et commandes (npm)
├── .env.example              Modèle de configuration → à copier en « .env »
├── ecosystem.config.js       Démarrage permanent avec PM2 (VPS)
├── public/                   Site + application (9 pages HTML, dossier assets/)
├── sql/schema.sql            Création des 18 tables (première installation)
├── sql/mise-a-jour.sql       Mise à jour sans risque (crée seulement les tables manquantes)
├── scripts/init-db.js        Création / mise à jour de la base en une commande
└── deploy/nginx-catechesendi.conf   Exemple de configuration Nginx (VPS)
```

## 3. Créer la base PostgreSQL

Créez une base **vide** en UTF8 et un utilisateur propriétaire de cette base :
- **chez l'hébergeur** : rubrique « Bases de données PostgreSQL » (cPanel) ou base gérée (Render, Neon, Supabase…) : notez l'hôte, le port, le nom de la base, l'utilisateur et le mot de passe ;
- **sur un VPS** :
  ```bash
  sudo -u postgres psql -c "CREATE USER catechesendi WITH PASSWORD 'MotDePasseSolide';"
  sudo -u postgres psql -c "CREATE DATABASE catechesendi OWNER catechesendi ENCODING 'UTF8' TEMPLATE template0;"
  ```

## 4. Installation commune (toutes les méthodes)

1. Copiez le dossier `catechesendi-node/` sur le serveur (FTP, gestionnaire de fichiers ou `scp`).
2. Créez la configuration : copiez `.env.example` en **`.env`** et complétez :
   - `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` : accès à la base ;
   - `PGSSL=true` si la base exige une connexion chiffrée (bases en ligne) ;
   - `SESSION_SECRET` : une longue phrase aléatoire et secrète ;
   - `COOKIE_SECURE=true` et `TRUST_PROXY=true` une fois le site en HTTPS derrière Nginx ou le proxy de l'hébergeur.
3. Installez les dépendances :  `npm install --omit=dev`
4. Créez les tables :  `npm run init-db`
   (la commande refuse de s'exécuter si les tables existent déjà : vos données ne peuvent pas être effacées par erreur).
5. Démarrez :  `npm start`  → le site répond sur le port indiqué (3000 par défaut).

## 5. Mise en ligne selon l'hébergement

### A. VPS Ubuntu (recommandé)
```bash
# Node.js 20 et PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx postgresql
sudo npm install -g pm2
# Application (dans le dossier catechesendi-node)
npm install --omit=dev && npm run init-db
pm2 start ecosystem.config.js && pm2 save && pm2 startup     # redémarrage automatique
# Nginx + HTTPS
sudo cp deploy/nginx-catechesendi.conf /etc/nginx/sites-available/catechesendi   # remplacez le domaine dans le fichier
sudo ln -s /etc/nginx/sites-available/catechesendi /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```
Puis dans `.env` : `COOKIE_SECURE=true`, `TRUST_PROXY=true`, et `pm2 restart catechesendi`.

### B. Hébergement cPanel avec « Setup Node.js App »
1. cPanel › **Setup Node.js App** › *Create Application* : version Node 18/20, mode *Production*, dossier de l'application = dossier où vous avez copié `catechesendi-node`, fichier de démarrage **`server.js`**, URL = votre domaine.
2. Ajoutez les variables d'environnement (mêmes noms que dans `.env`) dans l'écran de l'application, ou déposez le fichier `.env`.
3. Cliquez **Run NPM Install**, puis ouvrez le *Terminal* cPanel (ou « Run JS script ») pour lancer `npm run init-db` une seule fois.
4. **Restart** l'application. Activez le HTTPS (SSL/TLS Status ou AutoSSL) et mettez `COOKIE_SECURE=true`, `TRUST_PROXY=true`.

### C. Plateforme Node (Render, Railway…)
1. Créez une base PostgreSQL gérée, puis un service Web depuis le dossier du projet (dépôt Git privé recommandé, sans le fichier `.env`).
2. Commande de construction : `npm install` · commande de démarrage : `npm start`.
3. Renseignez les variables d'environnement (celles de `.env.example`, avec `PGSSL=true`, `COOKIE_SECURE=true`, `TRUST_PROXY=true`).
4. Lancez une fois `npm run init-db` (onglet *Shell* de la plateforme).

## 6. Première connexion

Ouvrez `https://votre-domaine/connexion.html` :
- Login : **SUPERADMIN** — Mot de passe : **Ndi@2026**
- **Changez immédiatement ce mot de passe**, puis créez les comptes de l'équipe (*Administration › Création des comptes utilisateurs*).
- Reprenez vos données dans *Administration › Importation Excel* : historique des inscriptions, animateurs, sacrements (un modèle Excel vide est téléchargeable pour chaque table). L'indicateur en bas à gauche affiche « Enregistrement… / ✔ Enregistré ».

## 7. Données et sécurité

- Chaque table a des **colonnes lisibles** (matricule, année, nom, prénoms, date et lieu de naissance, catégorie, niveau, décision, contact…) et une colonne **`data`** contenant la fiche complète (JSON). Modifiez les fiches depuis *Administration › Modification des données* (tracé dans l'historique), pas à la main dans la base.
- Mots de passe **chiffrés** (bcrypt), jamais renvoyés aux navigateurs ; sessions stockées dans la table `session` (créée automatiquement).
- Les données ne sont accessibles qu'après connexion. Les pages publiques ne reçoivent que la fiche qui correspond exactement à la recherche (matricule, ou nom + prénoms + date de naissance) ; un visiteur peut seulement **ajouter** une pré-inscription, une inscription ou une inscription d'animateur.
- Les matricules sont attribués par le serveur, sans doublon possible.

## 8. Sauvegardes

```bash
pg_dump -h HOTE -U UTILISATEUR catechesendi > sauvegarde-$(date +%F).sql      # sauvegarde
psql   -h HOTE -U UTILISATEUR catechesendi < sauvegarde-2026-10-13.sql        # restauration (base vide)
```
Faites-en au moins une par semaine et avant chaque archivage annuel.

## 9. Mettre à jour plus tard

Remplacez `server.js`, `tables.js`, `package.json`, `scripts/`, `sql/` et `public/` par la nouvelle version (**gardez votre `.env`**), puis :
```bash
npm install --omit=dev
npm run update-db        # sans risque : ne supprime rien
pm2 restart catechesendi # ou « Restart » dans cPanel
```
⛔ N'exécutez jamais `sql/schema.sql` à la main sur une base déjà en service : il recrée les tables vides.

## 10. En cas de problème

| Symptôme | Cause probable |
|---|---|
| « Connexion à PostgreSQL impossible » au démarrage | Valeurs incorrectes dans `.env`, base inaccessible, ou `PGSSL=true` manquant pour une base en ligne |
| Retour permanent à la page de connexion | `COOKIE_SECURE=true` alors que le site est encore en http, ou `TRUST_PROXY` non activé derrière un proxy HTTPS |
| Erreur 502 (Nginx) | Application arrêtée : `pm2 logs catechesendi` pour voir l'erreur, puis `pm2 restart catechesendi` |
| « ⚠ Non enregistré » en bas à gauche | Connexion coupée ou session expirée : l'application réessaie seule ; sinon, reconnectez-vous |
