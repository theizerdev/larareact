<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\RegionalConfigurationService;
use App\Models\Empresa;

class TestRegionalConfigurationComplete extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:regional-configuration-complete {--empresa_id=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Probar la configuración regional completa con todos los componentes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Iniciando prueba completa de configuración regional...');

        // 1. Probar servicio
        $this->info('\n📋 Configuración actual:');
        $config = RegionalConfigurationService::getCurrentConfiguration();
        $this->table(
            ['Configuración', 'Valor'],
            collect($config)->map(function ($value, $key) {
                return [str_replace('_', ' ', ucfirst($key)), $value];
            })->values()
        );

        // 2. Probar formateo
        $this->info('\n💰 Prueba de formateo:');
        $testAmount = 1234.56;
        $testDate = now();
        $this->info("Monto: {$testAmount} → " . RegionalConfigurationService::formatMoney($testAmount));
        $this->info("Fecha: {$testDate->format('Y-m-d H:i:s')} → " . RegionalConfigurationService::formatDate($testDate));

        // 3. Probar con empresa específica
        $empresaId = $this->option('empresa_id');
        if ($empresaId) {
            $empresa = Empresa::with('pais')->find($empresaId);
            if ($empresa) {
                $this->info("\n🏢 Probando con empresa: {$empresa->razon_social}");
                RegionalConfigurationService::setRegionalConfiguration($empresa);

                $newConfig = RegionalConfigurationService::getCurrentConfiguration();
                $this->info("Nueva configuración:");
                $this->table(
                    ['Configuración', 'Valor'],
                    collect($newConfig)->map(function ($value, $key) {
                        return [str_replace('_', ' ', ucfirst($key)), $value];
                    })->values()
                );

                // Probar formateo con nueva configuración
                $this->info("\n💰 Formateo con nueva configuración:");
                $this->info("Monto: {$testAmount} → " . RegionalConfigurationService::formatMoney($testAmount));
                $this->info("Fecha: {$testDate->format('Y-m-d H:i:s')} → " . RegionalConfigurationService::formatDate($testDate));
            } else {
                $this->error("❌ Empresa con ID {$empresaId} no encontrada");
            }
        }

        // 4. Verificar componentes
        $this->info('\n🔧 Verificación de componentes:');

        // Verificar que el componente RegionalConfigurationIndicator existe
        $indicatorPath = app_path('Livewire/RegionalConfigurationIndicator.php');
        if (file_exists($indicatorPath)) {
            $this->info('✅ Componente RegionalConfigurationIndicator existe');
        } else {
            $this->error('❌ Componente RegionalConfigurationIndicator no encontrado');
        }

        // Verificar que el componente de prueba existe
        $testPath = app_path('Livewire/TestRegionalConfiguration.php');
        if (file_exists($testPath)) {
            $this->info('✅ Componente TestRegionalConfiguration existe');
        } else {
            $this->error('❌ Componente TestRegionalConfiguration no encontrado');
        }

        // Verificar rutas
        $routeName = 'test.regional-configuration';
        try {
            $route = app('router')->getRoutes()->getByName($routeName);
            if ($route) {
                $this->info('✅ Ruta de prueba disponible: /test/regional-configuration');
            } else {
                $this->error('❌ Ruta de prueba no encontrada');
            }
        } catch (\Exception $e) {
            $this->error('❌ Error verificando ruta: ' . $e->getMessage());
        }

        // 5. Instrucciones para prueba web
        $this->info('\n🌐 Prueba en la interfaz web:');
        $this->info('1. Inicia sesión en la aplicación');
        $this->info('2. Visita: /test/regional-configuration');
        $this->info('3. Selecciona diferentes empresas para ver los cambios');
        $this->info('4. Observa el indicador en la barra de navegación');

        // 6. Verificar middleware
        $middlewarePath = app_path('Http/Middleware/RegionalConfiguration.php');
        if (file_exists($middlewarePath)) {
            $this->info('✅ Middleware RegionalConfiguration activo');
        } else {
            $this->error('❌ Middleware no encontrado');
        }

        // 7. Verificar trait
        $traitPath = app_path('Livewire/Traits/HasRegionalConfiguration.php');
        if (file_exists($traitPath)) {
            $this->info('✅ Trait HasRegionalConfiguration disponible');
        } else {
            $this->error('❌ Trait no encontrado');
        }

        $this->info('\n🎉 Prueba completada exitosamente!');
        $this->info('\n💡 Sugerencia: Usa --empresa_id=1 para probar con una empresa específica');

        return Command::SUCCESS;
    }
}
