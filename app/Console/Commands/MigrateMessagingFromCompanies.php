<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Models\MessagingConnection;
use App\Models\MessagingProvider;
use App\Services\Messaging\CredentialEncryptionService;
use Illuminate\Console\Command;

class MigrateMessagingFromCompanies extends Command
{
    protected $signature = 'messaging:migrate-from-companies 
                            {--dry-run : Simular migración sin guardar}
                            {--force : Forzar migración incluso si ya existen conexiones}';

    protected $description = 'Migra credenciales de WhatsApp desde tabla empresas al nuevo sistema de mensajería';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');

        $this->info('=== Migración de Credenciales de Mensajería ===');
        $this->info('Modo: '.($dryRun ? 'SIMULACIÓN (dry-run)' : 'PRODUCCIÓN'));

        // Obtener provider de WhatsApp Lite
        $provider = MessagingProvider::where('slug', 'whatsapp_lite')->first();

        if (! $provider) {
            $this->error('No se encontró el provider WhatsApp Lite. Ejecute el seeder primero.');

            return self::FAILURE;
        }

        // Obtener empresas con configuración de WhatsApp
        $empresas = Empresa::whereNotNull('whatsapp_api_key')
            ->where('whatsapp_api_key', '!=', '')
            ->get();

        if ($empresas->isEmpty()) {
            $this->warn('No se encontraron empresas con configuración de WhatsApp.');

            return self::SUCCESS;
        }

        $this->info("Se encontraron {$empresas->count()} empresas con configuración.");

        $encryption = app(CredentialEncryptionService::class);
        $migrated = 0;
        $skipped = 0;

        $progressBar = $this->output->createProgressBar($empresas->count());
        $progressBar->start();

        foreach ($empresas as $empresa) {
            // Verificar si ya existe conexión para esta empresa
            $existingConnection = MessagingConnection::where('empresa_id', $empresa->id)
                ->where('provider_id', $provider->id)
                ->first();

            if ($existingConnection && ! $force) {
                $this->line("  [SKIP] Empresa {$empresa->id} ({$empresa->nombre}): Ya existe conexión");
                $skipped++;
                $progressBar->advance();

                continue;
            }

            // Preparar credenciales
            $credentials = $encryption->encrypt([
                'api_url' => config('whatsapp.api_url', 'http://82.165.213.124:8092'),
                'api_key' => $empresa->whatsapp_api_key,
                'timeout' => config('whatsapp.timeout', 30),
            ]);

            // Determinar estado basado en whatsapp_status
            $status = match ($empresa->whatsapp_status ?? 'inactive') {
                'connected' => 'active',
                'disconnected' => 'inactive',
                default => 'inactive',
            };

            if ($dryRun) {
                $this->line("  [DRY-RUN] Empresa {$empresa->id} ({$empresa->nombre}):");
                $this->line('    - Credenciales: '.($empresa->whatsapp_api_key ? '✓ Configurado' : '✗ Vacío'));
                $this->line("    - Estado: {$status}");
            } else {
                // Crear o actualizar conexión
                MessagingConnection::updateOrCreate(
                    [
                        'empresa_id' => $empresa->id,
                        'provider_id' => $provider->id,
                    ],
                    [
                        'name' => 'WhatsApp Lite (Migrado)',
                        'credentials' => $credentials,
                        'configuration' => json_encode([
                            'timeout' => config('whatsapp.timeout', 30),
                            'auto_retry' => true,
                            'max_retries' => 3,
                        ]),
                        'status' => $status,
                        'is_default_for' => json_encode([
                            'citas',
                            'usuarios',
                            'consultas',
                            'doctores',
                            'enfermeros',
                            'pedidos',
                            'pagos',
                        ]),
                        'last_test_at' => $status === 'active' ? now() : null,
                        'test_result' => $status === 'active' ? json_encode([
                            'success' => true,
                            'message' => 'Migrado automáticamente desde configuración anterior',
                            'migrated_at' => now()->toDateTimeString(),
                        ]) : null,
                    ]
                );

                $this->line("  [MIGRATED] Empresa {$empresa->id} ({$empresa->nombre})");
            }

            $migrated++;
            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->info('=== Resumen ===');
        $this->info("Empresas procesadas: {$empresas->count()}");
        $this->info("Migradas: {$migrated}");
        $this->info("Omitidas: {$skipped}");

        if ($dryRun) {
            $this->warn('Esto fue una simulación. Ejecute sin --dry-run para aplicar cambios.');
        } else {
            $this->info('Migración completada.');
            $this->info('Verifique las conexiones en: Admin > Comunicaciones > Conexiones');
        }

        return self::SUCCESS;
    }
}
