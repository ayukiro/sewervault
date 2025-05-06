<?php
// Set headers to prevent caching
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');
header('Content-Type: application/json');

// Security check - only allow from our domain
$allowed_origins = ['sewerslvt.ayukiro.xyz', 'localhost', '127.0.0.1'];
$origin = isset($_SERVER['HTTP_REFERER']) ? parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST) : '';

// Bypass the check if we're testing directly
if (empty($origin) && (isset($_GET['debug']) || $_SERVER['REMOTE_ADDR'] == '127.0.0.1')) {
    // Local testing allowed
} else if (!in_array($origin, $allowed_origins)) {
    $response = [
        'success' => false,
        'message' => 'Unauthorized access'
    ];
    echo json_encode($response);
    exit;
}

// Путь для временных ZIP-файлов
$temp_dir = __DIR__ . '/temp';
if (!is_dir($temp_dir)) {
    mkdir($temp_dir, 0755, true);
}

// Очистка старых архивов (старше 24 часов)
$files = glob($temp_dir . '/*.zip');
foreach ($files as $file) {
    if (time() - filemtime($file) > 86400) { // 24 часа
        unlink($file);
    }
}

// Проверка наличия параметров
if (!isset($_GET['album']) || empty($_GET['album'])) {
    $response = [
        'success' => false,
        'message' => 'Album name is not specified'
    ];
    echo json_encode($response);
    exit;
}

$album_name = $_GET['album'];
$album_type = isset($_GET['type']) ? $_GET['type'] : 'Album';

// Загрузка списка треков
$music_data_raw = file_get_contents('music.json');
if (!$music_data_raw) {
    $response = [
        'success' => false,
        'message' => 'Error reading music data'
    ];
    echo json_encode($response);
    exit;
}

$music_data = json_decode($music_data_raw, true);
if (!$music_data) {
    $response = [
        'success' => false,
        'message' => 'Error parsing music data'
    ];
    echo json_encode($response);
    exit;
}

// Получаем все треки из альбома (любого формата)
$album_tracks_all = array_filter($music_data, function($track) use ($album_name) {
    return $track['album'] === $album_name;
});

if (empty($album_tracks_all)) {
    $response = [
        'success' => false,
        'message' => 'No tracks found for this album'
    ];
    echo json_encode($response);
    exit;
}

// Сортировка треков по ID для правильного порядка
usort($album_tracks_all, function($a, $b) {
    return $a['id'] - $b['id'];
});

// Получаем ID всех треков в альбоме
$track_ids = array_unique(array_map(function($track) {
    return $track['id'];
}, $album_tracks_all));

// Создаем массив треков в лучшем качестве
$best_quality_tracks = [];
foreach ($track_ids as $id) {
    // Найдем все версии этого трека
    $track_versions = array_filter($album_tracks_all, function($track) use ($id) {
        return $track['id'] == $id;
    });
    
    // Найдем FLAC версию если есть
    $flac_version = array_filter($track_versions, function($track) {
        return $track['format'] === 'FLAC';
    });
    
    // Если есть FLAC версия, используем её, иначе берем MP3
    if (!empty($flac_version)) {
        $best_quality_tracks[] = reset($flac_version);
    } else {
        // Если нет FLAC, возьмем любую доступную версию
        $best_quality_tracks[] = reset($track_versions);
    }
}

if (empty($best_quality_tracks)) {
    $response = [
        'success' => false,
        'message' => 'No tracks found for this album'
    ];
    echo json_encode($response);
    exit;
}

// Создаем безопасное имя для ZIP-файла
$safe_album_name = preg_replace('/[^a-z0-9_-]/i', '_', $album_name);
$timestamp = time();
$zip_filename = $safe_album_name . '_' . $timestamp . '.zip';
$zip_path = $temp_dir . '/' . $zip_filename;

// Проверка, существует ли уже ZIP для этого альбома (созданный менее 24 часов назад)
$existing_zips = glob($temp_dir . '/' . $safe_album_name . '_*.zip');
foreach ($existing_zips as $existing_zip) {
    if (time() - filemtime($existing_zip) < 86400) { // 24 часа
        // Отдаем существующий файл
        $response = [
            'success' => true, 
            'file' => str_replace(__DIR__ . '/', '', $existing_zip),
            'message' => 'Using existing archive'
        ];
        echo json_encode($response);
        exit;
    }
}

// Создание ZIP-архива
$zip = new ZipArchive();
if ($zip->open($zip_path, ZipArchive::CREATE) !== TRUE) {
    $response = [
        'success' => false,
        'message' => 'Failed to create ZIP archive'
    ];
    echo json_encode($response);
    exit;
}

// Добавление треков в архив
foreach ($best_quality_tracks as $track) {
    $file_path = 'music/' . $track['filePath'];
    if (file_exists($file_path)) {
        // Используем только имя файла без пути для более чистой структуры архива
        $filename = basename($track['filePath']);
        $zip->addFile($file_path, $filename);
    }
}

// Закрытие и сохранение архива
$zip->close();

// Set appropriate permissions on the new file
exec("chmod --reference=index.html \"{$zip_path}\" 2>&1", $chmod_output, $chmod_result);
exec("chown --reference=index.html \"{$zip_path}\" 2>&1", $chown_output, $chown_result);

// Проверка, что архив создан успешно
if (file_exists($zip_path)) {
    $response = [
        'success' => true, 
        'file' => str_replace(__DIR__ . '/', '', $zip_path),
        'message' => 'Archive successfully created'
    ];
    echo json_encode($response);
} else {
    $response = [
        'success' => false,
        'message' => 'Error creating archive'
    ];
    echo json_encode($response);
} 