<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Services\BioTimeFotoService;
use Illuminate\Console\Command;

/**
 * Genera el ZIP de bio-photos (123.jpg, ≤ 25 KB) para cargarlo en BioTime ›
 * Dispositivo › Datos › Bio-Photo › Importar Bio-Photo.
 */
class BioTimeExportarFotos extends Command
{
    protected $signature = 'biotime:exportar-fotos
        {--empresa= : ID de la empresa}
        {--salida= : Ruta del ZIP (por defecto storage/app/biotime-fotos-<empresa>.zip)}
        {--pendientes : Sólo las fotos nuevas o cambiadas desde el último ZIP}';

    protected $description = 'Exporta las fotos de los colaboradores vinculados en el formato de bio-photo de BioTime';

    public function handle(BioTimeFotoService $fotos): int
    {
        $empresa = Empresa::query()
            ->when($this->option('empresa'), fn ($q, $id) => $q->whereKey($id), fn ($q) => $q->where('biotime_active', true))
            ->first();

        if ($empresa === null) {
            $this->error('No hay empresa con BioTime activo; usa --empresa.');

            return self::FAILURE;
        }

        $destino = $this->option('salida') ?: storage_path("app/biotime-fotos-{$empresa->id}.zip");
        $r = $fotos->exportarZip($empresa, $destino, (bool) $this->option('pendientes'));

        $this->info("{$r['fotos']} fotos en {$destino}");
        foreach ($r['omitidos'] as $motivo) {
            $this->warn('   '.$motivo);
        }

        return self::SUCCESS;
    }
}
