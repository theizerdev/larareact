<?php

namespace Database\Seeders;

use App\Models\Marca;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class MarcaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brands = [
            [
                'nombre' => 'Apple',
                'slug' => 'apple',
                'descripcion' => 'Apple Inc. is an American multinational technology company.',
                'sitio_web' => 'https://www.apple.com',
                'color' => '#111111',
                'activo' => true,
            ],
            [
                'nombre' => 'Samsung',
                'slug' => 'samsung',
                'descripcion' => 'Samsung Electronics is a South Korean multinational electronics corporation.',
                'sitio_web' => 'https://www.samsung.com',
                'color' => '#1428A0',
                'activo' => true,
            ],
            [
                'nombre' => 'Sony',
                'slug' => 'sony',
                'descripcion' => 'Sony Group Corporation is a Japanese multinational conglomerate corporation.',
                'sitio_web' => 'https://www.sony.com',
                'color' => '#000000',
                'activo' => true,
            ],
            [
                'nombre' => 'Nike',
                'slug' => 'nike',
                'descripcion' => 'Nike, Inc. is an American multinational corporation.',
                'sitio_web' => 'https://www.nike.com',
                'color' => '#E7252F',
                'activo' => true,
            ],
            [
                'nombre' => 'Adidas',
                'slug' => 'adidas',
                'descripcion' => 'Adidas AG is a German multinational corporation.',
                'sitio_web' => 'https://www.adidas.com',
                'color' => '#005CA9',
                'activo' => true,
            ],
            [
                'nombre' => 'Dell',
                'slug' => 'dell',
                'descripcion' => 'Dell Inc. is an American multinational technology company.',
                'sitio_web' => 'https://www.dell.com',
                'color' => '#007DB8',
                'activo' => true,
            ],
        ];

        // Directorio de marcas
        $directory = 'marcas';
        Storage::disk('public')->makeDirectory($directory);

        foreach ($brands as $brand) {
            $filename = $brand['slug'] . '.png';
            $relativePath = $directory . '/' . $filename;
            $fullPath = Storage::disk('public')->path($relativePath);

            // Generar imagen programáticamente si no existe
            if (!Storage::disk('public')->exists($relativePath)) {
                $img = imagecreatetruecolor(200, 200);
                
                // Color de fondo
                list($r, $g, $b) = sscanf($brand['color'], "#%02x%02x%02x");
                $bgColor = imagecolorallocate($img, $r, $g, $b);
                imagefill($img, 0, 0, $bgColor);
                
                // Color de texto
                $textColor = imagecolorallocate($img, 255, 255, 255);
                
                // Centrar texto
                $text = $brand['nombre'];
                $font = 5; // Fuente por defecto de GD
                $charWidth = imagefontwidth($font);
                $charHeight = imagefontheight($font);
                $textWidth = $charWidth * strlen($text);
                $x = (200 - $textWidth) / 2;
                $y = (200 - $charHeight) / 2;
                
                imagestring($img, $font, (int)$x, (int)$y, $text, $textColor);
                
                // Guardar la imagen en storage/app/public/marcas/
                imagepng($img, $fullPath);
                imagedestroy($img);
            }

            // Crear o actualizar la marca
            Marca::updateOrCreate(
                ['slug' => $brand['slug']],
                [
                    'nombre' => $brand['nombre'],
                    'descripcion' => $brand['descripcion'],
                    'sitio_web' => $brand['sitio_web'],
                    'imagen' => '/storage/' . $relativePath,
                    'activo' => $brand['activo'],
                ]
            );
        }
    }
}
