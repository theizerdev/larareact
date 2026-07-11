<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\EspecialidadPlantilla;

class MigrateEstadosBase extends Command
{
    protected $signature = 'plantilla:migrate-estados-base';
    protected $description = 'Migra plantillas antiguas para usar el modelo híbrido de estados (elimina estados base de la configuración)';

    public function handle()
    {
        $this->info('Iniciando migración de estados base...');

        $plantillas = EspecialidadPlantilla::all();
        $actualizadas = 0;

        foreach ($plantillas as $plantilla) {
            $modificado = false;

            // Limpiar estados_config
            if (!empty($plantilla->estados_config)) {
                $estadosLimpios = collect($plantilla->estados_config)
                    ->filter(function ($estado) {
                        // Mantener solo estados que NO son base
                        return !isset(EspecialidadPlantilla::ESTADOS_BASE[$estado['key']]);
                    })
                    ->values()
                    ->toArray();

                if (count($estadosLimpios) !== count($plantilla->estados_config)) {
                    $plantilla->estados_config = $estadosLimpios;
                    $modificado = true;
                    $this->line("  - Plantilla #{$plantilla->id}: Eliminados " .
                        (count($plantilla->estados_config) - count($estadosLimpios)) .
                        " estados base de estados_config");
                }
            }

            // Limpiar estados_flujo (legacy)
            if (!empty($plantilla->estados_flujo)) {
                $flujoLimpio = collect($plantilla->estados_flujo)
                    ->filter(function ($key) {
                        // Mantener solo estados que NO son base
                        return !isset(EspecialidadPlantilla::ESTADOS_BASE[$key]);
                    })
                    ->values()
                    ->toArray();

                if (count($flujoLimpio) !== count($plantilla->estados_flujo)) {
                    $plantilla->estados_flujo = $flujoLimpio;
                    $modificado = true;
                    $this->line("  - Plantilla #{$plantilla->id}: Eliminados " .
                        (count($plantilla->estados_flujo) - count($flujoLimpio)) .
                        " estados base de estados_flujo");
                }
            }

            if ($modificado) {
                $plantilla->save();
                $actualizadas++;
            }
        }

        $this->info("Migración completada. {$actualizadas} plantilla(s) actualizada(s).");
        $this->info("Los estados base ahora son automáticos y no se almacenan en la BD.");

        return Command::SUCCESS;
    }
}
