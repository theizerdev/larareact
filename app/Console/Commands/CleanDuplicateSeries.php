<?php

namespace App\Console\Commands;

use App\Models\Serie;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanDuplicateSeries extends Command
{
    protected $signature = 'series:clean-duplicates';

    protected $description = 'Limpia series duplicadas manteniendo la más reciente';

    public function handle()
    {
        $this->info('Iniciando limpieza de series duplicadas...');

        DB::transaction(function () {
            // Buscar series duplicadas por serie, empresa_id y sucursal_id
            $duplicates = Serie::select('serie', 'empresa_id', 'sucursal_id')
                ->groupBy('serie', 'empresa_id', 'sucursal_id')
                ->havingRaw('COUNT(*) > 1')
                ->get();

            $totalCleaned = 0;

            foreach ($duplicates as $duplicate) {
                // Obtener todas las series duplicadas para este grupo
                $seriesDuplicadas = Serie::where('serie', $duplicate->serie)
                    ->where('empresa_id', $duplicate->empresa_id)
                    ->where('sucursal_id', $duplicate->sucursal_id)
                    ->orderBy('created_at', 'desc')
                    ->get();

                if ($seriesDuplicadas->count() > 1) {
                    // Mantener la primera (más reciente) y eliminar las demás
                    $serieAMantener = $seriesDuplicadas->first();
                    $seriesAEliminar = $seriesDuplicadas->skip(1);

                    foreach ($seriesAEliminar as $serieAEliminar) {
                        // Actualizar pagos que usen esta serie a la serie que mantenemos
                        DB::table('pagos')
                            ->where('serie_id', $serieAEliminar->id)
                            ->update(['serie_id' => $serieAMantener->id]);

                        // Eliminar la serie duplicada
                        $serieAEliminar->delete();
                        $totalCleaned++;

                        $this->line("Eliminada serie duplicada: {$serieAEliminar->serie} (ID: {$serieAEliminar->id})");
                    }

                    $this->info("Mantenida serie: {$serieAMantener->serie} (ID: {$serieAMantener->id})");
                }
            }

            $this->info("Limpieza completada. Series eliminadas: {$totalCleaned}");
        });

        return 0;
    }
}
