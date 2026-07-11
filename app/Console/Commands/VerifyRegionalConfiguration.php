<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\RegionalConfigurationService;
use App\Models\Empresa;
use App\Models\Pais;

class VerifyRegionalConfiguration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'verify:regional-configuration {--empresa_id=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verificar que toda la configuración regional esté funcionando correctamente';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Verificando configuración regional...');

        // 1. Verificar servicio
        $this->info('\n✅ Verificando servicio...');
        $service = app(RegionalConfigurationService::class);
        $this->info('Servicio RegionalConfigurationService disponible');

        // 2. Verificar helper
        $this->info('\n✅ Verificando helpers...');
        if (function_exists('get_regional_config')) {
            $this->info('Helper get_regional_config disponible');
        } else {
            $this->warn('⚠️ Helper get_regional_config no disponible');
        }

        // 3. Verificar middleware
        $this->info('\n✅ Verificando middleware...');
        $middlewarePath = app_path('Http/Middleware/RegionalConfiguration.php');
        if (file_exists($middlewarePath)) {
            $this->info('Middleware RegionalConfiguration existe');
        } else {
            $this->error('❌ Middleware RegionalConfiguration no encontrado');
        }

        // 4. Verificar componentes Livewire
        $this->info('\n✅ Verificando componentes Livewire...');
        $components = [
            'RegionalConfigurationIndicator' => app_path('Livewire/RegionalConfigurationIndicator.php'),
            'TestRegionalConfiguration' => app_path('Livewire/TestRegionalConfiguration.php')
        ];

        foreach ($components as $name => $path) {
            if (file_exists($path)) {
                $this->info("✅ Componente {$name} disponible");
            } else {
                $this->error("❌ Componente {$name} no encontrado");
            }
        }

        // 5. Verificar vistas
        $this->info('\n✅ Verificando vistas...');
        $views = [
            'regional-configuration-indicator' => resource_path('views/livewire/regional-configuration-indicator.blade.php'),
            'test-regional-configuration' => resource_path('views/livewire/test-regional-configuration.blade.php')
        ];

        foreach ($views as $name => $path) {
            if (file_exists($path)) {
                $this->info("✅ Vista {$name} disponible");
            } else {
                $this->error("❌ Vista {$name} no encontrada");
            }
        }

        // 6. Verificar rutas
        $this->info('\n✅ Verificando rutas...');
        $routes = [
            'test.regional-configuration' => '/test/regional-configuration'
        ];

        foreach ($routes as $name => $path) {
            try {
                $route = app('router')->getRoutes()->getByName($name);
                if ($route) {
                    $this->info("✅ Ruta {$name} registrada");
                } else {
                    $this->error("❌ Ruta {$name} no registrada");
                }
            } catch (\Exception $e) {
                $this->error("❌ Error verificando ruta {$name}: " . $e->getMessage());
            }
        }

        // 7. Verificar trait
        $this->info('\n✅ Verificando trait...');
        $traitPath = app_path('Livewire/Traits/HasRegionalConfiguration.php');
        if (file_exists($traitPath)) {
            $this->info('✅ Trait HasRegionalConfiguration disponible');
        } else {
            $this->error('❌ Trait HasRegionalConfiguration no encontrado');
        }

        // 8. Verificar configuración con empresa específica
        $empresaId = $this->option('empresa_id');
        if ($empresaId) {
            $this->info("\n✅ Verificando con empresa ID: {$empresaId}");

            $empresa = Empresa::with('pais')->find($empresaId);
            if ($empresa) {
                RegionalConfigurationService::setRegionalConfiguration($empresa);
                $config = RegionalConfigurationService::getCurrentConfiguration();

                $this->info("Empresa: {$empresa->razon_social}");
                $this->info("País: {$empresa->pais->nombre}");
                $this->info("Configuración aplicada:");
                $this->table(
                    ['Configuración', 'Valor'],
                    collect($config)->map(function ($value, $key) {
                        return [str_replace('_', ' ', ucfirst($key)), $value];
                    })->values()
                );

                // Probar formateo
                $this->info("\n✅ Prueba de formateo:");
                $testAmount = 1234.56;
                $testDate = now();
                $this->info("Monto: {$testAmount} → " . RegionalConfigurationService::formatMoney($testAmount));
                $this->info("Fecha: {$testDate->format('Y-m-d H:i:s')} → " . RegionalConfigurationService::formatDate($testDate));
            } else {
                $this->error("❌ Empresa con ID {$empresaId} no encontrada");
            }
        }

        $this->info('\n🎉 Verificación completada!');

        return Command::SUCCESS;
    }
}
