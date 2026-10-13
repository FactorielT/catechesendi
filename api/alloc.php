<?php
// Attribution d'un nouveau matricule (catéchumène) ou code (animateur) sans doublon, même si plusieurs personnes saisissent en même temps
require __DIR__ . '/lib.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Méthode non autorisée', 405);
$b = body(); $kind = $b['kind'] ?? 'mat';
$pdo = db(); $pdo->beginTransaction();
try {
  $st = $pdo->prepare("SELECT valeur FROM parametres WHERE cle='cfg' FOR UPDATE"); $st->execute();
  $v = $st->fetchColumn(); $j = $v ? json_decode((string)$v, true) : null; $cfg = is_array($j) ? ($j['v'] ?? []) : [];
  if (!is_array($cfg)) $cfg = [];
  if ($kind === 'anim') {
    $n = max(1, (int)($cfg['anNext'] ?? 1));
    $chk = $pdo->prepare('SELECT 1 FROM animateur WHERE code=? LIMIT 1');
    while (true) { $code = 'AN-' . str_pad((string)$n, 4, '0', STR_PAD_LEFT); $chk->execute([$code]); if (!$chk->fetchColumn()) break; $n++; }
    $cfg['anNext'] = $n + 1;
  } else {
    $an = (string)($b['annee'] ?? ''); if (!preg_match('/^\d{4}-\d{4}$/', $an)) fail('Année invalide');
    $l = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', (string)($b['cat'] ?? 'X')) ?: 'X', 0, 1));
    if (!isset($cfg['mat']) || !is_array($cfg['mat'])) $cfg['mat'] = [];
    $n = max(1, (int)($cfg['mat']['next'] ?? 1));
    $chk = [];
    foreach (KT_CATE as $t) $chk[] = $pdo->prepare("SELECT 1 FROM $t WHERE matricule=? OR code=? LIMIT 1");
    while (true) {
      $code = substr($an, -2) . '-' . $l . $n; $used = false;
      foreach ($chk as $c) { $c->execute([$code, $code]); if ($c->fetchColumn()) { $used = true; break; } }
      if (!$used) break; $n++;
    }
    $cfg['mat']['next'] = $n + 1;
  }
  $pdo->prepare("INSERT INTO parametres (cle,valeur) VALUES ('cfg',?) ON CONFLICT (cle) DO UPDATE SET valeur=EXCLUDED.valeur, maj=CURRENT_TIMESTAMP")->execute([enc(['v' => $cfg])]);
  $pdo->commit();
} catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); fail('Erreur : ' . $e->getMessage(), 500); }
out(['ok' => true, 'code' => $code]);
