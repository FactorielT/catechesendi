/* CATECHESENDI — couche d'accès à la base de données (serveur Node.js / PostgreSQL)
   Remplace le stockage du navigateur : les données sont chargées depuis le serveur
   et chaque modification est envoyée automatiquement à la base. */
(function () {
  "use strict";
  var API = "api/";
  function xhr(method, url, body) { // appel synchrone : uniquement au démarrage et pour les recherches publiques
    var x = new XMLHttpRequest(); x.open(method, API + url, false);
    if (body) x.setRequestHeader("Content-Type", "application/json");
    x.send(body ? JSON.stringify(body) : null);
    var j = null; try { j = JSON.parse(x.responseText); } catch (e) {}
    if (!j) throw new Error("Le serveur ne répond pas correctement (" + x.status + ").");
    return j;
  }
  function post(url, body) {
    return fetch(API + url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: "Réponse invalide (" + r.status + ")" }; }); })
      .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || "Erreur serveur"); return j; });
  }
  var isPublic = function () { return !!window.KT_SITE; };
  // Tables : [chemin dans DB, table PostgreSQL, identifiant]
  var ARR = [
    ["r", function (d) { return d.statut === "ins" ? "inscription" : "preinscription"; }],
    ["arch.ins", "historique_inscription"], ["arch.pre", "historique_preinscription"],
    ["anim", "animateur"], ["fc", "formation_continue"], ["bur", "bureau_membre"],
    ["h", "historique_operation"], ["users", "utilisateur", function (d) { return d.login; }],
    ["years", "annee_catechetique", function (d) { return d.id; }],
    ["att", "attestation_catechumene", function (d) { return d.pid; }], ["attA", "attestation_animateur", function (d) { return d.pid; }],
    ["archLog", "archivage"]];
  var MAP1 = [["sac", "sacrement"], ["idfix", "correction_identite"]];
  var MAP2 = [["comp", "compilation"], ["compRes", "resultat"]];
  var PARAMS = ["cfg", "cur", "archDone", "impEdits"];
  var PUBT = { inscription: 1, preinscription: 1, animateur: 1, historique_operation: 1, correction_identite: 1 };
  function path(DB, p) { return p.split(".").reduce(function (o, k) { return o ? o[k] : undefined; }, DB); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  function rows(DB) {
    var out = new Map();
    ARR.forEach(function (a) {
      (path(DB, a[0]) || []).forEach(function (d) {
        if (!d || typeof d !== "object") return;
        var id = a[2] ? a[2](d) : null;
        if (!id) { if (!d._id) d._id = uid(); id = d._id; }
        if (a[0] === "r") { // une pré-inscription reste dans PRÉINSCRIPTION ; inscrite, elle est AUSSI dans INSCRIPTION
          out.set("preinscription|" + id, { t: "preinscription", id: String(id), d: d });
          if (d.statut === "ins") out.set("inscription|" + id, { t: "inscription", id: String(id), d: d });
          return;
        }
        var t = typeof a[1] === "function" ? a[1](d) : a[1];
        out.set(t + "|" + id, { t: t, id: String(id), d: d });
      });
    });
    MAP1.forEach(function (a) { var m = DB[a[0]] || {}; Object.keys(m).forEach(function (k) { out.set(a[1] + "|" + k, { t: a[1], id: k, d: { k: k, v: m[k] } }); }); });
    MAP2.forEach(function (a) { var m = DB[a[0]] || {}; Object.keys(m).forEach(function (x) { var mm = m[x] || {}; Object.keys(mm).forEach(function (y) { out.set(a[1] + "|" + x + "|" + y, { t: a[1], id: x + "|" + y, d: { a: x, b: y, v: mm[y] } }); }); }); });
    PARAMS.forEach(function (k) { if (DB[k] !== undefined) out.set("parametres|" + k, { t: "parametres", id: k, d: { v: DB[k] } }); });
    return out;
  }
  function build(st) {
    var T = st.tables || {}, P = st.params || {}, g = function (n) { return T[n] || []; };
    var seen = {}, R = [];
    g("inscription").concat(g("preinscription")).forEach(function (d) { var k = d._id || JSON.stringify(d); if (!seen[k]) { seen[k] = 1; R.push(d); } });
    var DB = { r: R, h: g("historique_operation"), arch: { ins: g("historique_inscription"), pre: g("historique_preinscription") },
      anim: g("animateur"), fc: g("formation_continue"), bur: g("bureau_membre"), users: g("utilisateur"), att: g("attestation_catechumene"), attA: g("attestation_animateur"),
      archLog: g("archivage"), sac: {}, idfix: {}, comp: {}, compRes: {} };
    var yrs = g("annee_catechetique"); if (yrs.length) DB.years = yrs;
    g("sacrement").forEach(function (r) { DB.sac[r.k] = r.v; }); g("correction_identite").forEach(function (r) { DB.idfix[r.k] = r.v; });
    [["compilation", "comp"], ["resultat", "compRes"]].forEach(function (p) { g(p[0]).forEach(function (r) { (DB[p[1]][r.a] = DB[p[1]][r.a] || {})[r.b] = r.v; }); });
    PARAMS.forEach(function (k) { if (P[k] !== undefined && P[k] !== null) DB[k] = P[k]; });
    return DB;
  }
  var SNAP = new Map(), DBREF = null, timer = null, busy = false, again = false, failed = 0;
  function snapshot(DB) { SNAP = new Map(); rows(DB).forEach(function (v, k) { SNAP.set(k, JSON.stringify(v.d)); }); }
  // ---- indicateur d'enregistrement
  var badge = null;
  function status(txt, cls) {
    if (!document.body) return;
    if (!badge) { badge = document.createElement("div"); badge.id = "ktsync";
      badge.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:9999;padding:7px 14px;border-radius:99px;font:700 12px system-ui,Arial;box-shadow:0 4px 14px rgba(0,0,0,.18);transition:opacity .4s";
      document.body.appendChild(badge); }
    badge.textContent = txt; badge.style.opacity = "1";
    badge.style.background = cls === "err" ? "#fdecec" : cls === "ok" ? "#e7f6ee" : "#eef4ff";
    badge.style.color = cls === "err" ? "#b42318" : cls === "ok" ? "#1f7a4d" : "#1F5FAF";
    if (cls === "ok") setTimeout(function () { if (badge.textContent === txt) badge.style.opacity = "0"; }, 1800);
  }
  function flush() {
    timer = null; if (!DBREF) return;
    if (busy) { again = true; return; }
    var cur = rows(DBREF), ch = [], pub = isPublic();
    cur.forEach(function (v, k) {
      if (pub && !PUBT[v.t]) return;
      var j = JSON.stringify(v.d); if (SNAP.get(k) !== j) ch.push({ op: "up", t: v.t, id: v.id, d: v.d, _k: k, _j: j });
    });
    if (!pub) SNAP.forEach(function (j, k) { if (!cur.has(k)) { var i = k.indexOf("|"); ch.push({ op: "del", t: k.slice(0, i), id: k.slice(i + 1), _k: k }); } });
    if (!ch.length) return;
    busy = true; status("Enregistrement… (" + ch.length + ")", "");
    var i = 0;
    (function next() {
      if (i >= ch.length) { busy = false; failed = 0; status("✔ Enregistré", "ok"); if (again) { again = false; flush(); } return; }
      var part = ch.slice(i, i + 300);
      post("sync.php", { changes: part.map(function (c) { return { op: c.op, t: c.t, id: c.id, d: c.d }; }) }).then(function () {
        part.forEach(function (c) { if (c.op === "del") SNAP.delete(c._k); else SNAP.set(c._k, c._j); });
        i += 300; next();
      }).catch(function (e) {
        busy = false; failed++; status("⚠ Non enregistré : " + e.message + " — nouvel essai…", "err");
        setTimeout(flush, Math.min(30000, 3000 * failed));
      });
    })();
  }
  window.addEventListener("beforeunload", function (e) { if (busy || timer) { flush(); e.preventDefault(); e.returnValue = ""; } });
  function setLS(k, v) { try { Storage.prototype.setItem.__orig ? Storage.prototype.setItem.__orig.call(localStorage, k, v) : localStorage.setItem(k, v); } catch (e) {} }
  window.KTAPI = {
    boot: function (def) {
      var st;
      if (isPublic()) st = xhr("GET", "public.php?action=config");
      else {
        var s = xhr("GET", "auth.php?action=session");
        if (!s.ok) { location.replace("connexion.html"); throw new Error("Connexion requise"); }
        setLS("ktuser", s.user.login);
        st = xhr("GET", "state.php");
        if (!st.ok) { location.replace("connexion.html"); throw new Error(st.error || "Connexion requise"); }
      }
      var P = st.params || {};
      if (P.ktsite) setLS("ktsite", JSON.stringify(P.ktsite)); else { try { localStorage.removeItem("ktsite"); } catch (e) {} }
      var DB = build(st); DBREF = DB; snapshot(DB); window.KT_SERVER_USER = st.user || null;
      return DB;
    },
    save: function (DB) { DBREF = DB; if (timer) clearTimeout(timer); timer = setTimeout(flush, 300); return true; },
    alloc: function (kind, o) { var r = xhr("POST", "alloc.php", Object.assign({ kind: kind }, o || {})); if (!r.ok) throw new Error(r.error); return r.code; },
    // ---- recherches publiques (ne renvoient que les fiches correspondant exactement à la recherche)
    pubAnciens: function (q, dn, DB) {
      var r = xhr("POST", "public.php?action=anciens", { q: q, dn: dn || "" }); if (!r.ok) return;
      DB.arch.ins = r.hist || [];
      var ids = new Set(DB.r.map(function (d) { return d._id; }));
      (r.encours || []).forEach(function (d) { if (!ids.has(d._id)) { ids.add(d._id); DB.r.push(d); SNAP.set("preinscription|" + d._id, JSON.stringify(d)); if (d.statut === "ins") SNAP.set("inscription|" + d._id, JSON.stringify(d)); } });
    },
    pubAnimateurs: function (q, DB) {
      var r = xhr("POST", "public.php?action=animateurs", { q: q }); if (!r.ok) return;
      var mine = (DB.anim || []).filter(function (d) { return !SNAP.has("animateur|" + d._id); });
      (r.anim || []).forEach(function (d) { SNAP.set("animateur|" + d._id, JSON.stringify(d)); });
      DB.anim = (r.anim || []).concat(mine);
    },
    pubResultat: function (y, o, DB) {
      var r = xhr("POST", "public.php?action=resultat", Object.assign({ y: y }, o)); if (!r.ok) return;
      DB.r = DB.r.filter(function (d) { return !SNAP.has("inscription|" + d._id) && !SNAP.has("preinscription|" + d._id); });
      DB.arch.ins = r.recs || []; DB.compRes = DB.compRes || {}; DB.compRes[y] = {};
      (r.res || []).forEach(function (x) { DB.compRes[y][x.b] = x.v; });
    },
    logout: function () { return post("auth.php?action=logout", {}); }
  };
  // Textes du site (rubrique Administration du site internet) : enregistrés dans la base
  var orig = Storage.prototype.setItem, origRm = Storage.prototype.removeItem;
  Storage.prototype.setItem = function (k, v) {
    orig.call(this, k, v);
    if (this === window.localStorage && k === "ktsite" && !isPublic() && DBREF) { var o = null; try { o = JSON.parse(v); } catch (e) {} post("param.php", { k: "ktsite", v: o }).catch(function (e) { status("⚠ Textes du site non enregistrés : " + e.message, "err"); }); }
  };
  Storage.prototype.setItem.__orig = orig;
  Storage.prototype.removeItem = function (k) {
    origRm.call(this, k);
    if (this === window.localStorage && k === "ktsite" && !isPublic() && DBREF) post("param.php", { k: "ktsite", v: null }).catch(function () {});
  };
})();
