<?php

namespace Database\Seeders;

use App\Models\RelojCedulaActividadCatalogo;
use App\Services\EquiposUbicacionesImportService;
use Illuminate\Database\Seeder;

class RelojCedulaCatalogoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $filePath = 'C:/Users/theig/OneDrive/Documents/Theizer Dev/Innovacion/Smurfit Westrock/Archivo maestro de Equipos & Ubicaciones.xlsx';
        $service = app(EquiposUbicacionesImportService::class);

        if (file_exists($filePath)) {
            $sheets = $service->readWorkbookSheets($filePath);
            $cedulaSheet = $service->findCedulaSheet($sheets);

            if ($cedulaSheet) {
                $activities = $service->extractCedulaActivitiesFromRows($cedulaSheet['rows']);
                $service->syncCedulaCatalogo($activities);
                $this->command?->info(sprintf('Cédula de Instalación: %d actividades sincronizadas desde Excel.', count($activities)));
                return;
            }
        }

        $this->command?->warn('Archivo maestro no encontrado o sin hoja de Cédula de Instalación.');
    }
}

