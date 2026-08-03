<?php
header('Content-Type: text/plain');

$dir = __DIR__ . '/image/logo';
echo "chmod dir: " . (chmod($dir, 0777) ? "OK" : "FAILED") . "\n";

$tmpFile = '/tmp/larareact_logo_white.png';
$dest1 = $dir . '/larareact_logo_white.png';
$dest2 = $dir . '/larareact_logo_transparent_white.png';

echo "copy 1: " . (copy($tmpFile, $dest1) ? "OK" : "FAILED") . "\n";
echo "copy 2: " . (copy($tmpFile, $dest2) ? "OK" : "FAILED") . "\n";
