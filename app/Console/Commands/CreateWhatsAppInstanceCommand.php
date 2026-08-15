<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;

class CreateWhatsAppInstanceCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:create-instance {empresa_id? : ID de la empresa (o vacío para todas)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crea o reinicializa la instancia en el motor de WhatsApp para una empresa específica o para todas las empresas activas';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $empresaId = $this->argument('empresa_id');

        if ($empresaId) {
            $empresas = Empresa::where('id', $empresaId)->get();
            if ($empresas->isEmpty()) {
                $this->error("No se encontró ninguna empresa con ID {$empresaId}.");
                return Command::FAILURE;
            }
        } else {
            $empresas = Empresa::where('status', true)->get();
        }

        foreach ($empresas as $empresa) {
            $this->info("Procesando empresa ID {$empresa->id}: {$empresa->razon_social}...");

            $baseInstanceName = $empresa->whatsapp_instance;
            if (empty($baseInstanceName)) {
                $baseName = $empresa->nombre_comercial ?: $empresa->razon_social;
                $baseInstanceName = preg_replace('/[^a-zA-Z0-9_-]/', '', str_replace(['/', ' '], '', strtolower($baseName)));
                if (empty($baseInstanceName)) {
                    $baseInstanceName = 'empresa_'.$empresa->id;
                }
            }

            try {
                $service = WhatsAppService::forCompany($empresa);
                $result = $service->createInstance($baseInstanceName);

                if ($result) {
                    $freshEmpresa = $empresa->fresh();
                    $this->info("  ✅ Instancia '{$baseInstanceName}' creada/inicializada con éxito.");
                    $this->line("     🔑 Token (whatsapp_api_key): " . ($freshEmpresa->whatsapp_api_key ?? 'N/A'));
                    $this->line("     📱 Estado (whatsapp_status): " . ($freshEmpresa->whatsapp_status ?? 'qr_ready'));
                } else {
                    $this->error("  ❌ No se pudo crear la instancia para la empresa ID {$empresa->id}. Revise los logs para más información.");
                }
            } catch (\Throwable $e) {
                $this->error("  ❌ Error en la empresa ID {$empresa->id}: " . $e->getMessage());
            }
        }

        return Command::SUCCESS;
    }
}
