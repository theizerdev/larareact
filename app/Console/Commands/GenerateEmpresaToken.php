<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Firebase\JWT\JWT;

class GenerateEmpresaToken extends Command
{
    protected $signature = 'empresa:generate-token {--empresa_id=1}';
    protected $description = 'Generar nuevo token JWT para empresa';

    public function handle()
    {
        $empresaId = $this->option('empresa_id');
        $empresa = DB::table('empresas')->where('id', $empresaId)->first();
        
        if (!$empresa) {
            $this->error("Empresa con ID $empresaId no encontrada");
            return 1;
        }
        
        // Generar nuevo token JWT
        $payload = [
            'company_id' => $empresa->id,
            'company_name' => $empresa->razon_social,
            'iat' => time(),
            'exp' => time() + (365 * 24 * 60 * 60) // 1 año
        ];
        
        $secret = config('whatsapp.jwt_secret');
        $token = JWT::encode($payload, $secret, 'HS256');
        
        // Actualizar empresa con nuevo token
        DB::table('empresas')->where('id', $empresaId)->update([
            'api_key' => $token,
            'updated_at' => now()
        ]);
        
        $this->info("✅ Token generado exitosamente para empresa: " . $empresa->razon_social);
        $this->line("   Token: " . substr($token, 0, 50) . "...");
        $this->line("   Nota: El token expira en 1 año");
        
        return 0;
    }
}