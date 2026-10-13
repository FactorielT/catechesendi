<?php
// Accès public (site internet) : configuration, recherche d'un ancien, ré-inscription animateur, résultat.
// Ne renvoie que les fiches qui correspondent exactement à la recherche, jamais la base entière.
require __DIR__ . '/lib.php';
$a = $_GET['action'] ?? '';
$b = body();
$cur = (string)(get_param('cur') ?? '');
function json_list(array $raw): string { return '[' . implode(',', $raw) . ']'; }

if ($a === 'config') {
  $comp = raw_rows('SELECT data FROM compilation ORDER BY seq');
  $years = raw_rows('SELECT data FROM annee_catechetique ORDER BY seq');
  $p = ['cfg' => get_param('cfg'), 'cur' => $cur ?: null, 'ktsite' => get_param('ktsite')];
  http_response_code(200);
  echo '{"ok":true,"tables":{"compilation":' . json_list($comp) . ',"annee_catechetique":' . json_list($years) . '},"params":' . enc($p) . '}';
  exit;
}
if ($a === 'anciens') { // matricule exact, ou nom et prénoms + date de naissance exacte
  $q = trim((string)($b['q'] ?? '')); $dn = trim((string)($b['dn'] ?? ''));
  if ($q === '') fail('Recherche vide');
  $keys = [];
  foreach (['historique_inscription', 'inscription'] as $t) {
    $st = db()->prepare("SELECT DISTINCT matricule FROM $t WHERE matricule=? OR code=? LIMIT 20"); $st->execute([$q, $q]);
    foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $m) if ($m) $keys[$m] = 1;
  }
  if (!$keys && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dn)) {
    $toks = array_filter(explode(' ', norm($q)));
    foreach (['historique_inscription', 'inscription'] as $t) {
      $st = db()->prepare("SELECT matricule,nom,prenoms FROM $t WHERE date_naissance=?"); $st->execute([$dn]);
      foreach ($st->fetchAll() as $r) {
        $h = ' ' . norm($r['nom'] . ' ' . $r['prenoms']) . ' ';
        $all = true; foreach ($toks as $k) if (strpos($h, $k) === false) { $all = false; break; }
        if ($all && $r['matricule']) $keys[$r['matricule']] = 1;
      }
    }
  }
  $keys = array_slice(array_keys($keys), 0, 20);
  if (!$keys) out(['ok' => true, 'hist' => [], 'encours' => []]);
  $ph = placeholders($keys);
  $hist = array_merge(raw_rows("SELECT data FROM historique_inscription WHERE matricule IN ($ph)", $keys),
                      raw_rows("SELECT data FROM inscription WHERE matricule IN ($ph) AND (annee IS NULL OR annee<>?)", array_merge($keys, [$cur])));
  $enc = array_merge(raw_rows("SELECT data FROM inscription WHERE matricule IN ($ph) AND annee=?", array_merge($keys, [$cur])),
                     raw_rows("SELECT data FROM preinscription WHERE matricule IN ($ph) AND annee=?", array_merge($keys, [$cur])));
  echo '{"ok":true,"hist":' . json_list($hist) . ',"encours":' . json_list($enc) . '}'; exit;
}
if ($a === 'animateurs') { // contact (8 derniers chiffres) ou code animateur
  $q = trim((string)($b['q'] ?? '')); $dg = preg_replace('/\D+/', '', $q);
  $codes = [];
  if (strlen($dg) >= 8) { $st = db()->prepare("SELECT DISTINCT code FROM animateur WHERE contact1 LIKE ? LIMIT 20"); $st->execute(['%' . substr($dg, -8)]); $codes = $st->fetchAll(PDO::FETCH_COLUMN); }
  if (!$codes && $q !== '') { $st = db()->prepare("SELECT DISTINCT code FROM animateur WHERE code=? LIMIT 5"); $st->execute([strtoupper($q)]); $codes = $st->fetchAll(PDO::FETCH_COLUMN); }
  $codes = array_values(array_filter($codes));
  if (!$codes) out(['ok' => true, 'anim' => []]);
  echo '{"ok":true,"anim":' . json_list(raw_rows('SELECT data FROM animateur WHERE code IN (' . placeholders($codes) . ')', $codes)) . '}'; exit;
}
if ($a === 'resultat') { // matricule, ou nom + prénoms + date de naissance (le lieu est vérifié par la page)
  $y = trim((string)($b['y'] ?? '')); $m = strtoupper(trim((string)($b['m'] ?? '')));
  if (!preg_match('/^\d{4}-\d{4}$/', $y)) fail('Année invalide');
  $raw = [];
  foreach (['inscription', 'historique_inscription'] as $t) {
    if ($m !== '') $raw = array_merge($raw, raw_rows("SELECT data FROM $t WHERE annee=? AND (matricule=? OR code=?) LIMIT 5", [$y, $m, $m]));
    else {
      $dn = trim((string)($b['dn'] ?? '')); $N = norm($b['nom'] ?? ''); $P = norm($b['pre'] ?? '');
      if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dn) || $N === '' || $P === '') continue;
      $st = db()->prepare("SELECT data,nom,prenoms FROM $t WHERE annee=? AND date_naissance=?"); $st->execute([$y, $dn]);
      foreach ($st->fetchAll() as $r) if (norm($r['nom']) === $N && norm($r['prenoms']) === $P) $raw[] = $r['data'];
    }
  }
  $raw = array_slice($raw, 0, 10); $keys = [];
  foreach ($raw as $j) { $d = json_decode($j, true); if (is_array($d)) { $k = '';foreach (['mat','pid','code'] as $f) if (!empty($d[$f])) { $k = (string)$d[$f]; break; } if ($k !== '') $keys[] = $y . '|' . $k; } }
  $res = $keys ? raw_rows('SELECT data FROM resultat WHERE id IN (' . placeholders($keys) . ')', $keys) : [];
  echo '{"ok":true,"recs":' . json_list($raw) . ',"res":' . json_list($res) . '}'; exit;
}
fail('Action inconnue');
