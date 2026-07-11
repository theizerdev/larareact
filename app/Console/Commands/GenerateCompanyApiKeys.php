<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Empresa;

class GenerateCompanyApiKeys extends Command
{
    protected $signature = 'whatsapp:generate-keys';
    protected $description = 'Generar API keys para empresas que no las tengan';

    public function handle()
    {
        $empresas = Empresa::whereNull('api_key')->get();
        
        if ($empresas->isEmpty()) {
            $this->info('Todas las empresas ya tienen API keys.');
            return 0;
        }

        $this->info("Generando API keys para {$empresas->count()} empresas...");

        foreach ($empresas as $empresa) {
            $empresa->update(['api_key' => Empresa::generateApiKey()]);
            $this->line("✓ API key generada para: {$empresa->razon_social}");
        }

        $this->info('¡API keys generadas exitosamente!');
        return 0;
    }
}