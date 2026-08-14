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
            $empleado->loadMissing(['departamento', 'sucursal', 'empresa']);

            $width = 680;
            $height = 1080;

            $im = imagecreatetruecolor($width, $height);
            if (!$im) {
                return null;
            }

            // Habilitar alpha y antialiasing
            imagealphablending($im, true);
            imagesavealpha($im, true);

            // Asignación de Colores
            $white     = imagecolorallocate($im, 255, 255, 255);
            $darkGreen = imagecolorallocate($im, 16, 74, 41);     // #104a29
            $black     = imagecolorallocate($im, 26, 32, 44);    // #1a202c
            $red       = imagecolorallocatealpha($im, 211, 18, 42, 20);  // ~rgba(211, 18, 42, 0.85)
            $purple    = imagecolorallocatealpha($im, 88, 28, 93, 25);   // ~rgba(88, 28, 93, 0.8)
            $blue      = imagecolorallocatealpha($im, 16, 117, 188, 25); // ~rgba(16, 117, 188, 0.8)

            // Fondo Blanco
            imagefilledrectangle($im, 0, 0, $width, $height, $white);

            // Manchas orgánicas superiores (Rojo, Morado, Azul)
            imagefilledellipse($im, 100, 30, 200, 120, $red);
            imagefilledellipse($im, 290, 20, 180, 110, $purple);
            imagefilledellipse($im, 460, 15, 190, 100, $blue);

            // Marco verde exterior (Borde grueso de 16px)
            for ($i = 0; $i < 16; $i++) {
                imagerectangle($im, $i, $i, $width - 1 - $i, $height - 1 - $i, $darkGreen);
            }

            // --- 1. Nombre del Empleado (Lado izquierdo) ---
            $nombreCompleto = trim("{$empleado->nombres} {$empleado->apellidos}");
            $palabras = array_filter(explode(' ', $nombreCompleto));

            $yPos = 160;
            foreach ($palabras as $palabra) {
                $wordText = ucfirst(strtolower($palabra));
                imagestring($im, 5, 45, $yPos, $wordText, $black);
                $yPos += 35;
            }

            // --- 2. Foto del Empleado (Lado derecho) ---
            $photoX = 390;
            $photoY = 120;
            $photoW = 230;
            $photoH = 270;

            // Marco verde para la foto
            for ($t = 0; $t < 6; $t++) {
                imagerectangle($im, $photoX - $t, $photoY - $t, $photoX + $photoW + $t, $photoY + $photoH + $t, $darkGreen);
            }

            if (!empty($empleado->foto_empleado)) {
                if (str_starts_with($empleado->foto_empleado, 'data:image')) {
                    $parts = explode(',', $empleado->foto_empleado);
                    if (count($parts) === 2) {
                        $imgData = base64_decode($parts[1]);
                        $userImg = @imagecreatefromstring($imgData);
                        if ($userImg) {
                            imagecopyresampled($im, $userImg, $photoX, $photoY, 0, 0, $photoW, $photoH, imagesx($userImg), imagesy($userImg));
                            imagedestroy($userImg);
                        }
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
                            if ($userImg) {
                                imagecopyresampled($im, $userImg, $photoX, $photoY, 0, 0, $photoW, $photoH, imagesx($userImg), imagesy($userImg));
                                imagedestroy($userImg);
                            }
                        }
                    }
                }
            }

            // --- 3. Franja Central Verde (Departamento y Sucursal) ---
            $bannerY1 = 430;
            $bannerY2 = 610;
            imagefilledrectangle($im, 16, $bannerY1, $width - 16, $bannerY2, $darkGreen);

            $deptoText  = $empleado->departamento->nombre ?? 'General';
            $sucursalText = $empleado->sucursal->nombre ?? 'Principal';

            $deptoX = (int) (($width - (strlen($deptoText) * 12)) / 2);
            imagestring($im, 5, max(30, $deptoX), $bannerY1 + 45, $deptoText, $white);

            $sucursalX = (int) (($width - (strlen($sucursalText) * 12)) / 2);
            imagestring($im, 5, max(30, $sucursalX), $bannerY1 + 105, $sucursalText, $white);

            // --- 4. Código QR (Sección Inferior) ---
            $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" . urlencode($empleado->documento_identidad);
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

            // --- 5. Logotipo institucional (Hoshō) ---
            $logoPath = public_path('image/logo/hosho/lockup.png');
            if (!file_exists($logoPath)) {
                $logoPath = public_path('image/logo/driscolls_logo.png');
            }
            if (file_exists($logoPath)) {
                $logoData = @file_get_contents($logoPath);
                if ($logoData) {
                    $logoImg = @imagecreatefromstring($logoData);
                    if ($logoImg) {
                        $logoW = 340;
                        $logoH = 140;
                        $logoX = (int) (($width - $logoW) / 2);
                        $logoY = 870;
                        imagecopyresampled($im, $logoImg, $logoX, $logoY, 0, 0, $logoW, $logoH, imagesx($logoImg), imagesy($logoImg));
                        imagedestroy($logoImg);
                    }
                }
            }

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

            // --- 5. Logotipo institucional (Hoshō) ---
            $logoPath = public_path('image/logo/hosho/lockup.png');
            if (!file_exists($logoPath)) {
                $logoPath = public_path('image/logo/driscolls_logo.png');
            }
            if (file_exists($logoPath)) {
                $logoData = @file_get_contents($logoPath);
                if ($logoData) {
                    $logoImg = @imagecreatefromstring($logoData);
                    if ($logoImg) {
                        $logoW = 340;
                        $logoH = 140;
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

            // --- 5. Logotipo institucional (Hoshō) ---
            $logoPath = public_path('image/logo/hosho/lockup.png');
            if (!file_exists($logoPath)) {
                $logoPath = public_path('image/logo/driscolls_logo.png');
            }
            if (file_exists($logoPath)) {
                $logoData = @file_get_contents($logoPath);
                if ($logoData) {
                    $logoImg = @imagecreatefromstring($logoData);
                    if ($logoImg) {
                        $logoW = 340;
                        $logoH = 140;
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
