<?php
// Paramètres réservés au SuperAdmin (textes du site internet)
require __DIR__ . '/lib.php';
$u = need_user(); if (!is_sa($u)) fail('Réservé au SuperAdmin', 403);
$b = body(); $k = (string)($b['k'] ?? '');
if (!in_array($k, ['ktsite'], true)) fail('Paramètre inconnu');
save_param($k, $b['v'] ?? null);
out(['ok' => true]);
