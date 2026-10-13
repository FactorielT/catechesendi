<?php
// Chargement complet des données pour l'application de gestion (utilisateur connecté)
require __DIR__ . '/lib.php';
$u = need_user();
if (!empty($_SERVER['HTTP_ACCEPT_ENCODING']) && strpos($_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip') !== false && function_exists('ob_gzhandler')) ob_start('ob_gzhandler');
http_response_code(200);
echo '{"ok":true,"tables":{';
$first = true;
foreach ($KT_TABLES as $t => $cols) {
  $ord = $t === 'historique_operation' ? 'DESC' : 'ASC';
  if ($t === 'utilisateur') {
    $rows = [];
    foreach (db()->query("SELECT id,data FROM utilisateur ORDER BY seq") as $r) {
      if (!is_sa($u) && $r['id'] !== $u['login']) continue;
      $d = json_decode($r['data'], true); if (!is_array($d)) continue; unset($d['mdp']); $rows[] = enc($d);
    }
  } else $rows = raw_rows("SELECT data FROM $t ORDER BY seq $ord");
  echo ($first ? '' : ',') . '"' . $t . '":[' . implode(',', $rows) . ']';
  $first = false;
}
echo '},"params":{';
$first = true;
foreach (db()->query('SELECT cle,valeur FROM parametres') as $r) {
  $j = json_decode((string)$r['valeur'], true);
  echo ($first ? '' : ',') . enc((string)$r['cle']) . ':' . enc(is_array($j) && array_key_exists('v', $j) ? $j['v'] : null);
  $first = false;
}
echo '},"user":' . enc($u) . '}';
