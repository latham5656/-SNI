<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store');

// Определяем реальный IP посетителя (учитываем прокси/CDN)
$ip = $_SERVER['HTTP_CF_CONNECTING_IP']
   ?? $_SERVER['HTTP_X_REAL_IP']
   ?? $_SERVER['HTTP_X_FORWARDED_FOR']
   ?? $_SERVER['REMOTE_ADDR'];

$ip = trim(explode(',', $ip)[0]);

// Запрос к ipinfo.io со стороны сервера — обходит блокировки браузера
$url = "https://ipinfo.io/{$ip}/json";
$ctx = stream_context_create(['http' => ['timeout' => 5, 'ignore_errors' => true]]);
$body = @file_get_contents($url, false, $ctx);

if ($body) {
    $data = json_decode($body, true);
    // Нормализуем ответ: country, city, region, ip
    echo json_encode([
        'status'      => isset($data['country']) ? 'success' : 'fail',
        'query'       => $data['ip']      ?? $ip,
        'country'     => $data['country'] ?? '',
        'city'        => $data['city']    ?? '',
        'region'      => $data['region']  ?? '',
        'org'         => $data['org']     ?? '',
    ]);
} else {
    echo json_encode(['status' => 'fail', 'query' => $ip]);
}
