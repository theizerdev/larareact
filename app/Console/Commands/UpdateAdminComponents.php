<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class UpdateAdminComponents extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'components:update-layout';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Actualizar todos los componentes de Admin y SuperAdmin para usar HasDynamicLayout';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Actualizando componentes de Admin y SuperAdmin...');

        $stats = [
            'updated' => 0,
            'skipped' => 0,
            'errors' => 0
        ];

        // Procesar componentes de Admin
        $this->processDirectory(app_path('Livewire/Admin'), 'Admin', $stats);

        // Procesar componentes de SuperAdmin
        $this->processDirectory(app_path('Livewire/SuperAdmin'), 'SuperAdmin', $stats);

        $this->info('✅ Proceso completado!');
        $this->table(
            ['Estado', 'Cantidad'],
            [
                ['Actualizados', $stats['updated']],
                ['Omitidos', $stats['skipped']],
                ['Errores', $stats['errors']]
            ]
        );

        return Command::SUCCESS;
    }

    private function processDirectory($directory, $type, &$stats)
    {
        if (!File::exists($directory)) {
            $this->warn("Directorio no encontrado: $directory");
            return;
        }

        $files = File::allFiles($directory);

        foreach ($files as $file) {
            if ($file->getExtension() !== 'php') {
                continue;
            }

            $result = $this->updateComponent($file->getRealPath());

            switch ($result) {
                case 'updated':
                    $stats['updated']++;
                    $relativePath = str_replace(base_path() . '/', '', $file->getRealPath());
                    $this->info("✅ Actualizado: $relativePath");
                    break;
                case 'already_has_trait':
                    $stats['skipped']++;
                    break;
                case 'not_a_component':
                    $stats['skipped']++;
                    break;
                case 'error':
                    $stats['errors']++;
                    $relativePath = str_replace(base_path() . '/', '', $file->getRealPath());
                    $this->error("❌ Error: $relativePath");
                    break;
            }
        }
    }

    private function updateComponent($filePath)
    {
        $content = File::get($filePath);
        $originalContent = $content;

        // Verificar si es un componente Livewire
        if (strpos($content, 'extends Component') === false) {
            return 'not_a_component';
        }

        // Verificar si ya usa HasDynamicLayout
        if (strpos($content, 'use App\Traits\HasDynamicLayout;') !== false) {
            return 'already_has_trait';
        }

        try {
            // Paso 1: Agregar el use statement después del namespace
            $namespacePattern = '/namespace\s+[^;]+;/';
            if (preg_match($namespacePattern, $content, $matches)) {
                $namespaceLine = $matches[0];
                $newContent = str_replace(
                    $namespaceLine,
                    $namespaceLine . "\nuse App\\Traits\\HasDynamicLayout;",
                    $content
                );
                $content = $newContent;
            }

            // Paso 2: Agregar HasDynamicLayout a los traits
            $traitPattern = '/use\s+([^;]+);/';
            preg_match_all($traitPattern, $content, $traitMatches);

            if (!empty($traitMatches[0])) {
                // Encontrar la última línea de traits
                $lastTraitLine = end($traitMatches[0]);

                if (strpos($lastTraitLine, 'HasDynamicLayout') === false) {
                    // Agregar HasDynamicLayout
                    $newTraitLine = rtrim($lastTraitLine, ';') . ', HasDynamicLayout;';
                    $content = str_replace($lastTraitLine, $newTraitLine, $content);
                }
            }

            // Paso 3: Actualizar el método render si existe y no usa layout dinámico
            if (strpos($content, 'public function render()') !== false) {
                // Buscar render que use layout estático
                $staticLayoutPattern = '/->layout\([\'"]components\.layouts\.(admin|horizontal)[\'"]\)/';
                if (preg_match($staticLayoutPattern, $content)) {
                    // Reemplazar layout estático por dinámico
                    $content = preg_replace(
                        $staticLayoutPattern,
                        '->layout($this->getLayout())',
                        $content
                    );
                }

                // Buscar render que no tenga layout
                $renderPattern = '/return view\([^)]+\)([^;]*);/';
                if (preg_match($renderPattern, $content, $matches) && strpos($matches[0], '->layout(') === false) {
                    // Agregar layout dinámico
                    $newRender = str_replace(
                        $matches[1],
                        $matches[1] . '->layout($this->getLayout())',
                        $matches[0]
                    );
                    $content = str_replace($matches[0], $newRender, $content);
                }
            }

            // Guardar cambios
            if ($content !== $originalContent) {
                File::put($filePath, $content);
                return 'updated';
            }

            return 'already_has_trait';

        } catch (\Exception $e) {
            return 'error';
        }
    }
}
