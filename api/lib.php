<?php
// CATECHESENDI — fonctions communes de l'API (PHP 7.4 ou plus, PDO PostgreSQL)
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/tables.php';
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const KT_CATE = ['inscription', 'preinscription', 'historique_inscription', 'historique_preinscription'];

function kt_session(): void {
  if (session_status() === PHP_SESSION_ACTIVE) return;
  $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
  session_name('KTNDI');
  session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax', 'secure' => $https]);
  session_start();
}
function db(): PDO {
  static $p = null;
  if ($p) return $p;
  try {
    $p = new PDO('pgsql:host=' . KT_DB_HOST . ';port=' . KT_DB_PORT . ';dbname=' . KT_DB_NAME, KT_DB_USER, KT_DB_PASS,
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
  } catch (Throwable $e) { fail('Connexion à la base impossible : vérifiez api/config.php', 500); }
  return $p;
}
function out(array $a, int $code = 200): void {
  http_response_code($code);
  echo json_encode($a, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function fail(string $m, int $c = 400): void { out(['ok' => false, 'error' => $m], $c); }
function body(): array {
  $j = json_decode((string)file_get_contents('php://input'), true);
  return is_array($j) ? $j : [];
}
function user(): ?array { kt_session(); return $_SESSION['kt_user'] ?? null; }
function need_user(): array { $u = user(); if (!$u) fail('Connexion requise', 401); return $u; }
function is_sa(?array $u): bool { return $u !== null && ($u['groupe'] ?? '') === 'SuperAdmin'; }
function enc($v): string { return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); }

// Valeur d'une colonne lisible à partir de la fiche JSON : 'a|b' = première valeur non vide, 'v.x' = imbriqué,
// '#x' = chiffres seulement (contacts), '@x' = texte long
function jget(array $d, string $path): ?string {
  $digits = false; $long = false;
  if ($path[0] === '#') { $digits = true; $path = substr($path, 1); }
  if ($path[0] === '@') { $long = true; $path = substr($path, 1); }
  foreach (explode('|', $path) as $p) {
    $cur = $d;
    foreach (explode('.', $p) as $k) {
      if (is_array($cur) && array_key_exists($k, $cur)) $cur = $cur[$k]; else { $cur = null; break; }
    }
    if ($cur === null || $cur === '') continue;
    if (is_bool($cur)) $cur = $cur ? '1' : '0';
    if (is_array($cur)) $cur = enc($cur);
    $s = (string)$cur;
    if ($digits) $s = preg_replace('/\D+/', '', $s);
    return $long ? $s : mb_substr($s, 0, 255, 'UTF-8');
  }
  return null;
}
// Majuscules sans accents ni ponctuation (comparaisons nom / prénoms / lieu)
function norm($s): string {
  $s = (string)$s;
  if (class_exists('Normalizer')) { $s = Normalizer::normalize($s, Normalizer::FORM_D); $s = preg_replace('/\p{Mn}+/u', '', $s); }
  else { $t = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s); if ($t !== false) $s = $t; }
  $s = mb_strtoupper($s, 'UTF-8');
  $s = preg_replace('/[^A-Z0-9]+/', ' ', $s);
  return trim($s);
}
function upsert(string $t, string $id, array $d, bool $insertOnly = false): void {
  global $KT_TABLES;
  $names = ['id']; $vals = [$id];
  foreach ($KT_TABLES[$t] as $c => $p) { $names[] = $c; $vals[] = jget($d, $p); }
  if ($t === 'utilisateur') {
    $pw = (string)($d['mdp'] ?? ''); unset($d['mdp']);
    if ($pw !== '') { $names[] = 'mot_de_passe_hash'; $vals[] = password_hash($pw, PASSWORD_DEFAULT); }
  }
  $names[] = 'data'; $vals[] = enc($d);
  $q = '"' . implode('","', $names) . '"'; $ph = implode(',', array_fill(0, count($names), '?'));
  if ($insertOnly) $sql = "INSERT INTO $t ($q) VALUES ($ph) ON CONFLICT (id) DO NOTHING";
  else {
    $up = ['maj=CURRENT_TIMESTAMP'];
    foreach ($names as $n) if ($n !== 'id') $up[] = '"' . $n . '"=EXCLUDED."' . $n . '"';
    $sql = "INSERT INTO $t ($q) VALUES ($ph) ON CONFLICT (id) DO UPDATE SET " . implode(',', $up);
  }
  db()->prepare($sql)->execute($vals);
}
function get_param(string $k) {
  $st = db()->prepare('SELECT valeur FROM parametres WHERE cle=?'); $st->execute([$k]);
  $v = $st->fetchColumn(); if ($v === false) return null;
  $j = json_decode((string)$v, true); return is_array($j) && array_key_exists('v', $j) ? $j['v'] : null;
}
function save_param(string $k, $v): void {
  if ($k === 'cfg' && is_array($v)) { // les compteurs de matricules ne reculent jamais
    $old = get_param('cfg');
    if (is_array($old)) {
      if (!isset($v['mat']) || !is_array($v['mat'])) $v['mat'] = [];
      $v['mat']['next'] = max((int)($old['mat']['next'] ?? 1), (int)($v['mat']['next'] ?? 1), 1);
      $v['anNext'] = max((int)($old['anNext'] ?? 1), (int)($v['anNext'] ?? 1), 1);
    }
  }
  db()->prepare('INSERT INTO parametres (cle,valeur) VALUES (?,?) ON CONFLICT (cle) DO UPDATE SET valeur=EXCLUDED.valeur, maj=CURRENT_TIMESTAMP')->execute([$k, enc(['v' => $v])]);
}
// Lignes brutes (JSON tel quel) d'une requête : évite de décoder des milliers de fiches
function raw_rows(string $sql, array $args = []): array {
  $st = db()->prepare($sql); $st->execute($args); $o = [];
  while ($r = $st->fetch()) $o[] = $r['data'];
  return $o;
}
function placeholders(array $a): string { return implode(',', array_fill(0, count($a), '?')); }
// Correction d'identité d'un ancien : appliquée à toutes ses fiches
function apply_fix(string $pid, $fx): void {
  if (!is_array($fx)) return;
  $map = ['nom' => 'nom', 'prenom' => 'prenom', 'dn' => 'dn', 'lieu' => 'lieu'];
  foreach (KT_CATE as $t) {
    $st = db()->prepare("SELECT id,data FROM $t WHERE matricule=?"); $st->execute([$pid]);
    foreach ($st->fetchAll() as $r) {
      $d = json_decode($r['data'], true); if (!is_array($d)) continue;
      foreach ($map as $k) if (!empty($fx[$k])) $d[$k] = (string)$fx[$k];
      upsert($t, $r['id'], $d);
    }
  }
  $st = db()->prepare('SELECT id,data FROM sacrement WHERE id=?'); $st->execute([$pid]);
  if ($r = $st->fetch()) {
    $d = json_decode($r['data'], true);
    if (is_array($d) && is_array($d['v'] ?? null)) { foreach ($map as $k) if (!empty($fx[$k])) $d['v'][$k] = (string)$fx[$k]; upsert('sacrement', $r['id'], $d); }
  }
}
