<?php

namespace App\Console\Commands;

use App\Models\Paciente;
use Illuminate\Console\Command;

class TestCarnetPng extends Command
{
    protected $signature = 'test:carnet-png';

    protected $description = 'Probar la generación de carnet PNG';

    public function handle()
    {
        // Encontrar un paciente menor
        $paciente = Paciente::whereHas('empresa')
            ->whereNotNull('fecha_nacimiento')
            ->whereRaw('TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) < 18')
            ->first();

        if (! $paciente) {
            $this->error('No se encontró ningún paciente menor.');

            return 1;
        }

        $this->info("Paciente encontrado: {$paciente->nombres} {$paciente->apellidos}");
        $this->info("Edad: {$paciente->fecha_nacimiento->age} años");
        $this->info("ID: {$paciente->id}");
        $this->info('');
        $this->info("URL del carnet PNG: https://medical.test/admin/pacientes/{$paciente->id}/carnet-menor.png");
        $this->info("URL del carnet HTML: https://medical.test/admin/pacientes/{$paciente->id}/carnet-menor");
        $this->info("URL del carnet PDF: https://medical.test/admin/pacientes/{$paciente->id}/carnet-menor.pdf");

        return 0;
    }
}
