<?php

namespace App\Services\Contpaqi;

use App\Models\AsistenciaResumenDiario;
use App\Models\Empleado;
use App\Models\IncidenciaEmpleado;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

/**
 * Traduce lo que Shigoto sabe de un empleado en un período a los mnemónicos
 * del catálogo de CONTPAQi.
 *
 * Éste es el punto fino de toda la integración, el equivalente del
 * PunchedTimeMapper de PeopleSoft. Todo lo que decide "esto se paga como
 * aquello" vive aquí y en config/contpaqi.php, en ningún otro lado.
 *
 * Dos fuentes se suman:
 *
 *   1. Lo derivado de la asistencia — días trabajados, horas extra, retardos,
 *      festivos y descansos laborados, faltas.
 *   2. Lo capturado a mano — vacaciones, permisos, incapacidades, castigos.
 *
 * El mapper no consulta la base de datos: recibe todo precargado. Es para que
 * el servicio de exportación pueda traer los datos de cientos de empleados en
 * un puñado de consultas en vez de una por persona.
 */
class IncidenciaMapper
{
    /**
     * Horas extra semanales que la LFT paga al doble antes de pasar a triple.
     *
     * Arts. 66-68: hasta 3 horas diarias y 3 veces por semana al 100% extra;
     * el excedente, al 200%. Es la misma regla 3x3 que aplica
     * CalculoAsistenciaLftService, replicada aquí porque la exportación puede
     * cubrir un período que no coincide con la semana calculada.
     */
    private const TOPE_HORAS_DOBLES = 9.00;

    /** @var array<string, string|null> */
    private array $derivacion;

    private bool $derivarFaltas;

    public function __construct()
    {
        $this->derivacion = config('contpaqi.derivacion', []);
        $this->derivarFaltas = (bool) config('contpaqi.derivar_faltas', true);
    }

    /**
     * Movimientos de un empleado en el período, como mnemónico => cantidad.
     *
     * Sólo devuelve los mnemónicos con cantidad distinta de cero: un renglón
     * de prenómina lleno de ceros no le dice nada a nadie y hace el archivo
     * ilegible.
     *
     * @param  Collection<int, AsistenciaResumenDiario>  $resumenes  Resúmenes diarios del período
     * @param  Collection<int, IncidenciaEmpleado>  $incidencias  Incidencias vigentes que tocan el período
     * @param  array<string, bool>  $festivos  'Y-m-d' => es oficial LFT
     * @return array<string, float>
     */
    public function mapear(
        Empleado $empleado,
        CarbonImmutable $desde,
        CarbonImmutable $hasta,
        Collection $resumenes,
        Collection $incidencias,
        array $festivos,
    ): array {
        $movimientos = [];

        $this->acumularAsistencia($movimientos, $resumenes, $festivos);
        $this->acumularFaltas($movimientos, $empleado, $desde, $hasta, $resumenes, $incidencias, $festivos);
        $this->acumularIncidencias($movimientos, $incidencias, $desde, $hasta);

        return array_filter(
            array_map(fn (float $v) => round($v, 2), $movimientos),
            fn (float $v) => abs($v) > 0.0001
        );
    }

    /**
     * Lo que se deduce de los marcajes ya procesados.
     *
     * Un día trabajado cae en exactamente una categoría, nunca en dos. El
     * orden de la decisión importa y es deliberado:
     *
     *   festivo oficial > festivo de empresa > día de descanso > día normal
     *
     * Sin esa exclusividad, un domingo festivo trabajado saldría contado como
     * DDOL y como DDL y como TRAB, y se pagaría tres veces.
     *
     * @param  array<string, float>  $movimientos
     * @param  Collection<int, AsistenciaResumenDiario>  $resumenes
     * @param  array<string, bool>  $festivos
     */
    private function acumularAsistencia(array &$movimientos, Collection $resumenes, array $festivos): void
    {
        $totalHorasExtra = 0.00;
        $totalMinutosRetardo = 0;

        foreach ($resumenes as $resumen) {
            $horasOrdinarias = (float) $resumen->horas_ordinarias;
            $totalHorasExtra += (float) $resumen->horas_extra_diarias;
            $totalMinutosRetardo += (int) $resumen->minutos_retraso;

            // Sin horas ordinarias no hubo jornada que clasificar. Las horas
            // extra y el retardo ya se acumularon arriba, que es lo correcto:
            // se pagan aunque el día no cuente como día trabajado.
            if ($horasOrdinarias <= 0) {
                continue;
            }

            $fecha = $resumen->fecha->format('Y-m-d');

            if (array_key_exists($fecha, $festivos)) {
                $mnemonico = $festivos[$fecha]
                    ? $this->mnemonico('descanso_obligatorio_laborado')
                    : $this->mnemonico('festivo_trabajado');
            } elseif ($resumen->es_dia_descanso) {
                $mnemonico = $this->mnemonico('descanso_laborado');
            } else {
                $mnemonico = $this->mnemonico('dias_trabajados');
            }

            $this->sumar($movimientos, $mnemonico, 1.0);
        }

        // Regla 3x3: las primeras 9 horas extra del período al doble, el resto
        // al triple. Se aplica sobre el total del período y no día por día
        // porque el tope es semanal, no diario.
        if ($totalHorasExtra > 0) {
            $dobles = min(self::TOPE_HORAS_DOBLES, $totalHorasExtra);
            $triples = max(0.00, $totalHorasExtra - self::TOPE_HORAS_DOBLES);

            $this->sumar($movimientos, $this->mnemonico('horas_extra_dobles'), $dobles);
            $this->sumar($movimientos, $this->mnemonico('horas_extra_triples'), $triples);
        }

        // El catálogo del cliente mide los retardos en horas, no en minutos ni
        // en número de eventos.
        if ($totalMinutosRetardo > 0) {
            $this->sumar($movimientos, $this->mnemonico('retardos'), $totalMinutosRetardo / 60.0);
        }
    }

    /**
     * Faltas injustificadas.
     *
     * Es la derivación más delicada del módulo porque descuenta dinero y
     * proporción de séptimo día. Por eso sólo marca falta cuando se cumplen
     * las cuatro condiciones a la vez: el día era laborable según el turno, no
     * era festivo, no hay resumen con horas, y ninguna incidencia vigente
     * cubre esa fecha.
     *
     * La cuarta condición es la razón de ser del módulo de captura: sin él,
     * alguien de vacaciones aparecería con faltas injustificadas toda la
     * semana.
     *
     * @param  array<string, float>  $movimientos
     * @param  Collection<int, AsistenciaResumenDiario>  $resumenes
     * @param  Collection<int, IncidenciaEmpleado>  $incidencias
     * @param  array<string, bool>  $festivos
     */
    private function acumularFaltas(
        array &$movimientos,
        Empleado $empleado,
        CarbonImmutable $desde,
        CarbonImmutable $hasta,
        Collection $resumenes,
        Collection $incidencias,
        array $festivos,
    ): void {
        if (! $this->derivarFaltas) {
            return;
        }

        $mnemonico = $this->mnemonico('falta_injustificada');

        if ($mnemonico === null) {
            return;
        }

        $diasLaborables = $empleado->turnoLaboral?->dias_laborables ?? [1, 2, 3, 4, 5];

        // Se recorre el calendario y no los resúmenes: el día que alguien
        // falta normalmente no genera resumen, así que buscar la ausencia
        // entre las filas existentes nunca la encontraría.
        $conHoras = $resumenes
            ->filter(fn ($r) => (float) $r->horas_ordinarias > 0 || (float) $r->horas_extra_diarias > 0)
            ->map(fn ($r) => $r->fecha->format('Y-m-d'))
            ->all();

        $cubiertas = $incidencias->filter(
            fn (IncidenciaEmpleado $i) => in_array($i->estado, [
                IncidenciaEmpleado::ESTADO_APROBADA,
                IncidenciaEmpleado::ESTADO_APLICADA,
            ], true)
        );

        $faltas = 0.0;

        foreach (CarbonPeriod::create($desde, $hasta) as $dia) {
            $fecha = $dia->format('Y-m-d');

            if (! in_array($dia->dayOfWeekIso, $diasLaborables, true)) {
                continue;
            }

            if (array_key_exists($fecha, $festivos)) {
                continue;
            }

            if (in_array($fecha, $conHoras, true)) {
                continue;
            }

            $inmutable = CarbonImmutable::parse($fecha);

            if ($cubiertas->contains(fn (IncidenciaEmpleado $i) => $i->cubre($inmutable))) {
                continue;
            }

            $faltas++;
        }

        if ($faltas > 0) {
            $this->sumar($movimientos, $mnemonico, $faltas);
        }
    }

    /**
     * Incidencias capturadas a mano.
     *
     * Una incidencia puede rebasar el período por cualquiera de los dos lados
     * —una incapacidad de tres semanas cruza tres nóminas semanales— así que
     * se prorratea por días naturales cubiertos. Con `cantidad` = 15 días y 7
     * de esos días dentro del período, entran 7.
     *
     * El prorrateo usa días naturales y no laborables porque así se capturan
     * las incapacidades del IMSS, que corren de corrido incluyendo domingos.
     *
     * @param  array<string, float>  $movimientos
     * @param  Collection<int, IncidenciaEmpleado>  $incidencias
     */
    private function acumularIncidencias(
        array &$movimientos,
        Collection $incidencias,
        CarbonImmutable $desde,
        CarbonImmutable $hasta,
    ): void {
        foreach ($incidencias as $incidencia) {
            if (! in_array($incidencia->estado, [
                IncidenciaEmpleado::ESTADO_APROBADA,
                IncidenciaEmpleado::ESTADO_APLICADA,
            ], true)) {
                continue;
            }

            $mnemonico = $incidencia->tipo?->mnemonico;

            if (blank($mnemonico)) {
                continue;
            }

            /*
             * Todo se normaliza a medianoche antes de contar. El período llega
             * con `hasta` al final del día (23:59:59) y Carbon 3 devuelve la
             * diferencia en días como float, así que sin esto un rango de 4
             * días medía 3.99 y el prorrateo salía inflado.
             */
            $inicio = CarbonImmutable::parse($incidencia->fecha_inicio)->startOfDay();
            $fin = CarbonImmutable::parse($incidencia->fecha_fin)->startOfDay();

            $inicioDentro = $inicio->max($desde->startOfDay());
            $finDentro = $fin->min($hasta->startOfDay());

            if ($inicioDentro->gt($finDentro)) {
                continue;
            }

            $diasTotales = (int) $inicio->diffInDays($fin) + 1;
            $diasDentro = (int) $inicioDentro->diffInDays($finDentro) + 1;
            $cantidad = (float) $incidencia->cantidad;

            // Sin prorrateo cuando cabe completa, para que el número que se
            // capturó sea exactamente el que se exporta.
            $aportacion = $diasDentro >= $diasTotales
                ? $cantidad
                : $cantidad * ($diasDentro / $diasTotales);

            $this->sumar($movimientos, $mnemonico, $aportacion);
        }
    }

    /**
     * Mnemónico configurado para una derivación, o null si está desactivada.
     *
     * Un null desactiva la derivación en silencio y a propósito: es preferible
     * que un concepto no se exporte a que se exporte con un mnemónico
     * inventado que CONTPAQi rechazaría —o peor, aceptaría como otra cosa.
     */
    private function mnemonico(string $clave): ?string
    {
        $valor = $this->derivacion[$clave] ?? null;

        return blank($valor) ? null : (string) $valor;
    }

    /** @param  array<string, float>  $movimientos */
    private function sumar(array &$movimientos, ?string $mnemonico, float $cantidad): void
    {
        if ($mnemonico === null || abs($cantidad) < 0.0001) {
            return;
        }

        $movimientos[$mnemonico] = ($movimientos[$mnemonico] ?? 0.00) + $cantidad;
    }
}
