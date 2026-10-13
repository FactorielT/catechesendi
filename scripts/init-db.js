// Crée les tables dans une base PostgreSQL VIDE (première installation uniquement).
// Usage : npm run init-db            (refuse si des tables existent déjà)
//         npm run update-db          (mise à jour sans risque : crée seulement les tables manquantes)
"use strict";
require("dotenv").config();
const fs = require("fs"), path = require("path"), { Client } = require("pg");
(async () => {
  const update = process.argv.includes("--update");
  const c = new Client({ host: process.env.PGHOST || "localhost", port: +(process.env.PGPORT || 5432), database: process.env.PGDATABASE, user: process.env.PGUSER, password: process.env.PGPASSWORD, ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined });
  try {
    await c.connect();
    if (!update) {
      const r = await c.query("SELECT count(*)::int n FROM information_schema.tables WHERE table_schema='public' AND table_name='utilisateur'");
      if (r.rows[0].n) { console.error("⛔ La base contient déjà les tables CATECHESENDI : rien n'a été fait (pour une mise à jour, utilisez « npm run update-db »)."); process.exit(1); }
    }
    await c.query(fs.readFileSync(path.join(__dirname, "..", "sql", update ? "mise-a-jour.sql" : "schema.sql"), "utf8"));
    console.log(update ? "✔ Base mise à jour (tables manquantes créées, aucune donnée modifiée)." : "✔ Tables créées. Compte par défaut : SUPERADMIN / Ndi@2026 (à changer à la première connexion).");
  } catch (e) { console.error("Erreur : " + e.message); process.exit(1); } finally { await c.end().catch(() => {}); }
})();
