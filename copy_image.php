<?php

$src = 'C:\\Users\\Theizer\\.gemini\\antigravity-ide\\brain\\ad4d32c3-a13b-491c-ab36-891d93cca509\\media__1785954510709.png';
$dest = __DIR__ . '/public/image/dashboard-preview.png';

if (file_exists($src)) {
    copy($src, $dest);
    echo "COPIED OK (" . filesize($dest) . " bytes)\n";
} else {
    echo "SRC NOT FOUND\n";
}
