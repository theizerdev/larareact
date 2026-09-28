<?php

namespace App\Services;

use App\Models\AsistenciaMarcaje;
use App\Models\BiotimeMarcaje;
use App\Models\ContpaqiEmpleadoMapeo;
use App\Models\ContpaqiExportacion;
use App\Models\Empleado;
use App\Models\Empresa;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Puente entre el reloj checador (BioTime) y la nómina.
 *
 * El sincronizador deja las checadas en el espejo `biotime_marcajes`, que a
 * propósito no alimenta nada. Este servicio las copia a `asistencia_marcajes`
 * —de donde ya leen el kiosko, el cálculo LFT y los reportes— y recalcula el
 * resumen diario, que es lo que IncidenciaMapper convierte en días
 * trabajados, horas extra, retardos y faltas para CONTPAQi.
 *
 *   reloj ─► biotime_marcajes ─► asistencia_marcajes ─► resumen diario ─► prenómina
 *            (BioTimeSyncService)   (este servicio)       (CalculoAsistenciaLft)
 *
 * La unidad de trabajo es el día de un empleado, no la checada suelta: en
 * relojes que no distinguen entrada de salida el tipo se deduce por el orden,
 * así que una checada nueva puede cambiar el tipo de las anteriores del mismo
 * día. Por eso cada día sucio se reprocesa completo.
 *
 * Un día está sucio cuando el espejo y asistencia no coinciden: checada
 * vinculada sin copiar, copiada a otro empleado (se corrigió el vínculo) o
 * copiada y luego desvinculada. Es autocorrectivo: no hay marca de agua que
 * pueda quedar mal, y vincular hoy a un empleado trae sus checadas viejas.
 *
 * Los días dentro de un período de CONTPAQi ya cerrado no se tocan: esa
 * nómina se pagó y el resumen es la evidencia de con qué se pagó.
 */
class BioTimeAsistenciaService
{
    public const ORIGEN = 'biotime';

    public function __construct(private readonly CalculoAsistenciaLftService $calculo) {}

    /**
     * Copia las checadas pendientes y recalcula los días afectados.
     *
     * @param  bool  $forzar  Reprocesa todos los días del rango aunque no estén sucios.
     * @return array{dias: int, marcajes: int, bloqueados: int, errores: list<string>}
     */
    public function importar(Empresa $empresa, ?CarbonImmutable $desde = null, ?CarbonImmutable $hasta = null, bool $forzar = false): array
    {
        $resultado = ['dias' => 0, 'marcajes' => 0, 'bloqueados' => 0, 'errores' => []];

        $pares = $this->diasSucios($empresa, $desde, $hasta, $forzar);

        if ($pares === []) {
            return $resultado;
        }

        $cerrados = $this->periodosCerrados($empresa);

        $empleados = Empleado::withoutTenant()
            ->with(['turnoLaboral' => fn ($q) => $q->withoutGlobalScope('multitenancy')])
            ->whereIn('id', array_unique(array_column($pares, 'empleado_id')))
            ->get()
            ->keyBy('id');

        foreach ($pares as ['empleado_id' => $empleadoId, 'fecha' => $fecha]) {
            if ($this->estaCerrado($fecha, $cerrados)) {
                $resultado['bloqueados']++;

                continue;
            }

            $empleado = $empleados->get($empleadoId);

            if ($empleado === null) {
                continue;
            }

            try {
                $resultado['marcajes'] += $this->procesarDia($empleado, $fecha);
                $resultado['dias']++;
            } catch (\Throwable $e) {
                $resultado['errores'][] = "Empleado #{$empleadoId} {$fecha}: {$e->getMessage()}";
                Log::channel('biotime')->error('Importación de checadas a asistencia falló', [
                    'empresa_id' => $empresa->id,
                    'empleado_id' => $empleadoId,
                    'fecha' => $fecha,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        return $resultado;
    }

    /**
     * Lo que conviene saber del reloj antes de generar la prenómina.
     *
     * Lo más importante es la última lista: empleados que van en el archivo
     * y no tienen una sola checada en el período. Si no es porque
     * faltaron toda la semana, es porque no están vinculados al reloj, y en
     * ambos casos el archivo los va a descontar.
     *
     * @return array<string, mixed>
     */
    public function diagnostico(Empresa $empresa, CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        $rango = [$desde->startOfDay()->toDateTimeString(), $hasta->endOfDay()->toDateTimeString()];

        $conectado = (bool) $empresa->biotime_active && filled($empresa->biotime_base_url);

        $sinVincular = BiotimeMarcaje::query()
            ->where('empresa_id', $empresa->id)
            ->whereBetween('punch_time', $rango)
            ->whereNull('empleado_id');

        $vinculadosAlReloj = DB::table('biotime_empleados')
            ->where('empresa_id', $empresa->id)
            ->whereNotNull('empleado_id')
            ->pluck('empleado_id')
            ->all();

        $conChecadas = AsistenciaMarcaje::withoutTenant()
            ->where('empresa_id', $empresa->id)
            ->whereBetween('fecha_hora', $rango)
            ->distinct()
            ->pluck('empleado_id')
            ->all();

        $sinChecadas = Empleado::withoutTenant()
            ->where('empresa_id', $empresa->id)
            ->where('status', true)
            ->whereIn('id', ContpaqiEmpleadoMapeo::query()->paraEmpresa($empresa->id)->where('activo', true)->select('empleado_id'))
            ->whereNotIn('id', $conChecadas)
            ->orderBy('nombres')
            ->get(['id', 'nombres', 'apellidos']);

        return [
            'conectado' => $conectado,
            'alimenta_nomina' => (bool) config('biotime.asistencia.alimentar', true),
            'ultima_sincronizacion' => $empresa->biotime_last_sync_at?->toDateTimeString(),
            'checadas_periodo' => $conectado
                ? BiotimeMarcaje::query()->where('empresa_id', $empresa->id)->whereBetween('punch_time', $rango)->count()
                : 0,
            'checadas_sin_vincular' => $conectado ? (clone $sinVincular)->count() : 0,
            'codigos_sin_vincular' => $conectado ? (clone $sinVincular)->distinct()->count('emp_code') : 0,
            'dias_por_importar' => $conectado ? count($this->diasSucios($empresa, $desde, $hasta)) : 0,
            'empleados_sin_checadas_total' => $sinChecadas->count(),
            'empleados_sin_checadas' => $sinChecadas->take(15)->map(fn (Empleado $e) => [
                'id' => $e->id,
                'nombre' => $e->nombre_completo,
                'vinculado_reloj' => in_array($e->id, $vinculadosAlReloj, false),
            ])->values()->all(),
        ];
    }

    /**
     * Tipo de marcaje de cada checada de un día, indexado por id del espejo.
     *
     * @param  Collection<int, BiotimeMarcaje>  $checadas  Del mismo empleado y día, en orden cronológico
     * @return array<int, string>
     */
    public function clasificar(Collection $checadas): array
    {
        $estados = config('biotime.asistencia.estados', []);
        $modo = config('biotime.asistencia.tipo_por', 'auto');

        if ($modo === 'auto') {
            $modo = $this->estadosSonConfiables($checadas, $estados) ? 'estado' : 'orden';
        }

        if ($modo === 'estado') {
            return $checadas->mapWithKeys(fn (BiotimeMarcaje $m) => [
                $m->id => $estados[(string) $m->punch_state] ?? 'checada',
            ])->all();
        }

        return $this->clasificarPorOrden($checadas);
    }

    /* ------------------------------------------------------------------ */
    /*  Internos */
    /* ------------------------------------------------------------------ */

    /**
     * Días (empleado, fecha) donde el espejo y asistencia no coinciden.
     *
     * @return list<array{empleado_id: int, fecha: string}>
     */
    private function diasSucios(Empresa $empresa, ?CarbonImmutable $desde, ?CarbonImmutable $hasta, bool $forzar = false): array
    {
        $filas = DB::table('biotime_marcajes as bm')
            ->leftJoin('asistencia_marcajes as am', 'am.biotime_marcaje_id', '=', 'bm.id')
            ->where('bm.empresa_id', $empresa->id)
            ->when($desde, fn ($q) => $q->where('bm.punch_time', '>=', $desde->startOfDay()->toDateTimeString()))
            ->when($hasta, fn ($q) => $q->where('bm.punch_time', '<=', $hasta->endOfDay()->toDateTimeString()))
            ->where(function ($q) use ($forzar) {
                if ($forzar) {
                    $q->whereNotNull('bm.empleado_id')->orWhereNotNull('am.id');

                    return;
                }

                // Vinculada y sin copiar, o copiada al empleado equivocado.
                $q->where(fn ($q) => $q->whereNotNull('bm.empleado_id')->where(
                    fn ($q) => $q->whereNull('am.id')->orWhereColumn('am.empleado_id', '!=', 'bm.empleado_id')
                ))
                // Copiada y después desvinculada.
                    ->orWhere(fn ($q) => $q->whereNull('bm.empleado_id')->whereNotNull('am.id'));
            })
            ->select('bm.empleado_id', 'bm.punch_time', 'am.empleado_id as anterior_empleado_id', 'am.fecha_hora as anterior_fecha_hora')
            ->cursor();

        $pares = [];

        foreach ($filas as $fila) {
            if ($fila->empleado_id !== null) {
                $pares[$fila->empleado_id.'|'.substr((string) $fila->punch_time, 0, 10)] = true;
            }

            // El día del que se va la checada también cambia.
            if ($fila->anterior_empleado_id !== null && $fila->anterior_empleado_id != $fila->empleado_id) {
                $pares[$fila->anterior_empleado_id.'|'.substr((string) $fila->anterior_fecha_hora, 0, 10)] = true;
            }
        }

        return array_map(function (string $clave) {
            [$empleadoId, $fecha] = explode('|', $clave);

            return ['empleado_id' => (int) $empleadoId, 'fecha' => $fecha];
        }, array_keys($pares));
    }

    /**
     * Rehace las checadas de reloj de un día y recalcula su resumen.
     *
     * @return int Checadas del reloj que quedaron en el día
     */
    private function procesarDia(Empleado $empleado, string $fecha): int
    {
        $rango = [$fecha.' 00:00:00', $fecha.' 23:59:59'];

        $checadas = BiotimeMarcaje::query()
            ->where('empleado_id', $empleado->id)
            ->whereBetween('punch_time', $rango)
            ->orderBy('punch_time')
            ->orderBy('id')
            ->get();

        $tipos = $this->clasificar($checadas);

        DB::transaction(function () use ($empleado, $fecha, $rango, $checadas, $tipos) {
            // Sin bitácora por checada: un backfill son decenas de miles de
            // filas y el origen ya queda en la columna. Los cambios al resumen
            // diario, que son los que mueven dinero, sí se registran.
            activity()->withoutLogs(function () use ($empleado, $rango, $checadas, $tipos) {
                foreach ($checadas as $checada) {
                    AsistenciaMarcaje::withoutTenant()->updateOrCreate(
                        ['biotime_marcaje_id' => $checada->id],
                        [
                            'empresa_id' => $empleado->empresa_id,
                            'sucursal_id' => $empleado->sucursal_id,
                            'empleado_id' => $empleado->id,
                            'tipo_marcaje' => $tipos[$checada->id],
                            'fecha_hora' => $checada->punch_time,
                            'origen' => self::ORIGEN,
                            'dispositivo_id' => $checada->dispositivo_sn,
                            'latitud' => $checada->latitude,
                            'longitud' => $checada->longitude,
                            'observaciones' => trim('Reloj '.($checada->dispositivo_alias ?? $checada->dispositivo_sn ?? '')),
                        ],
                    );
                }

                AsistenciaMarcaje::withoutTenant()
                    ->where('empleado_id', $empleado->id)
                    ->where('origen', self::ORIGEN)
                    ->whereBetween('fecha_hora', $rango)
                    ->whereNotIn('biotime_marcaje_id', $checadas->pluck('id'))
                    ->delete();
            });

            $this->calculo->calcularHorasDiarias($empleado, $fecha);
        });

        return $checadas->count();
    }

    /**
     * El reloj distingue entrada de salida si el día trae estados conocidos
     * y no todos iguales. Un reloj sin teclas de estado manda todo como "0";
     * creerle convertiría la salida de la tarde en una segunda entrada y el
     * día quedaría sin horas.
     *
     * @param  Collection<int, BiotimeMarcaje>  $checadas
     * @param  array<string, string>  $estados
     */
    private function estadosSonConfiables(Collection $checadas, array $estados): bool
    {
        $valores = $checadas->map(fn (BiotimeMarcaje $m) => (string) $m->punch_state);

        if ($valores->contains(fn (string $v) => ! array_key_exists($v, $estados))) {
            return false;
        }

        return $checadas->count() === 1 || $valores->unique()->count() > 1;
    }

    /**
     * Primera = entrada, última = salida; con cuatro o más, la segunda y la
     * tercera son la comida. Los rebotes y las intermedias que sobran se
     * guardan como 'duplicado' y 'checada': quedan a la vista en la bitácora
     * pero el cálculo LFT no las toma.
     *
     * @param  Collection<int, BiotimeMarcaje>  $checadas
     * @return array<int, string>
     */
    private function clasificarPorOrden(Collection $checadas): array
    {
        $rebote = max(0, (int) config('biotime.asistencia.minutos_rebote', 3));
        $tipos = [];
        $validas = [];
        $anterior = null;

        foreach ($checadas as $checada) {
            if ($anterior !== null && $anterior->diffInMinutes($checada->punch_time, true) < $rebote) {
                $tipos[$checada->id] = 'duplicado';

                continue;
            }

            $validas[] = $checada->id;
            $anterior = $checada->punch_time;
        }

        $total = count($validas);

        foreach ($validas as $i => $id) {
            $tipos[$id] = match (true) {
                $i === 0 => 'entrada',
                $i === $total - 1 => 'salida',
                $total >= 4 && $i === 1 => 'salida_comida',
                $total >= 4 && $i === 2 => 'entrada_comida',
                default => 'checada',
            };
        }

        return $tipos;
    }

    /** @return Collection<int, array{string, string}> */
    private function periodosCerrados(Empresa $empresa): Collection
    {
        return ContpaqiExportacion::query()
            ->paraEmpresa($empresa->id)
            ->where('estado', ContpaqiExportacion::ESTADO_CERRADA)
            ->get(['periodo_inicio', 'periodo_fin'])
            ->map(fn (ContpaqiExportacion $e) => [$e->periodo_inicio->toDateString(), $e->periodo_fin->toDateString()]);
    }

    /** @param  Collection<int, array{string, string}>  $cerrados */
    private function estaCerrado(string $fecha, Collection $cerrados): bool
    {
        return $cerrados->contains(fn (array $p) => $fecha >= $p[0] && $fecha <= $p[1]);
    }
}
