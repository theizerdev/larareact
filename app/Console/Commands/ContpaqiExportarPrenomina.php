<?php

namespace App\Console\Commands;

use App\Models\ContpaqiTipoIncidencia;
use App\Models\Empresa;
use App\Services\Contpaqi\ContpaqiExportService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Throwable;

/**
 * Genera el archivo de prenómina que CONTPAQi Nóminas importa desde
 * "Capturar movimientos desde Excel".
 *
 * POR DEFECTO NO ESCRIBE NADA. Sin --generar sólo calcula y enseña el
 * resultado en pantalla, que es como conviene usarlo mientras el layout de
 * columnas no esté confirmado contra la "Hoja de trabajo" del cliente.
 *
 * A propósito NO está dado de alta en el scheduler. La prenómina se cierra
 * cuando Recursos Humanos termina de capturar incidencias, no cuando da una
 * hora del reloj; generarla sola produciría archivos incompletos que alguien
 * acabaría importando por descuido.
 */
class ContpaqiExportarPrenomina extends Command
{
    protected $signature = 'contpaqi:exportar-prenomina
        {--empresa= : ID de la empresa. Obligatorio si hay más de una activa}
        {--desde= : Inicio del período (Y-m-d). Por defecto: el inicio de la semana pasada}
        {--hasta= : Fin del período (Y-m-d). Por defecto: seis días después de --desde}
        {--periodo= : Número de período de CONTPAQi, para poder cotejarlo al importar}
        {--generar : Escribe el archivo y lo registra. Sin esta bandera todo queda en pantalla}';

    protected $description = 'Arma la prenómina de un período y la deja lista para importar en CONTPAQi Nóminas';

    public function handle(ContpaqiExportService $servicio): int
    {
        [$desde, $hasta] = $this->resolverPeriodo();

        if ($desde->greaterThan($hasta)) {
            $this->error('La fecha --desde es posterior a --hasta.');

            return self::FAILURE;
        }

        $empresa = $this->resolverEmpresa();

        if ($empresa === null) {
            return self::FAILURE;
        }

        $generar = (bool) $this->option('generar');

        $this->line("Empresa: {$empresa->razon_social}");
        $this->line("Período: {$desde->toDateString()} a {$hasta->toDateString()}");
        $this->line($generar ? 'Modo: generación real' : 'Modo: ensayo (no se escribe nada)');
        $this->newLine();

        try {
            $resultado = $servicio->previsualizar($empresa, $desde, $hasta);
        } catch (Throwable $e) {
            $this->error('No se pudo calcular la prenómina: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->mostrarResumen($resultado);

        if (! $generar) {
            $this->newLine();
            $this->comment('Ensayo terminado. Con --generar se escribe el archivo.');

            return self::SUCCESS;
        }

        if ($resultado['renglones'] === []) {
            $this->warn('No hay un solo renglón que exportar; no se genera archivo.');

            return self::SUCCESS;
        }

        try {
            $exportacion = $servicio->exportar(
                $empresa,
                $desde,
                $hasta,
                $this->option('periodo') !== null ? (int) $this->option('periodo') : null,
            );
        } catch (Throwable $e) {
            $this->error('Falló la exportación: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->newLine();
        $this->info("Archivo generado: {$exportacion->nombre_archivo}");
        $this->line("Disco '{$exportacion->disco}', ruta {$exportacion->ruta_archivo}");
        $this->line("Lote {$exportacion->lote_uuid}");

        return self::SUCCESS;
    }

    /**
     * Período por defecto: la semana completa anterior a hoy.
     *
     * Es el caso normal —la prenómina se cierra al terminar la semana— y
     * evita el error clásico de exportar la semana en curso, que todavía no
     * tiene todos sus marcajes.
     *
     * @return array{CarbonImmutable, CarbonImmutable}
     */
    private function resolverPeriodo(): array
    {
        $inicioSemana = (int) config('contpaqi.dia_inicio_semana', 1);

        $desde = $this->option('desde')
            ? CarbonImmutable::parse((string) $this->option('desde'))->startOfDay()
            : CarbonImmutable::now()->subWeek()->startOfWeek($inicioSemana)->startOfDay();

        $hasta = $this->option('hasta')
            ? CarbonImmutable::parse((string) $this->option('hasta'))->endOfDay()
            : $desde->addDays(6)->endOfDay();

        return [$desde, $hasta];
    }

    private function resolverEmpresa(): ?Empresa
    {
        if ($id = $this->option('empresa')) {
            $empresa = Empresa::withoutGlobalScopes()->find($id);

            if ($empresa === null) {
                $this->error("No existe la empresa con id {$id}.");
            }

            return $empresa;
        }

        $empresas = Empresa::withoutGlobalScopes()->get();

        if ($empresas->count() === 1) {
            return $empresas->first();
        }

        if ($empresas->isEmpty()) {
            $this->error('No hay empresas registradas.');

            return null;
        }

        // Con varias empresas no se adivina: exportar la nómina de la razón
        // social equivocada es un problema fiscal, no un inconveniente.
        $this->error('Hay más de una empresa; especifica cuál con --empresa=ID:');

        foreach ($empresas as $empresa) {
            $this->line("  {$empresa->id}  {$empresa->razon_social}");
        }

        return null;
    }

    /** @param  array{renglones: list<array<string, mixed>>, omitidos: list<array<string, mixed>>, tipos: Collection<int, ContpaqiTipoIncidencia>}  $resultado */
    private function mostrarResumen(array $resultado): void
    {
        $this->info(sprintf(
            '%d empleados con movimientos, %d omitidos, %d columnas de incidencia.',
            count($resultado['renglones']),
            count($resultado['omitidos']),
            $resultado['tipos']->count(),
        ));

        if ($resultado['tipos']->isNotEmpty()) {
            $this->line('Columnas: '.$resultado['tipos']->pluck('mnemonico')->implode(', '));
        }

        if ($resultado['renglones'] !== []) {
            $this->newLine();
            $this->table(
                ['Código', 'Empleado', 'Movimientos'],
                collect($resultado['renglones'])->take(15)->map(fn (array $r) => [
                    $r['codigo_empleado'],
                    mb_substr((string) $r['nombre_empleado'], 0, 32),
                    collect($r['valores'])->map(fn ($v, $k) => "{$k}={$v}")->implode('  '),
                ])->all(),
            );

            if (count($resultado['renglones']) > 15) {
                $this->line(sprintf('... y %d renglones más.', count($resultado['renglones']) - 15));
            }
        }

        // Las omisiones agrupadas por motivo son lo primero que hay que
        // atender: casi siempre son mapeos de empleado que faltan.
        if ($resultado['omitidos'] !== []) {
            $this->newLine();
            $this->warn('Omitidos:');

            foreach (collect($resultado['omitidos'])->countBy('motivo') as $motivo => $cuantos) {
                $this->line("  {$cuantos}  {$motivo}");
            }
        }
    }
}
