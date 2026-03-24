<?php
declare(strict_types=1);

/**
 * Serves the most recently modified *.pdf from the PDF/ folder so the CV
 * filename can change without updating HTML or JSON. Requires PHP (e.g. php -S).
 */
header('X-Content-Type-Options: nosniff');

$dir = __DIR__ . DIRECTORY_SEPARATOR . 'PDF';
if (!is_dir($dir)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'PDF folder not found.';
    exit;
}

$files = glob($dir . DIRECTORY_SEPARATOR . '*.pdf');
if ($files === false || $files === []) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'No PDF file found in the PDF folder.';
    exit;
}

usort($files, static function (string $a, string $b): int {
    return filemtime($b) <=> filemtime($a);
});

$file = $files[0];
$size = filesize($file);
if ($size === false) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Could not read resume file.';
    exit;
}

$basename = basename($file);

header('Content-Type: application/pdf');
header('Content-Length: ' . (string) $size);
// UTF-8 filename for non-ASCII names; ASCII fallback for older clients
$asciiFallback = preg_replace('/[^\x20-\x7E]/', '_', $basename) ?: 'resume.pdf';
header(
    'Content-Disposition: attachment; filename="' . str_replace(['\\', '"'], '', $asciiFallback)
    . '"; filename*=UTF-8\'\'' . rawurlencode($basename)
);

readfile($file);
