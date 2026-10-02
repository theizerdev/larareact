<?php

namespace App\Console\Commands;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateWhatsAppToken extends Command
{
    protected $signature = 'whatsapp:generate-token {company_id=1}';

    protected $description = 'Genera JWT token para empresa WhatsApp';

    public function handle()
    {
        $companyId = $this->argument('company_id');

        // Generar un token simple tipo API Key en lugar de JWT
        $timestamp = time();
        $companyName = 'U.E JOSE MARIA VARGAS';
        $randomPart = bin2hex(random_bytes(16));

        // Crear un token simple formato: empresa-timestamp-random
        $token = 'whatsapp-'.$companyId.'-'.substr($randomPart, 0, 16);

        // Actualizar campo whatsapp_api_key en la tabla empresas
        DB::table('empresas')
            ->where('id', $companyId)
            ->update(['whatsapp_api_key' => $token]);

        $this->info("✅ API Key de WhatsApp generada y guardada para empresa {$companyId}:");
        $this->line($token);

        $this->info("\nUsar en headers:");
        $this->line("X-API-Key: {$token}");
    }
}
