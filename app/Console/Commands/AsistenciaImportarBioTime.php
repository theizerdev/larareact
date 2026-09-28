<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Services\BioTimeAsistenciaService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

/**
 * Lleva las checadas del reloj (espejo biotime_marcajes) a asistencia y
 * recalcula los resúmenes diarios de los que sale la prenómina.
 *
 * Corre por el scheduler detrás de biotime:sync. Sin opciones sólo procesa
 * lo que cambió, así que es barato correrlo seguido.
 */
class AsistenciaImportarBioTime extends Command
{
    protected $signature = 'asistencia:importar-biotime
        {--empresa= : ID de una empresa concreta (por defecto: todas con biotime_active)}
        {--desde= : Fecha inicial (Y-m-d) del rango a revisar}
        {--hasta= : Fecha final (Y-m-d) del rango a revisar}
        {--forzar : Reprocesa todos los días del rango aunque no hayan cambiado}';

    protected $description = 'Importa las checadas de BioTime a asistencia_marcajes y recalcula el resumen diario que alimenta la nómina';

    public function handle(BioTimeAsistenciaService $servicio): int
    {
        if (! config('biotime.asistencia.alimentar', true)) {
            $this->warn('BIOTIME_ALIMENTAR_ASISTENCIA está apagado: las checadas del reloj no alimentan la nómina.');

            return self::SUCCESS;
        }

        $desde = $this->option('desde') ? CarbonImmutable::parse($this->option('desde'))->startOfDay() : null;
        $hasta = $this->option('hasta') ? CarbonImmutable::parse($this->option('hasta'))->endOfDay() : null;

        $empresas = Empresa::query()
            ->when($this->option('empresa'), fn ($q, $id) => $q->whereKey($id))
            ->when(! $this->option('empresa'), fn ($q) => $q->where('biotime_active', true))
            ->get();

        $exit = self::SUCCESS;

        foreach ($empresas as $empresa) {
            $r = $servicio->importar($empresa, $desde, $hasta, (bool) $this->option('forzar'));

            $this->line(sprintf(
                '→ Empresa #%d (%s): %d días recalculados, %d checadas, %d días en períodos cerrados',
                $empresa->id,
                $empresa->razon_social,
                $r['dias'],
                $r['marcajes'],
                $r['bloqueados'],
            ));

            foreach ($r['errores'] as $error) {
                $this->error('   '.$error);
                $exit = self::FAILURE;
            }
        }

        return $exit;
    }
}
