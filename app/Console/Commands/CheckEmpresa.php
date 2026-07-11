<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckEmpresa extends Command
{
    protected $signature = 'empresa:check';
    protected $description = 'Verificar información de la empresa';

    public function handle()
    {
        $empresa = DB::table('empresas')->where('id', 1)->first();
        
        if ($empresa) {
            $this->info('Información de la empresa:');
            $this->line('ID: ' . $empresa->id);
            $this->line('Nombre: ' . $empresa->nombre);
            $this->line('Status: ' . $empresa->status);
            $this->line('Activa: ' . ($empresa->activa ? 'Sí' : 'No'));
            $this->line('API Key: ' . substr($empresa->api_key, 0, 50) . '...');
            
            // Verificar si la empresa está activa
            if (!$empresa->activa) {
                $this->error('⚠️  La empresa NO está activa. Esto puede causar problemas con WhatsApp.');
            } else {
                $this->info('✅ La empresa está activa.');
            }
        } else {
            $this->error('No se encontró la empresa con ID 1');
        }
    }
}