// ============================================================
//  CATECHESENDI — serveur Node.js (Express) + PostgreSQL
//  Sert le site et l'application (dossier public/) et l'API (/api/...)
// ============================================================
"use strict";
require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const PgStore = require("connect-pg-simple")(session);
const compression = require("compression");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const TABLES = require("./tables");

const CATE = ["inscription", "preinscription", "historique_inscription", "historique_preinscription"];
const PUB = new Set(["inscription", "preinscription", "animateur", "historique_operation", "correction_identite"]);
const pool = new Pool({
  host: process.env.PGHOST || "localhost", port: +(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "catechesendi", user: process.env.PGUSER, password: process.env.PGPASSWORD,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined, max: 10
});
const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);
app.use(compression());
app.use(express.json({ limit: "25mb" }));
app.use(session({
  store: new PgStore({ pool, tableName: "session", createTableIfMissing: true }),
  name: "KTNDI", secret: process.env.SESSION_SECRET || "a-changer-dans-le-fichier-.env",
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.COOKIE_SECURE === "true", maxAge: 12 * 3600 * 1000 }
}));

// ---------- outils
class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const fail = (msg, code = 400) => { throw new HttpError(code, msg); };
const userOf = req => (req.session && req.session.ktUser) || null;
const isSA = u => !!u && u.groupe === "SuperAdmin";
const needUser = req => { const u = userOf(req); if (!u) fail("Connexion requise", 401); return u; };
const enc = v => JSON.stringify(v === undefined ? null : v);
// Valeur d'une colonne lisible : 'a|b' = première valeur non vide, 'v.x' = imbriqué, '#x' = chiffres, '@x' = texte long
function jget(d, p) {
  let digits = false, long = false;
  if (p[0] === "#") { digits = true; p = p.slice(1); }
  if (p[0] === "@") { long = true; p = p.slice(1); }
  for (const alt of p.split("|")) {
    let cur = d;
    for (const k of alt.split(".")) { if (cur && typeof cur === "object" && k in cur) cur = cur[k]; else { cur = null; break; } }
    if (cur === null || cur === undefined || cur === "") continue;
    if (typeof cur === "boolean") cur = cur ? "1" : "0";
    if (typeof cur === "object") cur = JSON.stringify(cur);
    let s = String(cur);
    if (digits) s = s.replace(/\D+/g, "");
    return long ? s : s.slice(0, 255);
  }
  return null;
}
// Majuscules sans accents ni ponctuation (comparaisons nom / prénoms)
const norm = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
const q = n => '"' + n + '"';
async function upsert(db, t, id, d, insertOnly = false) {
  const names = ["id"], vals = [id];
  for (const [c, p] of Object.entries(TABLES[t])) { names.push(c); vals.push(jget(d, p)); }
  if (t === "utilisateur") {
    const pw = String(d.mdp || ""); d = Object.assign({}, d); delete d.mdp;
    if (pw) { names.push("mot_de_passe_hash"); vals.push(await bcrypt.hash(pw, 10)); }
  }
  names.push("data"); vals.push(enc(d));
  const ph = names.map((_, i) => "$" + (i + 1)).join(",");
  const sql = insertOnly
    ? `INSERT INTO ${t} (${names.map(q).join(",")}) VALUES (${ph}) ON CONFLICT (id) DO NOTHING`
    : `INSERT INTO ${t} (${names.map(q).join(",")}) VALUES (${ph}) ON CONFLICT (id) DO UPDATE SET maj=CURRENT_TIMESTAMP,` +
      names.filter(n => n !== "id").map(n => `${q(n)}=EXCLUDED.${q(n)}`).join(",");
  await db.query(sql, vals);
}
async function getParam(db, k) {
  const r = await db.query("SELECT valeur FROM parametres WHERE cle=$1", [k]);
  if (!r.rows.length) return null;
  try { const j = JSON.parse(r.rows[0].valeur); return j && "v" in j ? j.v : null; } catch (e) { return null; }
}
async function saveParam(db, k, v) {
  if (k === "cfg" && v && typeof v === "object") { // les compteurs de matricules ne reculent jamais
    const old = await getParam(db, "cfg");
    if (old && typeof old === "object") {
      if (!v.mat || typeof v.mat !== "object") v.mat = {};
      v.mat.next = Math.max(+((old.mat || {}).next) || 1, +v.mat.next || 1, 1);
      v.anNext = Math.max(+old.anNext || 1, +v.anNext || 1, 1);
    }
  }
  await db.query("INSERT INTO parametres (cle,valeur) VALUES ($1,$2) ON CONFLICT (cle) DO UPDATE SET valeur=EXCLUDED.valeur, maj=CURRENT_TIMESTAMP", [k, enc({ v })]);
}
const rawRows = async (db, sql, args = []) => (await db.query(sql, args)).rows.map(r => r.data);
const list = a => "[" + a.join(",") + "]";
// Correction d'identité d'un ancien : appliquée à toutes ses fiches
async function applyFix(db, pid, fx) {
  if (!fx || typeof fx !== "object") return;
  const F = ["nom", "prenom", "dn", "lieu"];
  for (const t of CATE) {
    const r = await db.query(`SELECT id,data FROM ${t} WHERE matricule=$1`, [pid]);
    for (const row of r.rows) { let d; try { d = JSON.parse(row.data); } catch (e) { continue; } F.forEach(k => { if (fx[k]) d[k] = String(fx[k]); }); await upsert(db, t, row.id, d); }
  }
  const s = await db.query("SELECT id,data FROM sacrement WHERE id=$1", [pid]);
  if (s.rows.length) { let d; try { d = JSON.parse(s.rows[0].data); } catch (e) { d = null; } if (d && d.v) { F.forEach(k => { if (fx[k]) d.v[k] = String(fx[k]); }); await upsert(db, "sacrement", s.rows[0].id, d); } }
}
async function tx(fn) {
  const c = await pool.connect();
  try { await c.query("BEGIN"); const r = await fn(c); await c.query("COMMIT"); return r; }
  catch (e) { try { await c.query("ROLLBACK"); } catch (x) {} throw e; }
  finally { c.release(); }
}
const route = (name, handler) => app.all(["/api/" + name, "/api/" + name + ".php"], (req, res) => {
  res.set("Cache-Control", "no-store");
  Promise.resolve(handler(req, res)).catch(e => {
    if (e instanceof HttpError) return res.status(e.code).json({ ok: false, error: e.message });
    console.error(e); res.status(500).json({ ok: false, error: "Erreur serveur : " + e.message });
  });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- connexion / session
route("auth", async (req, res) => {
  const a = req.query.action || "";
  if (a === "session") { const u = userOf(req); return res.json(u ? { ok: true, user: u } : { ok: false }); }
  if (a === "logout") { return req.session.destroy(() => res.json({ ok: true })); }
  if (a === "login" && req.method === "POST") {
    const login = String((req.body || {}).login || "").trim().toUpperCase(), pw = String((req.body || {}).password || "");
    if (!login || !pw) fail("Saisissez votre login et votre mot de passe.");
    const r = await pool.query("SELECT id,mot_de_passe_hash,actif,data FROM utilisateur WHERE id=$1", [login]);
    const row = r.rows[0]; let d = null; try { d = row ? JSON.parse(row.data) : null; } catch (e) {}
    const ok = row && d && d.actif !== false && row.actif !== "0" && row.mot_de_passe_hash && await bcrypt.compare(pw, row.mot_de_passe_hash.replace(/^\$2y\$/, "$2b$"));
    if (!ok) { await sleep(800); fail("Login ou mot de passe incorrect, ou compte inactif.", 401); }
    const user = { login: row.id, nom: String(d.nom || ""), groupe: String(d.groupe || "Opérateur(trice)"), cat: String(d.cat || ""), niv: String(d.niv || ""), chg: !!d.chg };
    return req.session.regenerate(err => { if (err) return res.status(500).json({ ok: false, error: "Session impossible" }); req.session.ktUser = user; res.json({ ok: true, user }); });
  }
  fail("Action inconnue");
});
// ---------- chargement complet (application de gestion)
route("state", async (req, res) => {
  const u = needUser(req); const parts = [];
  for (const t of Object.keys(TABLES)) {
    let rows;
    if (t === "utilisateur") {
      rows = (await pool.query("SELECT id,data FROM utilisateur ORDER BY seq")).rows
        .filter(r => isSA(u) || r.id === u.login).map(r => { const d = JSON.parse(r.data); delete d.mdp; return JSON.stringify(d); });
    } else rows = await rawRows(pool, `SELECT data FROM ${t} ORDER BY seq ${t === "historique_operation" ? "DESC" : "ASC"}`);
    parts.push(JSON.stringify(t) + ":" + list(rows));
  }
  const pr = (await pool.query("SELECT cle,valeur FROM parametres")).rows.map(r => { let v = null; try { const j = JSON.parse(r.valeur); v = j && "v" in j ? j.v : null; } catch (e) {} return JSON.stringify(r.cle) + ":" + enc(v); });
  res.type("application/json").send('{"ok":true,"tables":{' + parts.join(",") + '},"params":{' + pr.join(",") + '},"user":' + enc(u) + "}");
});
// ---------- enregistrement des modifications
route("sync", async (req, res) => {
  if (req.method !== "POST") fail("Méthode non autorisée", 405);
  const u = userOf(req), ch = (req.body || {}).changes;
  if (!Array.isArray(ch) || ch.length > 1000) fail("Requête invalide");
  let n = 0, skip = 0;
  await tx(async db => {
    const fix = {};
    for (const c of ch) {
      const t = String(c.t || ""), id = String(c.id || ""), op = c.op === "del" ? "del" : "up", d = c.d;
      if (!id || id.length > 120) { skip++; continue; }
      if (t === "parametres") {
        if (!u || !/^[a-zA-Z]{1,40}$/.test(id)) { skip++; continue; }
        if (op === "del") await db.query("DELETE FROM parametres WHERE cle=$1", [id]); else await saveParam(db, id, d && typeof d === "object" ? d.v : null);
        n++; continue;
      }
      if (!TABLES[t]) { skip++; continue; }
      if (!u) { // visiteur du site : ajouts seulement
        if (!PUB.has(t) || op !== "up" || !d || typeof d !== "object") { skip++; continue; }
        if (t === "correction_identite") { await upsert(db, t, id, d); fix[id] = d.v; } else await upsert(db, t, id, d, true);
        n++; continue;
      }
      if (t === "utilisateur" && !isSA(u)) { // un utilisateur ne peut que changer son propre mot de passe
        if (op !== "up" || id !== u.login || !d || !d.mdp) { skip++; continue; }
        await db.query("UPDATE utilisateur SET mot_de_passe_hash=$1 WHERE id=$2", [await bcrypt.hash(String(d.mdp), 10), id]); n++; continue;
      }
      if (op === "del") { if (t === "utilisateur" && id === u.login) { skip++; continue; } await db.query(`DELETE FROM ${t} WHERE id=$1`, [id]); }
      else { if (!d || typeof d !== "object") { skip++; continue; } await upsert(db, t, id, d); if (t === "correction_identite") fix[id] = d.v; }
      n++;
    }
    for (const [pid, fx] of Object.entries(fix)) await applyFix(db, pid, fx);
  });
  res.json({ ok: true, n, skip });
});
// ---------- accès public (site internet)
route("public", async (req, res) => {
  const a = req.query.action || "", b = req.body || {}, cur = String((await getParam(pool, "cur")) || "");
  if (a === "config") {
    const comp = await rawRows(pool, "SELECT data FROM compilation ORDER BY seq"), years = await rawRows(pool, "SELECT data FROM annee_catechetique ORDER BY seq");
    const p = { cfg: await getParam(pool, "cfg"), cur: cur || null, ktsite: await getParam(pool, "ktsite") };
    return res.type("application/json").send('{"ok":true,"tables":{"compilation":' + list(comp) + ',"annee_catechetique":' + list(years) + '},"params":' + enc(p) + "}");
  }
  if (a === "anciens") { // matricule exact, ou nom et prénoms + date de naissance exacte
    const qq = String(b.q || "").trim(), dn = String(b.dn || "").trim(); if (!qq) fail("Recherche vide");
    const keys = new Set();
    for (const t of ["historique_inscription", "inscription"]) (await pool.query(`SELECT DISTINCT matricule FROM ${t} WHERE matricule=$1 OR code=$1 LIMIT 20`, [qq])).rows.forEach(r => r.matricule && keys.add(r.matricule));
    if (!keys.size && /^\d{4}-\d{2}-\d{2}$/.test(dn)) {
      const toks = norm(qq).split(" ").filter(Boolean);
      for (const t of ["historique_inscription", "inscription"]) (await pool.query(`SELECT matricule,nom,prenoms FROM ${t} WHERE date_naissance=$1`, [dn])).rows.forEach(r => { const h = " " + norm(r.nom + " " + r.prenoms) + " "; if (r.matricule && toks.every(k => h.includes(k))) keys.add(r.matricule); });
    }
    const K = [...keys].slice(0, 20); if (!K.length) return res.json({ ok: true, hist: [], encours: [] });
    const hist = (await rawRows(pool, "SELECT data FROM historique_inscription WHERE matricule = ANY($1)", [K])).concat(await rawRows(pool, "SELECT data FROM inscription WHERE matricule = ANY($1) AND (annee IS NULL OR annee<>$2)", [K, cur]));
    const enc2 = (await rawRows(pool, "SELECT data FROM inscription WHERE matricule = ANY($1) AND annee=$2", [K, cur])).concat(await rawRows(pool, "SELECT data FROM preinscription WHERE matricule = ANY($1) AND annee=$2", [K, cur]));
    return res.type("application/json").send('{"ok":true,"hist":' + list(hist) + ',"encours":' + list(enc2) + "}");
  }
  if (a === "animateurs") { // contact (8 derniers chiffres) ou code animateur
    const qq = String(b.q || "").trim(), dg = qq.replace(/\D+/g, ""); let codes = [];
    if (dg.length >= 8) codes = (await pool.query("SELECT DISTINCT code FROM animateur WHERE contact1 LIKE $1 LIMIT 20", ["%" + dg.slice(-8)])).rows.map(r => r.code);
    if (!codes.length && qq) codes = (await pool.query("SELECT DISTINCT code FROM animateur WHERE code=$1 LIMIT 5", [qq.toUpperCase()])).rows.map(r => r.code);
    codes = codes.filter(Boolean); if (!codes.length) return res.json({ ok: true, anim: [] });
    return res.type("application/json").send('{"ok":true,"anim":' + list(await rawRows(pool, "SELECT data FROM animateur WHERE code = ANY($1)", [codes])) + "}");
  }
  if (a === "resultat") { // matricule, ou nom + prénoms + date de naissance (le lieu est vérifié par la page)
    const y = String(b.y || "").trim(), m = String(b.m || "").trim().toUpperCase(); if (!/^\d{4}-\d{4}$/.test(y)) fail("Année invalide");
    let raw = [];
    for (const t of ["inscription", "historique_inscription"]) {
      if (m) raw = raw.concat(await rawRows(pool, `SELECT data FROM ${t} WHERE annee=$1 AND (matricule=$2 OR code=$2) LIMIT 5`, [y, m]));
      else {
        const dn = String(b.dn || "").trim(), N = norm(b.nom), P = norm(b.pre);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dn) || !N || !P) continue;
        (await pool.query(`SELECT data,nom,prenoms FROM ${t} WHERE annee=$1 AND date_naissance=$2`, [y, dn])).rows.forEach(r => { if (norm(r.nom) === N && norm(r.prenoms) === P) raw.push(r.data); });
      }
    }
    raw = raw.slice(0, 10);
    const keys = raw.map(j => { try { const d = JSON.parse(j); const k = d.mat || d.pid || d.code || ""; return k ? y + "|" + k : null; } catch (e) { return null; } }).filter(Boolean);
    const rs = keys.length ? await rawRows(pool, "SELECT data FROM resultat WHERE id = ANY($1)", [keys]) : [];
    return res.type("application/json").send('{"ok":true,"recs":' + list(raw) + ',"res":' + list(rs) + "}");
  }
  fail("Action inconnue");
});
// ---------- attribution d'un matricule / code animateur sans doublon
route("alloc", async (req, res) => {
  if (req.method !== "POST") fail("Méthode non autorisée", 405);
  const b = req.body || {}, kind = b.kind || "mat";
  const code = await tx(async db => {
    const r = await db.query("SELECT valeur FROM parametres WHERE cle='cfg' FOR UPDATE");
    let cfg = {}; try { cfg = (JSON.parse(r.rows[0].valeur) || {}).v || {}; } catch (e) {} if (!cfg || typeof cfg !== "object") cfg = {};
    let c;
    if (kind === "anim") {
      let n = Math.max(1, +cfg.anNext || 1);
      while (true) { c = "AN-" + String(n).padStart(4, "0"); if (!(await db.query("SELECT 1 FROM animateur WHERE code=$1 LIMIT 1", [c])).rows.length) break; n++; }
      cfg.anNext = n + 1;
    } else {
      const an = String(b.annee || ""); if (!/^\d{4}-\d{4}$/.test(an)) fail("Année invalide");
      const l = ((String(b.cat || "X").replace(/[^A-Za-z]/g, "") || "X")[0]).toUpperCase();
      if (!cfg.mat || typeof cfg.mat !== "object") cfg.mat = {};
      let n = Math.max(1, +cfg.mat.next || 1);
      while (true) {
        c = an.slice(-2) + "-" + l + n; let used = false;
        for (const t of CATE) if ((await db.query(`SELECT 1 FROM ${t} WHERE matricule=$1 OR code=$1 LIMIT 1`, [c])).rows.length) { used = true; break; }
        if (!used) break; n++;
      }
      cfg.mat.next = n + 1;
    }
    await db.query("INSERT INTO parametres (cle,valeur) VALUES ('cfg',$1) ON CONFLICT (cle) DO UPDATE SET valeur=EXCLUDED.valeur, maj=CURRENT_TIMESTAMP", [enc({ v: cfg })]);
    return c;
  });
  res.json({ ok: true, code });
});
// ---------- paramètres réservés au SuperAdmin (textes du site)
route("param", async (req, res) => {
  const u = needUser(req); if (!isSA(u)) fail("Réservé au SuperAdmin", 403);
  const k = String((req.body || {}).k || ""); if (k !== "ktsite") fail("Paramètre inconnu");
  await saveParam(pool, k, (req.body || {}).v === undefined ? null : req.body.v); res.json({ ok: true });
});
app.use("/api", (req, res) => res.status(404).json({ ok: false, error: "Adresse inconnue" }));
// ---------- site et application (fichiers statiques)
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"], maxAge: "1h", setHeaders: (res, p) => { if (p.endsWith(".html")) res.set("Cache-Control", "no-cache"); } }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, "public", "index.html")));

const PORT = +(process.env.PORT || 3000);
if (require.main === module) {
  pool.query("SELECT 1").then(() => app.listen(PORT, () => console.log("CATECHESENDI démarré sur le port " + PORT)))
    .catch(e => { console.error("Connexion à PostgreSQL impossible : vérifiez le fichier .env (" + e.message + ")"); process.exit(1); });
}
module.exports = app;
