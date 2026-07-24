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

            // --- 5. Logotipo Driscoll's ---
            $logoPath = public_path('image/logo/larareact_logo_transparent.png');
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
}
