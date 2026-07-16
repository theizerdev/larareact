<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class CategoriaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            // Principal: Tecnología
            [
                'nombre' => 'Technology',
                'slug' => 'technology',
                'descripcion' => 'Laptops, smartphones, smart home devices, and accessories.',
                'color' => '#3b82f6',
                'parent' => null,
                'activo' => true,
            ],
            // Sub: Computación
            [
                'nombre' => 'Computers',
                'slug' => 'computers',
                'descripcion' => 'Desktop computers, laptops, and computer parts.',
                'color' => '#1d4ed8',
                'parent' => 'technology',
                'activo' => true,
            ],
            // Sub: Smartphones
            [
                'nombre' => 'Smartphones',
                'slug' => 'smartphones',
                'descripcion' => 'Mobile phones, smartphones, and mobile accessories.',
                'color' => '#1e3a8a',
                'parent' => 'technology',
                'activo' => true,
            ],
            // Principal: Moda
            [
                'nombre' => 'Fashion',
                'slug' => 'fashion',
                'descripcion' => 'Men, women, and kids clothing, shoes, and accessories.',
                'color' => '#ec4899',
                'parent' => null,
                'activo' => true,
            ],
            // Sub: Ropa
            [
                'nombre' => 'Clothing',
                'slug' => 'clothing',
                'descripcion' => 'T-shirts, shirts, pants, jackets, and dresses.',
                'color' => '#db2777',
                'parent' => 'fashion',
                'activo' => true,
            ],
            // Sub: Zapatos
            [
                'nombre' => 'Shoes',
                'slug' => 'shoes',
                'descripcion' => 'Sneakers, running shoes, boots, and formal footwear.',
                'color' => '#be185d',
                'parent' => 'fashion',
                'activo' => true,
            ],
            // Principal: Hogar
            [
                'nombre' => 'Home',
                'slug' => 'home',
                'descripcion' => 'Furniture, home decor, kitchenware, and household appliances.',
                'color' => '#10b981',
                'parent' => null,
                'activo' => true,
            ],
            // Sub: Muebles
            [
                'nombre' => 'Furniture',
                'slug' => 'furniture',
                'descripcion' => 'Beds, sofas, tables, chairs, and shelving.',
                'color' => '#047857',
                'parent' => 'home',
                'activo' => true,
            ],
            // Sub: Cocina
            [
                'nombre' => 'Kitchen',
                'slug' => 'kitchen',
                'descripcion' => 'Cooking tools, cutlery, plates, and small kitchen appliances.',
                'color' => '#064e3b',
                'parent' => 'home',
                'activo' => true,
            ],
            // Principal: Deportes
            [
                'nombre' => 'Sports',
                'slug' => 'sports',
                'descripcion' => 'Gym equipment, fitness gear, sportswear, and outdoor items.',
                'color' => '#f59e0b',
                'parent' => null,
                'activo' => true,
            ],
        ];

        // Directorio de almacenamiento para las categorías
        $directory = 'categorias';
        Storage::disk('public')->makeDirectory($directory);

        foreach ($categories as $cat) {
            $filename = $cat['slug'] . '.png';
            $relativePath = $directory . '/' . $filename;
            $fullPath = Storage::disk('public')->path($relativePath);

            // Generar imagen programáticamente si no existe
            if (!Storage::disk('public')->exists($relativePath)) {
                $img = imagecreatetruecolor(200, 200);

                // Color de fondo
                list($r, $g, $b) = sscanf($cat['color'], "#%02x%02x%02x");
                $bgColor = imagecolorallocate($img, $r, $g, $b);
                imagefill($img, 0, 0, $bgColor);

                // Color de texto (blanco)
                $textColor = imagecolorallocate($img, 255, 255, 255);

                // Obtener las iniciales
                $words = explode(' ', $cat['nombre']);
                $initials = '';
                foreach ($words as $w) {
                    $initials .= strtoupper(substr($w, 0, 1));
                }
                if (strlen($initials) > 3) {
                    $initials = substr($initials, 0, 3);
                }

                $font = 5; // Fuente estándar de GD
                $charWidth = imagefontwidth($font);
                $charHeight = imagefontheight($font);
                $textWidth = $charWidth * strlen($initials);
                $x = (200 - $textWidth) / 2;
                $y = (200 - $charHeight) / 2;

                imagestring($img, $font, (int)$x, (int)$y, $initials, $textColor);

                // Guardar la imagen en storage/app/public/categorias/
                imagepng($img, $fullPath);
                imagedestroy($img);
            }

            // Encontrar parent_id
            $parentId = null;
            if ($cat['parent']) {
                $parentObj = Categoria::where('slug', $cat['parent'])->first();
                if ($parentObj) {
                    $parentId = $parentObj->id;
                }
            }

            // Crear o actualizar la categoría
            Categoria::updateOrCreate(
                ['slug' => $cat['slug']],
                [
                    'nombre' => $cat['nombre'],
                    'parent_id' => $parentId,
                    'descripcion' => $cat['descripcion'],
                    'imagen' => '/storage/' . $relativePath,
                    'activo' => $cat['activo'],
                ]
            );
        }
    }
}
