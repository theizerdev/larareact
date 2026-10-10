<?php

namespace App\Services;

use App\Models\Empleado;
use Illuminate\Support\Facades\Log;

class CarnetGeneratorService
{
    /**
     * Genera la imagen PNG del carnet del empleado y retorna la ruta absoluta del archivo.
     */
    public static function generarCarnetPNG(Empleado $empleado): ?string
    {
        try {
            $empleado->loadMissing(['departamento', 'cargo', 'sucursal', 'empresa']);

            $width = 680;
            $height = 1140;

            $im = imagecreatetruecolor($width, $height);
            if (!$im) {
                return null;
            }

            // Habilitar alpha
            imagealphablending($im, true);
            imagesavealpha($im, true);

            // Colores corporativos Smurfit Westrock
            $white      = imagecolorallocate($im, 255, 255, 255);
            $navyBg     = imagecolorallocate($im, 14, 42, 109);     // #0e2a6d
            $navyDark   = imagecolorallocate($im, 8, 26, 66);      // #081a42
            $cyan       = imagecolorallocate($im, 0, 163, 224);     // #00a3e0
            $slotBg     = imagecolorallocate($im, 5, 15, 36);      // #050f24
            $slotBorder = imagecolorallocate($im, 60, 90, 150);

            // Fondo con degradado o relleno navy
            for ($y = 0; $y < $height; $y++) {
                $factor = $y / $height;
                $r = (int) (16 * (1 - $factor) + 8 * $factor);
                $g = (int) (46 * (1 - $factor) + 26 * $factor);
                $b = (int) (109 * (1 - $factor) + 66 * $factor);
                $color = imagecolorallocate($im, $r, $g, $b);
                imageline($im, 0, $y, $width, $y, $color);
            }

            // Borde exterior blanco fino
            imagerectangle($im, 2, 2, $width - 3, $height - 3, imagecolorallocatealpha($im, 255, 255, 255, 60));
            imagerectangle($im, 3, 3, $width - 4, $height - 4, imagecolorallocatealpha($im, 255, 255, 255, 60));

            // 1. Ranura superior (Lanyard Slot)
            $slotW = 108;
            $slotH = 26;
            $slotX = (int) (($width - $slotW) / 2);
            $slotY = 24;
            imagefilledrectangle($im, $slotX, $slotY, $slotX + $slotW, $slotY + $slotH, $slotBg);
            imagerectangle($im, $slotX, $slotY, $slotX + $slotW, $slotY + $slotH, $slotBorder);

            // 2. Logotipo Smurfit Westrock
            $logoPath = public_path('image/logo/clientes/smurfit-westrock-logo-dark.png');
            if (!file_exists($logoPath)) {
                $logoPath = public_path('image/logo/clientes/smurfit-westrock-logo.png');
            }
            if (file_exists($logoPath)) {
                $logoData = @file_get_contents($logoPath);
                if ($logoData) {
                    $logoImg = @imagecreatefromstring($logoData);
                    if ($logoImg) {
                        $origW = imagesx($logoImg);
                        $origH = imagesy($logoImg);
                        $logoTargetH = 72;
                        $logoTargetW = (int) ($origW * ($logoTargetH / $origH));
                        $logoX = (int) (($width - $logoTargetW) / 2);
                        $logoY = 75;
                        imagecopyresampled($im, $logoImg, $logoX, $logoY, 0, 0, $logoTargetW, $logoTargetH, $origW, $origH);
                        imagedestroy($logoImg);
                    }
                }
            }

            // 3. Foto del Empleado centrada con brackets cian
            $photoW = 280;
            $photoH = 330;
            $photoX = (int) (($width - $photoW) / 2);
            $photoY = 175;

            // Foto contenedor blanco/neutro
            imagefilledrectangle($im, $photoX, $photoY, $photoX + $photoW, $photoY + $photoH, $white);

            if (!empty($empleado->foto_empleado)) {
                $userImg = null;
                if (str_starts_with($empleado->foto_empleado, 'data:image')) {
                    $parts = explode(',', $empleado->foto_empleado);
                    if (count($parts) === 2) {
                        $imgData = base64_decode($parts[1]);
                        $userImg = @imagecreatefromstring($imgData);
                    }
                } else {
                    $fullPath = storage_path('app/public/' . ltrim($empleado->foto_empleado, '/'));
                    if (!file_exists($fullPath)) {
                        $fullPath = public_path(ltrim($empleado->foto_empleado, '/'));
                    }
                    if (file_exists($fullPath)) {
                        $imgData = @file_get_contents($fullPath);
                        if ($imgData) {
                            $userImg = @imagecreatefromstring($imgData);
                        }
                    }
                }

                if ($userImg) {
                    imagecopyresampled($im, $userImg, $photoX, $photoY, 0, 0, $photoW, $photoH, imagesx($userImg), imagesy($userImg));
                    imagedestroy($userImg);
                }
            }

            // Brackets cian (Superior Derecho e Inferior Izquierdo)
            $bracketThick = 7;
            $bracketArmW = 65;
            $bracketArmH = 85;
            $offset = 12;

            // Bracket Superior Derecho
            $trX = $photoX + $photoW + $offset;
            $trY = $photoY - $offset;
            imagefilledrectangle($im, $trX - $bracketArmW, $trY, $trX, $trY + $bracketThick, $cyan);
            imagefilledrectangle($im, $trX - $bracketThick, $trY, $trX, $trY + $bracketArmH, $cyan);

            // Bracket Inferior Izquierdo
            $blX = $photoX - $offset;
            $blY = $photoY + $photoH + $offset;
            imagefilledrectangle($im, $blX, $blY - $bracketThick, $blX + $bracketArmW, $blY, $cyan);
            imagefilledrectangle($im, $blX, $blY - $bracketArmH, $blX + $bracketThick, $blY, $cyan);

            // 4. Nombre y Apellidos
            $nombres = mb_strtoupper($empleado->nombres, 'UTF-8');
            $apellidos = mb_strtoupper($empleado->apellidos, 'UTF-8');
            $nomX = (int) (($width - (strlen($nombres) * 9.5)) / 2);
            imagestring($im, 5, max(30, $nomX), 540, $nombres, $white);
            $apeX = (int) (($width - (strlen($apellidos) * 9.5)) / 2);
            imagestring($im, 5, max(30, $apeX), 570, $apellidos, $white);

            // 5. NSS y Código de Empleado (ID)
            $nssStr = 'NSS: ' . ($empleado->curp ?? $empleado->documento_identidad ?? '---');
            $nssX = (int) (($width - (strlen($nssStr) * 9.5)) / 2);
            imagestring($im, 5, max(30, $nssX), 620, $nssStr, $white);

            $accessCode = $empleado->codigo_acceso ?? $empleado->documento_identidad ?? (string) $empleado->id;
            $idStr = 'ID: ' . $accessCode;
            $idX = (int) (($width - (strlen($idStr) * 9.5)) / 2);
            imagestring($im, 5, max(30, $idX), 655, $idStr, $white);

            // 6. Código QR
            $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" . urlencode($accessCode) . "&color=0a1c42";
            $qrData = @file_get_contents($qrUrl);
            if ($qrData) {
                $qrImg = @imagecreatefromstring($qrData);
                if ($qrImg) {
                    $qrBgSize = 160;
                    $qrSize = 144;
                    $qrBgX = (int) (($width - $qrBgSize) / 2);
                    $qrBgY = 720;
                    // Caja blanca para el QR
                    imagefilledrectangle($im, $qrBgX, $qrBgY, $qrBgX + $qrBgSize, $qrBgY + $qrBgSize, $white);
                    imagerectangle($im, $qrBgX, $qrBgY, $qrBgX + $qrBgSize, $qrBgY + $qrBgSize, $cyan);
                    imagecopyresampled($im, $qrImg, $qrBgX + 8, $qrBgY + 8, 0, 0, $qrSize, $qrSize, imagesx($qrImg), imagesy($qrImg));
                    imagedestroy($qrImg);
                }
            }

            // 7. Cargo y Departamento en la base
            $cargoTxt = mb_strtoupper($empleado->cargo?->nombre ?? $empleado->departamento?->nombre ?? 'CONTROL DE ACCESO', 'UTF-8');
            $cargX = (int) (($width - (strlen($cargoTxt) * 9.5)) / 2);
            imagestring($im, 5, max(30, $cargX), 915, $cargoTxt, $cyan);

            // Guardar imagen en storage
            $directory = storage_path('app/public/carnets');
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            $filePath = $directory . "/carnet_{$empleado->id}.png";
            imagepng($im, $filePath, 9);
            imagedestroy($im);

            return file_exists($filePath) ? $filePath : null;

        } catch (\Exception $e) {
            Log::error('Error generando imagen PNG de carnet: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Genera la imagen PNG del carnet / gafete rojo del proveedor.
     */
    public static function generarCarnetProveedorPNG(\App\Models\Proveedor $proveedor): ?string
    {
        try {
            $proveedor->loadMissing(['sucursal', 'empresa']);

            $width = 680;
            $height = 1080;

            $im = imagecreatetruecolor($width, $height);
            if (!$im) {
                return null;
            }

            imagealphablending($im, true);
            imagesavealpha($im, true);

            // Asignación de Colores para el Gafete ROJO del Proveedor
            $white    = imagecolorallocate($im, 255, 255, 255);
            $redTheme = imagecolorallocate($im, 185, 28, 28);    // #b91c1c (Rojo Intenso)
            $black    = imagecolorallocate($im, 26, 32, 44);    // #1a202c
            $redDark  = imagecolorallocatealpha($im, 153, 27, 27, 20); // ~rgba(153, 27, 27, 0.85)
            $amber    = imagecolorallocatealpha($im, 217, 119, 6, 25);  // ~rgba(217, 119, 6, 0.8)
            $rose     = imagecolorallocatealpha($im, 225, 29, 72, 25);  // ~rgba(225, 29, 72, 0.8)

            // Fondo Blanco
            imagefilledrectangle($im, 0, 0, $width, $height, $white);

            // Manchas orgánicas superiores en tonalidades rojas
            imagefilledellipse($im, 100, 30, 200, 120, $redDark);
            imagefilledellipse($im, 290, 20, 180, 110, $amber);
            imagefilledellipse($im, 460, 15, 190, 100, $rose);

            // Marco ROJO exterior (Borde grueso de 16px)
            for ($i = 0; $i < 16; $i++) {
                imagerectangle($im, $i, $i, $width - 1 - $i, $height - 1 - $i, $redTheme);
            }

            // --- 1. Nombre / Razón Social del Proveedor (Lado izquierdo) ---
            $nombreDisplay = trim($proveedor->nombre_comercial ?: $proveedor->razon_social);
            $palabras = array_filter(explode(' ', $nombreDisplay));

            $yPos = 150;
            foreach (array_slice($palabras, 0, 5) as $palabra) {
                $wordText = ucfirst(strtolower($palabra));
                imagestring($im, 5, 45, $yPos, $wordText, $black);
                $yPos += 35;
            }

            // --- 2. Marco Foto / Icono (Lado derecho) ---
            $photoX = 390;
            $photoY = 120;
            $photoW = 230;
            $photoH = 270;

            for ($t = 0; $t < 6; $t++) {
                imagerectangle($im, $photoX - $t, $photoY - $t, $photoX + $photoW + $t, $photoY + $photoH + $t, $redTheme);
            }

            // --- 3. Franja Central ROJA (PROVEEDOR AUTORIZADO) ---
            $bannerY1 = 430;
            $bannerY2 = 610;
            imagefilledrectangle($im, 16, $bannerY1, $width - 16, $bannerY2, $redTheme);

            $tituloText = "PROVEEDOR";
            $docValue = $proveedor->rfc ?: ($proveedor->documento_identidad ?: 'N/A');
            $subText = "RFC: " . $docValue;

            $tituloX = (int) (($width - (strlen($tituloText) * 14)) / 2);
            imagestring($im, 5, max(30, $tituloX), $bannerY1 + 45, $tituloText, $white);

            $subX = (int) (($width - (strlen($subText) * 10)) / 2);
            imagestring($im, 5, max(30, $subX), $bannerY1 + 105, $subText, $white);

            // --- 4. Código QR ---
            $qrCodeData = $proveedor->curp ?: ($proveedor->rfc ?: ($proveedor->documento_identidad ?: "PROV_{$proveedor->id}"));
            $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" . urlencode($qrCodeData) . "&color=b91c1c";
            $qrData = @file_get_contents($qrUrl);
            if ($qrData) {
                $qrImg = @imagecreatefromstring($qrData);
                if ($qrImg) {
                    $qrSize = 190;
                    $qrX = (int) (($width - $qrSize) / 2);
                    $qrY = 640;
                    imagecopyresampled($im, $qrImg, $qrX, $qrY, 0, 0, $qrSize, $qrSize, imagesx($qrImg), imagesy($qrImg));
                    imagedestroy($qrImg);
                }
            }

            // --- 5. Logotipo institucional (Smurfit Westrock) ---
            $logoPath = public_path('image/logo/clientes/smurfit-westrock-logo.png');
            if (file_exists($logoPath)) {
                $logoData = @file_get_contents($logoPath);
                if ($logoData) {
                    $logoImg = @imagecreatefromstring($logoData);
                    if ($logoImg) {
                        // Alto según la proporción del logo, sin pasar de 140 px.
                        $logoW = 340;
                        $logoH = min(140, (int) round($logoW * imagesy($logoImg) / imagesx($logoImg)));
                        $logoX = (int) (($width - $logoW) / 2);
                        $logoY = 870;
                        imagecopyresampled($im, $logoImg, $logoX, $logoY, 0, 0, $logoW, $logoH, imagesx($logoImg), imagesy($logoImg));
                        imagedestroy($logoImg);
                    }
                }
            }

            $directory = storage_path('app/public/carnets');
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            $filePath = $directory . "/carnet_proveedor_{$proveedor->id}.png";
            imagepng($im, $filePath, 9);
            imagedestroy($im);

            return file_exists($filePath) ? $filePath : null;

        } catch (\Exception $e) {
            Log::error('Error generando PNG carnet proveedor: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Genera la imagen PNG del carnet / gafete azul del productor.
     */
    public static function generarCarnetProductorPNG(\App\Models\Productor $productor): ?string
    {
        try {
            $productor->loadMissing(['sucursal', 'empresa']);

            $width = 680;
            $height = 1080;

            $im = imagecreatetruecolor($width, $height);
            if (!$im) {
                return null;
            }

            imagealphablending($im, true);
            imagesavealpha($im, true);

            // Asignación de Colores para el Gafete AZUL del Productor
            $white     = imagecolorallocate($im, 255, 255, 255);
            $blueTheme = imagecolorallocate($im, 29, 78, 216);    // #1d4ed8 (Azul Rey / Intenso)
            $black     = imagecolorallocate($im, 26, 32, 44);    // #1a202c
            $blueDark  = imagecolorallocatealpha($im, 30, 58, 138, 20); // ~rgba(30, 58, 138, 0.85)
            $cyan      = imagecolorallocatealpha($im, 14, 165, 233, 25); // ~rgba(14, 165, 233, 0.8)
            $indigo    = imagecolorallocatealpha($im, 67, 56, 202, 25);  // ~rgba(67, 56, 202, 0.8)

            // Fondo Blanco
            imagefilledrectangle($im, 0, 0, $width, $height, $white);

            // Manchas orgánicas superiores en tonalidades azules
            imagefilledellipse($im, 100, 30, 200, 120, $blueDark);
            imagefilledellipse($im, 290, 20, 180, 110, $cyan);
            imagefilledellipse($im, 460, 15, 190, 100, $indigo);

            // Marco AZUL exterior (Borde grueso de 16px)
            for ($i = 0; $i < 16; $i++) {
                imagerectangle($im, $i, $i, $width - 1 - $i, $height - 1 - $i, $blueTheme);
            }

            // --- 1. Nombre / Razón Social del Productor (Lado izquierdo) ---
            $nombreDisplay = trim($productor->nombre_comercial ?: $productor->razon_social);
            $palabras = array_filter(explode(' ', $nombreDisplay));

            $yPos = 150;
            foreach (array_slice($palabras, 0, 5) as $palabra) {
                $wordText = ucfirst(strtolower($palabra));
                imagestring($im, 5, 45, $yPos, $wordText, $black);
                $yPos += 35;
            }

            // --- 2. Marco Foto / Icono (Lado derecho) ---
            $photoX = 390;
            $photoY = 120;
            $photoW = 230;
            $photoH = 270;

            for ($t = 0; $t < 6; $t++) {
                imagerectangle($im, $photoX - $t, $photoY - $t, $photoX + $photoW + $t, $photoY + $photoH + $t, $blueTheme);
            }

            // --- 3. Franja Central AZUL (PRODUCTOR AUTORIZADO) ---
            $bannerY1 = 430;
            $bannerY2 = 610;
            imagefilledrectangle($im, 16, $bannerY1, $width - 16, $bannerY2, $blueTheme);

            $tituloText = "PRODUCTOR";
            $docValue = $productor->rfc ?: ($productor->documento_identidad ?: 'N/A');
            $subText = "RFC: " . $docValue;

            $tituloX = (int) (($width - (strlen($tituloText) * 14)) / 2);
            imagestring($im, 5, max(30, $tituloX), $bannerY1 + 45, $tituloText, $white);

            $subX = (int) (($width - (strlen($subText) * 10)) / 2);
            imagestring($im, 5, max(30, $subX), $bannerY1 + 105, $subText, $white);

            // --- 4. Código QR ---
            $qrCodeData = $productor->curp ?: ($productor->rfc ?: ($productor->documento_identidad ?: "PROD_{$productor->id}"));
            $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" . urlencode($qrCodeData) . "&color=1d4ed8";
            $qrData = @file_get_contents($qrUrl);
            if ($qrData) {
                $qrImg = @imagecreatefromstring($qrData);
                if ($qrImg) {
                    $qrSize = 190;
                    $qrX = (int) (($width - $qrSize) / 2);
                    $qrY = 640;
                    imagecopyresampled($im, $qrImg, $qrX, $qrY, 0, 0, $qrSize, $qrSize, imagesx($qrImg), imagesy($qrImg));
                    imagedestroy($qrImg);
                }
            }

            // --- 5. Logotipo institucional (Smurfit Westrock) ---
            $logoPath = public_path('image/logo/clientes/smurfit-westrock-logo.png');
            if (file_exists($logoPath)) {
                $logoData = @file_get_contents($logoPath);
                if ($logoData) {
                    $logoImg = @imagecreatefromstring($logoData);
                    if ($logoImg) {
                        // Alto según la proporción del logo, sin pasar de 140 px.
                        $logoW = 340;
                        $logoH = min(140, (int) round($logoW * imagesy($logoImg) / imagesx($logoImg)));
                        $logoX = (int) (($width - $logoW) / 2);
                        $logoY = 870;
                        imagecopyresampled($im, $logoImg, $logoX, $logoY, 0, 0, $logoW, $logoH, imagesx($logoImg), imagesy($logoImg));
                        imagedestroy($logoImg);
                    }
                }
            }

            $directory = storage_path('app/public/carnets');
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            $filePath = $directory . "/carnet_productor_{$productor->id}.png";
            imagepng($im, $filePath, 9);
            imagedestroy($im);

            return file_exists($filePath) ? $filePath : null;

        } catch (\Exception $e) {
            Log::error('Error generando PNG carnet productor: ' . $e->getMessage());
            return null;
        }
    }
}
