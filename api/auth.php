<?php
// Connexion / déconnexion / session en cours
require __DIR__ . '/lib.php';
kt_session();
$a = $_GET['action'] ?? '';
if ($a === 'session') {
  $u = user();
  out($u ? ['ok' => true, 'user' => $u] : ['ok' => false]);
}
if ($a === 'logout') {
  $_SESSION = []; session_destroy();
  out(['ok' => true]);
}
if ($a === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $b = body();
  $login = mb_strtoupper(trim((string)($b['login'] ?? '')), 'UTF-8');
  $pw = (string)($b['password'] ?? '');
  if ($login === '' || $pw === '') fail('Saisissez votre login et votre mot de passe.');
  $st = db()->prepare('SELECT id,mot_de_passe_hash,actif,data FROM utilisateur WHERE id=?'); $st->execute([$login]);
  $r = $st->fetch();
  $d = $r ? json_decode($r['data'], true) : null;
  $ok = $r && is_array($d) && ($d['actif'] ?? true) !== false && $r['actif'] !== '0'
        && $r['mot_de_passe_hash'] && password_verify($pw, $r['mot_de_passe_hash']);
  if (!$ok) { usleep(800000); fail('Login ou mot de passe incorrect, ou compte inactif.', 401); }
  session_regenerate_id(true);
  $_SESSION['kt_user'] = ['login' => $r['id'], 'nom' => (string)($d['nom'] ?? ''), 'groupe' => (string)($d['groupe'] ?? 'Opérateur(trice)'),
                          'cat' => (string)($d['cat'] ?? ''), 'niv' => (string)($d['niv'] ?? ''), 'chg' => !empty($d['chg'])];
  out(['ok' => true, 'user' => $_SESSION['kt_user']]);
}
fail('Action inconnue');
