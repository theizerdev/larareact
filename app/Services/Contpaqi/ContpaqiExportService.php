<?php

namespace App\Services\Contpaqi;

use App\Models\AsistenciaResumenDiario;
use App\Models\ContpaqiEmpleadoMapeo;
use App\Models\ContpaqiExportacion;
use App\Models\ContpaqiExportacionDetalle;
use App\Models\ContpaqiTipoIncidencia;
use App\Models\DiaFestivo;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\IncidenciaEmpleado;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * Arma la prenómina de un período y la deja como archivo listo para importar
 * en CONTPAQi Nóminas.
 *
 * Reparte responsabilidades con sus dos colaboradores: IncidenciaMapper decide
 * qué se paga como qué, PrenominaExcelWriter decide cómo se ve el archivo, y
 * este servicio decide a quién se incluye, deja constancia de lo que pasó y
 * guarda el resultado.
 *
 * Todas las consultas van con withoutTenant() y filtro explícito por empresa.
 * El scope multitenant depende del usuario autenticado, y esto tiene que dar
 * exactamente el mismo resultado corriendo desde la consola —sin usuario— que
 * desde el panel.
 */
class ContpaqiExportService
{
    public function __construct(
        private readonly IncidenciaMapper $mapper,
        private readonly PrenominaExcelWriter $writer,
    ) {}

    /**
     * Calcula la prenómina sin escribir nada: ni archivo, ni bitácora.
     *
     * Existe para que la pantalla pueda enseñar el resultado antes de
     * comprometerlo, y para que el comando de consola tenga un modo de ensayo.
     * Revisar un archivo ya generado es peor: obliga a borrar exportaciones
     * fallidas y ensucia el histórico que justamente sirve para auditar.
     *
     * @return array{
     *     renglones: list<array{codigo_empleado: string, nombre_empleado: string, valores: array<string, float>}>,
     *     omitidos: list<array{empleado_id: int, nombre_empleado: string, motivo: string}>,
     *     tipos: Collection<int, ContpaqiTipoIncidencia>
     * }
     */
    public function previsualizar(Empresa $empresa, CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        if ($desde->gt($hasta)) {
            throw new RuntimeException('El inicio del período no puede ser posterior a su fin.');
        }

        $empleados = $this->empleadosDe($empresa);
        $mapeos = $this->mapeosDe($empresa);
        $resumenes = $this->resumenesDe($empresa, $desde, $hasta);
        $incidencias = $this->incidenciasDe($empresa, $desde, $hasta);
        $festivos = $this->festivosDe($empresa, $desde, $hasta);

        $renglones = [];
        $omitidos = [];
        $mnemonicosUsados = [];

        foreach ($empleados as $empleado) {
            $nombre = $empleado->nombre_completo;
            $mapeo = $mapeos->get($empleado->id);

            if ($mapeo === null) {
                $omitidos[] = [
                    'empleado_id' => $empleado->id,
                    'nombre_empleado' => $nombre,
                    'motivo' => ContpaqiExportacionDetalle::MOTIVO_SIN_MAPEO,
                ];

                continue;
            }

            if (! $mapeo->esUtilizable()) {
                $omitidos[] = [
                    'empleado_id' => $empleado->id,
                    'nombre_empleado' => $nombre,
                    'motivo' => ContpaqiExportacionDetalle::MOTIVO_MAPEO_INACTIVO,
                ];

                continue;
            }

            $valores = $this->mapper->mapear(
                $empleado,
                $desde,
                $hasta,
                $resumenes->get($empleado->id, collect()),
                $incidencias->get($empleado->id, collect()),
                $festivos,
                $empresa->contpaqiDiaInicioSemana(),
            );

            // Un empleado sin un solo movimiento no aporta nada al archivo y sí
            // estorba: CONTPAQi tendría que procesar un renglón vacío y quien
            // revise el archivo tendría que decidir si eso significa algo.
            if ($valores === []) {
                $omitidos[] = [
                    'empleado_id' => $empleado->id,
                    'nombre_empleado' => $nombre,
                    'motivo' => ContpaqiExportacionDetalle::MOTIVO_SIN_MOVIMIENTOS,
                ];

                continue;
            }

            $mnemonicosUsados = array_merge($mnemonicosUsados, array_keys($valores));

            $renglones[] = [
                'empleado_id' => $empleado->id,
                'codigo_empleado' => (string) $mapeo->codigo_empleado,
                'nombre_empleado' => $mapeo->nombre_contpaqi ?: $nombre,
                'valores' => $valores,
            ];
        }

        return [
            'renglones' => $renglones,
            'omitidos' => $omitidos,
            'tipos' => $this->columnasDe($empresa, array_unique($mnemonicosUsados)),
        ];
    }

    /**
     * Genera el archivo y deja constancia completa de la corrida.
     *
     * La bitácora se crea antes de empezar y no después, para que una
     * exportación que reviente a la mitad quede registrada como error en vez
     * de desaparecer sin rastro.
     */
    public function exportar(
        Empresa $empresa,
        CarbonImmutable $desde,
        CarbonImmutable $hasta,
        ?int $numeroPeriodo = null,
        ?User $usuario = null,
    ): ContpaqiExportacion {
        if (! config('contpaqi.enabled', true)) {
            throw new RuntimeException('El módulo de CONTPAQi está desactivado (contpaqi.enabled).');
        }

        // Va aquí y no sólo en el controlador para que el comando de consola
        // tampoco pueda pisar una nómina ya pagada.
        $cerrada = $this->cerradaQueTraslapa($empresa, $desde, $hasta);

        if ($cerrada !== null) {
            throw new RuntimeException(sprintf(
                'El período del %s al %s ya está cerrado (nómina pagada con el archivo %s). No se puede volver a generar.',
                $cerrada->periodo_inicio->toDateString(),
                $cerrada->periodo_fin->toDateString(),
                $cerrada->nombre_archivo,
            ));
        }

        $exportacion = ContpaqiExportacion::create([
            'empresa_id' => $empresa->id,
            'lote_uuid' => (string) Str::uuid(),
            'periodo_inicio' => $desde->toDateString(),
            'periodo_fin' => $hasta->toDateString(),
            'numero_periodo' => $numeroPeriodo,
            'estado' => ContpaqiExportacion::ESTADO_GENERANDO,
            'generado_por' => $usuario?->id,
        ]);

        try {
            $resultado = $this->previsualizar($empresa, $desde, $hasta);

            $nombreArchivo = $this->nombreArchivo($empresa, $desde, $hasta, $exportacion->lote_uuid);
            $ruta = $this->escribirArchivo($resultado, $nombreArchivo);

            DB::transaction(function () use ($exportacion, $resultado, $ruta, $nombreArchivo, $desde, $hasta) {
                $this->guardarDetalles($exportacion, $resultado);

                $exportacion->update([
                    'estado' => ContpaqiExportacion::ESTADO_GENERADA,
                    'disco' => config('contpaqi.disco', 'local'),
                    'ruta_archivo' => $ruta,
                    'nombre_archivo' => $nombreArchivo,
                    'empleados_exportados' => count($resultado['renglones']),
                    'empleados_omitidos' => count($resultado['omitidos']),
                    'renglones_generados' => count($resultado['renglones']),
                    'columnas' => $resultado['tipos']->pluck('mnemonico')->values()->all(),
                    'generada_at' => now(),
                ]);

                $this->marcarIncidenciasAplicadas($exportacion->empresa_id, $desde, $hasta);
            });

            return $exportacion->fresh(['detalles']);
        } catch (Throwable $e) {
            Log::error('Falló la exportación de prenómina a CONTPAQi', [
                'exportacion_id' => $exportacion->id,
                'empresa_id' => $empresa->id,
                'periodo' => "{$desde->toDateString()} a {$hasta->toDateString()}",
                'error' => $e->getMessage(),
            ]);

            $exportacion->update([
                'estado' => ContpaqiExportacion::ESTADO_ERROR,
                'mensaje_error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Escribe el .xlsx en un temporal local y lo sube al disco configurado.
     *
     * El rodeo es necesario porque PhpSpreadsheet escribe en el sistema de
     * archivos y no en un disco de Laravel; hacerlo así deja el módulo
     * funcionando igual si mañana los archivos se guardan en S3.
     *
     * El temporal vive en storage/app/tmp y no en sys_get_temp_dir() a
     * propósito: `artisan serve` arranca el servidor sin TMP/TEMP, y en
     * Windows eso deja a tempnam() sin directorio válido y la exportación
     * muere con "file created in the system's temporary directory". Además
     * tempnam() creaba un .tmp que nadie borraba, porque el nombre final
     * llevaba .xlsx concatenado.
     *
     * @param  array{renglones: list<array<string, mixed>>, tipos: Collection<int, ContpaqiTipoIncidencia>}  $resultado
     */
    private function escribirArchivo(array $resultado, string $nombreArchivo): string
    {
        $columnasFijas = config('contpaqi.layout.columnas_fijas', []);
        $disco = config('contpaqi.disco', 'local');
        $directorio = trim((string) config('contpaqi.directorio', 'contpaqi/prenomina'), '/');
        $ruta = $directorio.'/'.$nombreArchivo;

        $directorioTemporal = storage_path('app/tmp');
        File::ensureDirectoryExists($directorioTemporal);
        $temporal = $directorioTemporal.DIRECTORY_SEPARATOR.'contpaqi_'.Str::uuid().'.xlsx';

        try {
            $this->writer->escribir($temporal, $columnasFijas, $resultado['tipos'], $resultado['renglones']);

            $stream = fopen($temporal, 'rb');

            if ($stream === false) {
                throw new RuntimeException('No se pudo leer el archivo temporal de la prenómina.');
            }

            try {
                Storage::disk($disco)->put($ruta, $stream);
            } finally {
                fclose($stream);
            }
        } finally {
            if (is_file($temporal)) {
                @unlink($temporal);
            }
        }

        return $ruta;
    }

    /**
     * @param  array{renglones: list<array<string, mixed>>, omitidos: list<array<string, mixed>>}  $resultado
     */
    private function guardarDetalles(ContpaqiExportacion $exportacion, array $resultado): void
    {
        foreach ($resultado['renglones'] as $renglon) {
            ContpaqiExportacionDetalle::create([
                'contpaqi_exportacion_id' => $exportacion->id,
                'empleado_id' => $renglon['empleado_id'] ?? null,
                'codigo_empleado' => $renglon['codigo_empleado'],
                'nombre_empleado' => $renglon['nombre_empleado'],
                'estado' => ContpaqiExportacionDetalle::ESTADO_EXPORTADO,
                'valores' => $renglon['valores'],
            ]);
        }

        foreach ($resultado['omitidos'] as $omitido) {
            ContpaqiExportacionDetalle::create([
                'contpaqi_exportacion_id' => $exportacion->id,
                'empleado_id' => $omitido['empleado_id'],
                'nombre_empleado' => $omitido['nombre_empleado'],
                'estado' => ContpaqiExportacionDetalle::ESTADO_OMITIDO,
                'motivo' => $omitido['motivo'],
            ]);
        }
    }

    /**
     * Pasa a 'aplicada' las incidencias aprobadas que ya viajaron en el
     * archivo.
     *
     * No cambia lo que se exporta —el scope vigentes() incluye ambos estados a
     * propósito, para que regenerar un período dé el mismo archivo— pero sí
     * deja ver de un vistazo qué se capturó y todavía no llega a nómina.
     */
    private function marcarIncidenciasAplicadas(int $empresaId, CarbonImmutable $desde, CarbonImmutable $hasta): void
    {
        IncidenciaEmpleado::query()
            ->where('empresa_id', $empresaId)
            ->where('estado', IncidenciaEmpleado::ESTADO_APROBADA)
            ->enRango($desde, $hasta)
            ->update([
                'estado' => IncidenciaEmpleado::ESTADO_APLICADA,
                'updated_at' => now(),
            ]);
    }

    /**
     * Columnas de incidencia del archivo, en el orden del catálogo.
     *
     * Por default sólo salen las que alguien usó en el período. Un archivo con
     * 21 columnas de las que 15 están vacías es mucho más difícil de revisar a
     * ojo antes de importarlo, y revisarlo a ojo es exactamente lo que hay que
     * hacer las primeras veces.
     *
     * @param  list<string>  $mnemonicosUsados
     * @return Collection<int, ContpaqiTipoIncidencia>
     */
    private function columnasDe(Empresa $empresa, array $mnemonicosUsados): Collection
    {
        $query = ContpaqiTipoIncidencia::query()
            ->paraEmpresa($empresa->id)
            ->activos()
            ->orderBy('id');

        if (! config('contpaqi.layout.incluir_columnas_vacias', false)) {
            if ($mnemonicosUsados === []) {
                return collect();
            }

            $query->whereIn('mnemonico', $mnemonicosUsados);
        }

        return $query->get();
    }

    /** @return Collection<int, Empleado> */
    private function empleadosDe(Empresa $empresa): Collection
    {
        return Empleado::withoutTenant()
            ->with('turnoLaboral')
            ->where('empresa_id', $empresa->id)
            ->where('status', true)
            ->orderBy('id')
            ->get();
    }

    /** @return Collection<int, ContpaqiEmpleadoMapeo> Indexada por empleado_id */
    private function mapeosDe(Empresa $empresa): Collection
    {
        return ContpaqiEmpleadoMapeo::query()
            ->paraEmpresa($empresa->id)
            ->get()
            ->keyBy('empleado_id');
    }

    /** @return Collection<int, Collection<int, AsistenciaResumenDiario>> Agrupada por empleado_id */
    private function resumenesDe(Empresa $empresa, CarbonImmutable $desde, CarbonImmutable $hasta): Collection
    {
        // El tope va al final del día: en SQLite la fecha se guarda como
        // "Y-m-d 00:00:00" y contra "Y-m-d" el último día quedaba fuera.
        return AsistenciaResumenDiario::withoutTenant()
            ->where('empresa_id', $empresa->id)
            ->whereBetween('fecha', [$desde->toDateString(), $hasta->endOfDay()->toDateTimeString()])
            ->get()
            ->groupBy('empleado_id');
    }

    /** @return Collection<int, Collection<int, IncidenciaEmpleado>> Agrupada por empleado_id */
    private function incidenciasDe(Empresa $empresa, CarbonImmutable $desde, CarbonImmutable $hasta): Collection
    {
        return IncidenciaEmpleado::query()
            ->with('tipo')
            ->paraEmpresa($empresa->id)
            ->vigentes()
            ->enRango($desde, $hasta)
            ->get()
            ->groupBy('empleado_id');
    }

    /**
     * Incidencias del período que nadie ha aprobado ni rechazado.
     *
     * No entran al archivo —sólo las aprobadas cuentan— y ése es el problema:
     * se quedan fuera en silencio y el empleado aparece con faltas que sí
     * tenía justificadas. La pantalla las anuncia antes de generar para que
     * la omisión sea una decisión y no un descuido.
     */
    public function incidenciasPendientes(Empresa $empresa, CarbonImmutable $desde, CarbonImmutable $hasta): int
    {
        return IncidenciaEmpleado::query()
            ->paraEmpresa($empresa->id)
            ->whereIn('estado', [IncidenciaEmpleado::ESTADO_BORRADOR, IncidenciaEmpleado::ESTADO_PENDIENTE])
            ->enRango($desde, $hasta)
            ->count();
    }

    /** La exportación cerrada que ya cubre alguna fecha del período, si la hay. */
    public function cerradaQueTraslapa(Empresa $empresa, CarbonImmutable $desde, CarbonImmutable $hasta): ?ContpaqiExportacion
    {
        return ContpaqiExportacion::query()
            ->paraEmpresa($empresa->id)
            ->cerradasEnRango($desde, $hasta)
            ->orderByDesc('cerrada_at')
            ->first();
    }

    /**
     * Da por definitiva una exportación: la nómina ya se pagó con este archivo.
     *
     * A partir de aquí el período queda bloqueado para nuevas exportaciones y
     * las incidencias que viajaron en él siguen en 'aplicada', que ya era
     * terminal. Sólo se cierra lo que tiene archivo y no está cerrado.
     */
    public function cerrar(ContpaqiExportacion $exportacion, ?User $usuario = null): ContpaqiExportacion
    {
        if (! $exportacion->sePuedeCerrar()) {
            throw new RuntimeException(match ($exportacion->estado) {
                ContpaqiExportacion::ESTADO_CERRADA => 'Esta exportación ya está cerrada.',
                ContpaqiExportacion::ESTADO_ERROR => 'Una exportación fallida no se puede cerrar: no tiene archivo.',
                default => 'La exportación todavía no tiene archivo que cerrar.',
            });
        }

        $exportacion->update([
            'estado' => ContpaqiExportacion::ESTADO_CERRADA,
            'cerrada_por' => $usuario?->id,
            'cerrada_at' => now(),
        ]);

        return $exportacion;
    }

    /**
     * Festivos del período como 'Y-m-d' => es oficial LFT.
     *
     * Los de empresa_id nulo son los oficiales del país y aplican a todas las
     * empresas; los que traen empresa se suman sólo para la suya.
     *
     * @return array<string, bool>
     */
    private function festivosDe(Empresa $empresa, CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        return DiaFestivo::query()
            ->where(function ($q) use ($empresa) {
                $q->where('empresa_id', $empresa->id)->orWhereNull('empresa_id');
            })
            ->whereBetween('fecha', [$desde->toDateString(), $hasta->toDateString()])
            ->get()
            ->mapWithKeys(fn (DiaFestivo $d) => [
                $d->fecha instanceof \DateTimeInterface ? $d->fecha->format('Y-m-d') : (string) $d->fecha => (bool) $d->es_oficial_lft,
            ])
            ->all();
    }

    private function nombreArchivo(Empresa $empresa, CarbonImmutable $desde, CarbonImmutable $hasta, string $loteUuid): string
    {
        $empresaSlug = Str::slug((string) $empresa->razon_social) ?: 'empresa';

        return sprintf(
            'prenomina-%s-%s-a-%s-%s.xlsx',
            $empresaSlug,
            $desde->format('Ymd'),
            $hasta->format('Ymd'),
            substr($loteUuid, 0, 8),
        );
    }
}
