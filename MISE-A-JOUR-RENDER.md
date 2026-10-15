# CATECHESENDI — Mise à jour du site hébergé sur Render (Node.js + PostgreSQL)

Ce paquet remplace le code du site et de l'application **sans toucher à vos données** : la base PostgreSQL de Render n'est pas modifiée (aucune table supprimée, aucune donnée effacée).

## Nouveautés de cette version
- Attestations : motif « Raisons scolaires », bas de page « Document édité le … », nom « PAROISSE NOTRE-DAME DE L’INCARNATION » harmonisé.
- Bouton vert **⬇ Télécharger** (PDF) à côté de chaque bouton d'impression : fiches, attestations, listes.
- Montant unique de l'inscription pour toutes les catégories (Administration › Paramètres de paiement, 5 000 FCFA par défaut).
- Pré-inscriptions : une personne inscrite reste aussi dans PRÉINSCRIPTION jusqu'à l'archivage ; Mobile Money enregistre dans les deux tables ; la liste des pré-inscrits a une colonne STATUT.
- Importation Excel des sacrements.

## Avant de commencer : sauvegarde
Render › votre base PostgreSQL › onglet **Backups** (ou **Recovery**) : vérifiez qu'une sauvegarde récente existe, ou exportez la base avec la commande `pg_dump` indiquée dans l'onglet **Connect** (« External Database URL ») :
```bash
pg_dump "URL_EXTERNE_DE_LA_BASE" > sauvegarde-avant-mise-a-jour.sql
```

## Méthode 1 — Votre service Render est relié à un dépôt Git (GitHub / GitLab) : cas le plus courant
1. Dézippez ce paquet.
2. Dans votre dépôt, **remplacez** les fichiers et dossiers suivants par ceux du paquet :
   `server.js`, `tables.js`, `package.json`, `ecosystem.config.js`, `scripts/`, `sql/`, `public/`, `deploy/`, `.env.example`, `.gitignore` et les guides.
   ⚠️ N'ajoutez **jamais** de fichier `.env` dans le dépôt : sur Render, les réglages restent dans l'onglet **Environment** du service (rien à changer).
3. Envoyez la mise à jour :
   ```bash
   git add -A
   git commit -m "Mise à jour CATECHESENDI"
   git push
   ```
   Render lance automatiquement un nouveau déploiement (onglet **Events** du service). Si le déploiement automatique est désactivé : bouton **Manual Deploy › Deploy latest commit**.

## Méthode 2 — Sans Git (via GitHub dans le navigateur)
Ouvrez votre dépôt sur github.com › **Add file › Upload files**, glissez le contenu du dossier dézippé (en acceptant de remplacer les fichiers), puis **Commit changes**. Render redéploie automatiquement.

## Mise à jour de la base (sans risque)
Cette version **ne demande aucun changement de structure**. Par sécurité, vous pouvez quand même lancer la mise à jour de la base, qui crée seulement les tables manquantes :
- **Recommandé (une fois pour toutes)** : service Render › **Settings › Build Command** :
  ```
  npm install && npm run update-db
  ```
  À chaque déploiement, la base est vérifiée automatiquement, sans jamais rien effacer.
- **Ou à la main** : service Render › onglet **Shell** › `npm run update-db`.

⛔ N'utilisez **jamais** `npm run init-db` ni `sql/schema.sql` sur la base en service : ils sont réservés à une première installation (la commande refuse d'ailleurs de s'exécuter si les tables existent).

## Vérifications après le déploiement
1. Onglet **Logs** du service : la ligne « CATECHESENDI démarré sur le port … » doit apparaître, sans erreur.
2. Ouvrez le site et rechargez avec **Ctrl + F5** (pour vider le cache du navigateur).
3. Connectez-vous à `/connexion.html` et vérifiez :
   - *Administration › Paramètres de paiement* : un seul champ « Montant de l'inscription » (vérifiez qu'il vaut bien le montant de l'année, sinon saisissez-le et enregistrez) ;
   - une fiche ou une attestation : le bouton vert **⬇ Télécharger** apparaît à côté de « Imprimer » ;
   - *Catéchumènes › Liste des pré-inscrits* : la colonne STATUT apparaît.

## Réglages Render à vérifier (onglet Environment)
| Variable | Valeur attendue |
|---|---|
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | informations de votre base Render (onglet Connect de la base, adresse **interne**) |
| `PGSSL` | `true` si vous utilisez l'adresse externe de la base ; `false` avec l'adresse interne |
| `SESSION_SECRET` | inchangé (le modifier déconnecte tout le monde) |
| `COOKIE_SECURE` | `true` (Render est en HTTPS) |
| `TRUST_PROXY` | `true` (indispensable sur Render, sinon la connexion ne tient pas) |

## En cas de problème
- **Le déploiement échoue** (onglet Events en rouge) : ouvrez les Logs ; le plus souvent un fichier manque dans le dépôt (`package.json`, `server.js`, dossier `public/`).
- **Retour permanent à la page de connexion** : vérifiez `TRUST_PROXY=true` et `COOKIE_SECURE=true`.
- **Revenir à la version précédente** : service Render › **Events** › sur l'ancien déploiement réussi › **Rollback**. Vos données ne sont pas touchées.
