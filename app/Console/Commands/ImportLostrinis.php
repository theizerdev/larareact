<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

#[Signature('app:import-lostrinis')]
#[Description('Import categories, brands, products, and variants from abastolostrinis.sql and map them to standard tables.')]
class ImportLostrinis extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Starting database integration from abastolostrinis.sql...');

        $sqlPath = base_path('abastolostrinis.sql');
        if (! file_exists($sqlPath)) {
            $this->error("❌ SQL dump file not found at: {$sqlPath}");

            return 1;
        }

        $this->info('Reading SQL dump file...');
        $sqlContent = file_get_contents($sqlPath);

        $this->info('Disabling foreign key checks...');
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        try {
            $this->info('Importing raw SQL dump into staging tables...');
            // Execute the raw SQL multi-statements
            DB::unprepared($sqlContent);
            $this->info('Staging tables imported successfully.');

            // Truncate/delete existing records from standard tables
            $this->warn('Clearing existing catalog tables...');
            DB::table('wishlists')->delete();
            DB::table('reviews')->delete();
            DB::table('product_variant_attribute_values')->delete();
            DB::table('product_variants')->delete();
            DB::table('product_images')->delete();
            DB::table('product_attribute_values')->delete();
            DB::table('products')->delete();
            DB::table('brands')->delete();
            DB::table('categories')->delete();
            $this->info('Existing catalog data cleared.');

            // 1. Migrate Categories
            $this->info('Migrating categories...');
            $stagingCategorias = DB::table('categorias')->get();
            $categoryCount = 0;
            foreach ($stagingCategorias as $cat) {
                DB::table('categories')->insert([
                    'id' => $cat->id,
                    'parent_id' => null,
                    'nombre' => $cat->nombre,
                    'slug' => $cat->slug,
                    'descripcion' => $cat->descripcion,
                    'imagen' => null,
                    'orden' => 0,
                    'meta_title' => null,
                    'meta_description' => null,
                    'status' => $cat->activo,
                    'empresa_id' => $cat->empresa_id,
                    'sucursal_id' => $cat->sucursal_id,
                    'created_at' => $cat->created_at ?? now(),
                    'updated_at' => $cat->updated_at ?? now(),
                ]);
                $categoryCount++;
            }
            $this->info("✓ {$categoryCount} categories imported.");

            // 2. Migrate Brands
            $this->info('Migrating brands...');
            $stagingMarcas = DB::table('marcas')->get();
            $brandCount = 0;
            foreach ($stagingMarcas as $brand) {
                DB::table('brands')->insert([
                    'id' => $brand->id,
                    'nombre' => $brand->nombre,
                    'slug' => $brand->slug,
                    'descripcion' => $brand->descripcion,
                    'logo' => null,
                    'website' => null,
                    'status' => $brand->activo,
                    'empresa_id' => $brand->empresa_id,
                    'sucursal_id' => $brand->sucursal_id,
                    'created_at' => $brand->created_at ?? now(),
                    'updated_at' => $brand->updated_at ?? now(),
                ]);
                $brandCount++;
            }
            $this->info("✓ {$brandCount} brands imported.");

            // 3. Migrate Products
            $this->info('Migrating products...');
            $stagingProductos = DB::table('productos')->get();
            $productCount = 0;
            $usedSlugs = [];

            foreach ($stagingProductos as $prod) {
                $sku = $prod->code ?: $prod->sku;
                if (empty($sku)) {
                    $sku = 'PRD-'.strtoupper(Str::random(8));
                }

                // Ensure unique slug
                $baseSlug = Str::slug($prod->name);
                $slug = $baseSlug;
                $counter = 1;
                while (in_array($slug, $usedSlugs) || DB::table('products')->where('slug', $slug)->exists()) {
                    $slug = $baseSlug.'-'.$counter;
                    $counter++;
                }
                $usedSlugs[] = $slug;

                DB::table('products')->insert([
                    'id' => $prod->id,
                    'nombre' => $prod->name,
                    'slug' => $slug,
                    'sku' => $sku,
                    'descripcion_corta' => null,
                    'descripcion' => $prod->description,
                    'precio' => $prod->price,
                    'precio_oferta' => null,
                    'precio_compra' => null,
                    'precio_bs' => $prod->precio_bs ?? 0,
                    'stock' => $prod->quantity,
                    'stock_minimo' => $prod->quantity_alert,
                    'rastrear_inventario' => $prod->track_inventory,
                    'peso' => null,
                    'largo' => null,
                    'ancho' => null,
                    'alto' => null,
                    'category_id' => $prod->categoria_id,
                    'brand_id' => $prod->marca_id,
                    'tiene_variantes' => $prod->has_variants,
                    'destacado' => $prod->featured,
                    'nuevo' => false,
                    'fecha_publicacion' => null,
                    'meta_title' => $prod->meta_title,
                    'meta_description' => $prod->meta_description,
                    'imagen_principal' => null,
                    'video_url' => null,
                    'status' => $prod->status,
                    'empresa_id' => $prod->empresa_id,
                    'sucursal_id' => $prod->sucursal_id,
                    'created_at' => $prod->created_at ?? now(),
                    'updated_at' => $prod->updated_at ?? now(),
                ]);
                $productCount++;
            }
            $this->info("✓ {$productCount} products imported.");

            // 4. Migrate Product Variants
            $this->info('Migrating product variants and dynamic attributes...');
            $stagingVariants = DB::table('producto_variants')->get();
            $variantCount = 0;
            $usedVariantSkus = [];

            foreach ($stagingVariants as $var) {
                // Ensure unique SKU
                $vSku = $var->sku;
                if (empty($vSku)) {
                    $vSku = 'PV-'.$var->producto_id.'-'.$var->id;
                }

                $baseSku = $vSku;
                $skuCounter = 1;
                while (in_array($vSku, $usedVariantSkus) || DB::table('product_variants')->where('sku', $vSku)->exists()) {
                    $vSku = $baseSku.'-'.$skuCounter;
                    $skuCounter++;
                }
                $usedVariantSkus[] = $vSku;

                // Verify that the product parent exists
                $parentExists = DB::table('products')->where('id', $var->producto_id)->exists();
                if (! $parentExists) {
                    $this->warn("⚠️ Skipping variant ID {$var->id} because parent product ID {$var->producto_id} does not exist.");

                    continue;
                }

                $resolvedImage = $this->resolveImagePath($var->image_path, $var->producto_id);

                DB::table('product_variants')->insert([
                    'id' => $var->id,
                    'product_id' => $var->producto_id,
                    'sku' => $vSku,
                    'nombre' => $var->name,
                    'precio' => $var->price_adjustment,
                    'precio_oferta' => null,
                    'precio_bs' => $var->precio_bs,
                    'stock' => $var->quantity,
                    'stock_minimo' => 5,
                    'peso' => null,
                    'imagen' => $resolvedImage,
                    'status' => $var->activo,
                    'created_at' => $var->created_at ?? now(),
                    'updated_at' => $var->updated_at ?? now(),
                ]);

                // Parse the values JSON column (e.g. {"Peso": "500gr"})
                if (! empty($var->values)) {
                    $attrs = json_decode($var->values, true);
                    if (is_array($attrs)) {
                        foreach ($attrs as $attrName => $valStr) {
                            if (empty($attrName) || empty($valStr)) {
                                continue;
                            }

                            // A. Find or create attribute
                            $attrSlug = Str::slug($attrName);
                            $attributeId = DB::table('attributes')->where('slug', $attrSlug)->value('id');
                            if (! $attributeId) {
                                $attributeId = DB::table('attributes')->insertGetId([
                                    'nombre' => $attrName,
                                    'slug' => $attrSlug,
                                    'tipo' => 'select',
                                    'usado_para_variantes' => true,
                                    'status' => true,
                                    'empresa_id' => $var->empresa_id,
                                    'sucursal_id' => 1,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                            }

                            // B. Find or create attribute value
                            $valueId = DB::table('attribute_values')
                                ->where('attribute_id', $attributeId)
                                ->where('valor', $valStr)
                                ->value('id');
                            if (! $valueId) {
                                $valueId = DB::table('attribute_values')->insertGetId([
                                    'attribute_id' => $attributeId,
                                    'valor' => $valStr,
                                    'codigo_color' => null,
                                    'orden' => 0,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                            }

                            // C. Associate variant with attribute value in pivot table
                            $linkExists = DB::table('product_variant_attribute_values')
                                ->where('product_variant_id', $var->id)
                                ->where('attribute_value_id', $valueId)
                                ->exists();

                            if (! $linkExists) {
                                DB::table('product_variant_attribute_values')->insert([
                                    'product_variant_id' => $var->id,
                                    'attribute_value_id' => $valueId,
                                    'attribute_id' => $attributeId,
                                ]);
                            }
                        }
                    }
                }
                $variantCount++;
            }
            $this->info("✓ {$variantCount} product variants imported and attribute linked.");

            // 5. Scan and import main product images from public/app/productos/{id}/
            $this->info('Scanning public/app/productos/ directories for product images...');
            $productosPath = public_path('app/productos');
            $scannedProducts = 0;
            $scannedImages = 0;

            if (is_dir($productosPath)) {
                $dirContents = scandir($productosPath);
                foreach ($dirContents as $item) {
                    if (is_numeric($item) && is_dir($productosPath.'/'.$item)) {
                        // Scan files in public/app/productos/{id}/ and public/app/productos/{id}/images/
                        $searchPaths = [
                            $productosPath.'/'.$item,
                            $productosPath.'/'.$item.'/images',
                        ];

                        $productImagesList = [];
                        foreach ($searchPaths as $path) {
                            if (is_dir($path)) {
                                $files = scandir($path);
                                foreach ($files as $file) {
                                    if ($file === '.' || $file === '..') {
                                        continue;
                                    }
                                    if (is_dir($path.'/'.$file)) {
                                        continue;
                                    }
                                    if (str_starts_with($file, 'thumb_')) {
                                        continue;
                                    }

                                    $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                                    if (in_array($extension, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
                                        // Store path relative to public/
                                        $relPath = str_replace(public_path().DIRECTORY_SEPARATOR, '', $path.'/'.$file);
                                        $relPath = str_replace('\\', '/', $relPath);

                                        if (! in_array($relPath, $productImagesList)) {
                                            $productImagesList[] = $relPath;
                                        }
                                    }
                                }
                            }
                        }

                        if (! empty($productImagesList)) {
                            // The first image is the main image
                            $mainImgPath = $productImagesList[0];

                            // Update product's imagen_principal
                            DB::table('products')
                                ->where('id', $item)
                                ->update(['imagen_principal' => $mainImgPath]);

                            // Insert all images into product_images
                            foreach ($productImagesList as $idx => $imgPath) {
                                DB::table('product_images')->insert([
                                    'product_id' => $item,
                                    'ruta' => $imgPath,
                                    'alt_text' => null,
                                    'orden' => $idx,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                                $scannedImages++;
                            }
                            $scannedProducts++;
                        }
                    }
                }
            }
            $this->info("✓ Scanned and updated {$scannedProducts} products with {$scannedImages} images.");

        } catch (\Exception $e) {
            $this->error('❌ An error occurred during database migration: '.$e->getMessage());
            $this->error($e->getTraceAsString());
        } finally {
            // Clean up staging tables
            $this->info('Cleaning up staging tables...');
            DB::statement('DROP TABLE IF EXISTS producto_variants');
            DB::statement('DROP TABLE IF EXISTS productos');
            DB::statement('DROP TABLE IF EXISTS marcas');
            DB::statement('DROP TABLE IF EXISTS categorias');
            DB::statement('DROP TABLE IF EXISTS product_batches');

            $this->info('Re-enabling foreign key checks...');
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        $this->info('🎉 Database integration completed successfully!');

        return 0;
    }

    /**
     * Resolve staging image path to actual file under public/app/productos/
     */
    private function resolveImagePath($originalPath, $productId)
    {
        if (empty($originalPath)) {
            return null;
        }

        $filename = basename($originalPath);
        $publicAppDir = public_path('app/productos');

        // Check 1: directly in public/app/productos/
        if (file_exists($publicAppDir.'/'.$filename)) {
            return 'app/productos/'.$filename;
        }

        // Check 2: in public/app/productos/{productId}/
        if (file_exists($publicAppDir.'/'.$productId.'/'.$filename)) {
            return 'app/productos/'.$productId.'/'.$filename;
        }

        // Check 3: in public/app/productos/{productId}/images/
        if (file_exists($publicAppDir.'/'.$productId.'/images/'.$filename)) {
            return 'app/productos/'.$productId.'/images/'.$filename;
        }

        // Check 4: recursive search
        if (is_dir($publicAppDir)) {
            $dir = new \RecursiveDirectoryIterator($publicAppDir);
            foreach (new \RecursiveIteratorIterator($dir) as $file) {
                if ($file->isFile() && $file->getFilename() === $filename) {
                    $path = str_replace(public_path().DIRECTORY_SEPARATOR, '', $file->getPathname());

                    return str_replace('\\', '/', $path);
                }
            }
        }

        return null;
    }
}
