<?php
$file = 'public/image/logo/certifications/sox.png';
$im = imagecreatefrompng($file);
imagealphablending($im, false);
imagesavealpha($im, true);

$w = imagesx($im);
$h = imagesy($im);

$transparent = imagecolorallocatealpha($im, 0, 0, 0, 127);

// Rosette center is around ($w/2, $h/2)
$cx = $w / 2;
$cy = $h / 2;
$maxR = min($w, $h) / 2;

// BFS floodfill from corners
$visited = array_fill(0, $w, array_fill(0, $h, false));
$queue = [];

$corners = [
    [0, 0], [$w - 1, 0], [0, $h - 1], [$w - 1, $h - 1],
    [0, 5], [5, 0], [$w - 1, 5], [$w - 6, 0],
    [0, $h - 6], [5, $h - 1], [$w - 1, $h - 6], [$w - 6, $h - 1]
];

foreach ($corners as $c) {
    $queue[] = $c;
    $visited[$c[0]][$c[1]] = true;
}

while (!empty($queue)) {
    [$x, $y] = array_shift($queue);
    
    $rgba = imagecolorat($im, $x, $y);
    $r = ($rgba >> 16) & 0xFF;
    $g = ($rgba >> 8) & 0xFF;
    $b = $rgba & 0xFF;
    $a = ($rgba >> 24) & 0x7F;

    // Check if pixel is part of the blue rosette:
    // Rosette color is steel blue: B > 120 and B > R+15
    $isRosette = ($b > 115 && $b > ($r + 15) && $g > ($r + 5) && $r < 155);

    if (!$isRosette) {
        imagesetpixel($im, $x, $y, $transparent);

        $neighbors = [
            [$x + 1, $y],
            [$x - 1, $y],
            [$x, $y + 1],
            [$x, $y - 1]
        ];

        foreach ($neighbors as [$nx, $ny]) {
            if ($nx >= 0 && $nx < $w && $ny >= 0 && $ny < $h) {
                if (!$visited[$nx][$ny]) {
                    $visited[$nx][$ny] = true;
                    $nColor = imagecolorat($im, $nx, $ny);
                    $nr = ($nColor >> 16) & 0xFF;
                    $ng = ($nColor >> 8) & 0xFF;
                    $nb = $nColor & 0xFF;
                    $nIsRosette = ($nb > 115 && $nb > ($nr + 15) && $ng > ($nr + 5) && $nr < 155);
                    if (!$nIsRosette) {
                        $queue[] = [$nx, $ny];
                    }
                }
            }
        }
    }
}

imagepng($im, $file, 9);
imagedestroy($im);
echo "Transparent PNG generated successfully!\n";
