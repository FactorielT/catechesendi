<?php
// Enregistrement des modifications envoyées par l'application (ajouts, mises à jour, suppressions)
// Sans connexion (pages publiques du site) : seuls les AJOUTS de pré-inscriptions, inscriptions en ligne,
// animateurs, corrections d'identité et lignes d'historique sont acceptés.
require __DIR__ . '/lib.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Méthode non autorisée', 405);
$u = user();
$ch = body()['changes'] ?? null;
if (!is_array($ch) || count($ch) > 1000) fail('Requête invalide');
$PUB = ['inscription', 'preinscription', 'animateur', 'historique_operation', 'correction_identite'];
$pdo = db(); $n = 0; $skip = 0; $fix = [];
$pdo->beginTransaction();
try {
  foreach ($ch as $c) {
    $t = (string)($c['t'] ?? ''); $id = (string)($c['id'] ?? ''); $op = ($c['op'] ?? 'up') === 'del' ? 'del' : 'up'; $d = $c['d'] ?? null;
    if ($id === '' || strlen($id) > 120) { $skip++; continue; }
    if ($t === 'parametres') {
      if (!$u || !preg_match('/^[a-zA-Z]{1,40}$/', $id)) { $skip++; continue; }
      if ($op === 'del') $pdo->prepare('DELETE FROM parametres WHERE cle=?')->execute([$id]);
      else save_param($id, is_array($d) ? ($d['v'] ?? null) : null);
      $n++; continue;
    }
    if (!isset($KT_TABLES[$t])) { $skip++; continue; }
    if (!$u) { // visiteur du site
      if (!in_array($t, $PUB, true) || $op !== 'up' || !is_array($d)) { $skip++; continue; }
      if ($t === 'correction_identite') { upsert($t, $id, $d); $fix[$id] = $d['v'] ?? null; }
      else upsert($t, $id, $d, true);
      $n++; continue;
    }
    if ($t === 'utilisateur' && !is_sa($u)) { // un utilisateur ne peut que changer son propre mot de passe
      if ($op !== 'up' || $id !== $u['login'] || !is_array($d) || empty($d['mdp'])) { $skip++; continue; }
      $pdo->prepare('UPDATE utilisateur SET mot_de_passe_hash=? WHERE id=?')->execute([password_hash((string)$d['mdp'], PASSWORD_DEFAULT), $id]);
      $n++; continue;
    }
    if ($op === 'del') {
      if ($t === 'utilisateur' && $id === $u['login']) { $skip++; continue; }
      $pdo->prepare("DELETE FROM $t WHERE id=?")->execute([$id]);
    } else {
      if (!is_array($d)) { $skip++; continue; }
      upsert($t, $id, $d);
      if ($t === 'correction_identite') $fix[$id] = $d['v'] ?? null;
    }
    $n++;
  }
  foreach ($fix as $pid => $fx) apply_fix((string)$pid, $fx);
  $pdo->commit();
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  fail('Erreur base de données : ' . $e->getMessage(), 500);
}
out(['ok' => true, 'n' => $n, 'skip' => $skip]);
