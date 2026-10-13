/* CATECHESENDI — pages du site : textes administrables et état des résultats, lus depuis la base */
(function () {
  window.KT_PUBCFG = { cur: "", comp: {} };
  try {
    var x = new XMLHttpRequest(); x.open("GET", "api/public.php?action=config", false); x.send(null);
    var j = JSON.parse(x.responseText);
    if (j && j.ok) {
      var P = j.params || {}, comp = {};
      ((j.tables || {}).compilation || []).forEach(function (r) { (comp[r.a] = comp[r.a] || {})[r.b] = r.v; });
      window.KT_PUBCFG = { cur: P.cur || "", comp: comp };
      if (P.ktsite) localStorage.setItem("ktsite", JSON.stringify(P.ktsite)); else localStorage.removeItem("ktsite");
    }
  } catch (e) {}
})();
