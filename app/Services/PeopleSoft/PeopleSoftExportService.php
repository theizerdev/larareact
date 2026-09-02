<?php

namespace App\Services\PeopleSoft;

use App\Models\BiotimeMarcaje;
use App\Models\Empresa;
use App\Models\PeoplesoftEmpleadoMapeo;
use App\Models\PeoplesoftExportacion;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Orquesta el envío de marcajes de `biotime_marcajes` a PeopleSoft Time and
 * Labor como mensajes PUNCHED_TIME_ADD.
 *
 * Reglas de oro (mismas que la integración de BioTime, esta app está en
 * producción):
 *  - Por defecto NO envía nada: config('peoplesoft.dry_run') es true y se
 *    limita a generar y guardar el payload.
 *  - Idempotente: un marcaje ya enviado no se vuelve a mandar. La clave única
 *    (empresa_id, biotime_marcaje_id) del outbox lo garantiza.
 *  - No modifica `biotime_marcajes`, ni `asistencia_marcajes`, ni el cálculo
 *    LFT. Sólo lee de los primeros y escribe en `peoplesoft_exportaciones`.
 *  - `exportar()` no propaga excepciones: registra y devuelve un resumen.
 */
class PeopleSoftExportService
{
    public function __construct(
        private readonly PunchedTimeMapper $mapper,
        private readonly PunchedTimeMessageBuilder $builder,
        private readonly PeopleSoftClient $client,
    ) {}

    public static function make(): self
    {
        return new self(
            PunchedTimeMapper::fromConfig(),
            new PunchedTimeMessageBuilder,
            PeopleSoftClient::fromConfig(),
        );
    }

    /**
     * Procesa la ventana indicada para una empresa.
     *
     * @param  bool  $enviar  true = intentar envío real (además exige que
     *                        config('peoplesoft.enabled') sea true).
     *                        El resumen trae: ok, empresa_id, desde, hasta, los contadores
     *                        (revisados, mapeados, omitidos, ya_enviados, enviados, simulados,
     *                        errores), el detalle de `lotes` y los `mensajes` para el operador.
     * @return array<string,mixed>
     */
    public function exportar(Empresa $empresa, CarbonImmutable $desde, CarbonImmutable $hasta, bool $enviar = false): array
    {
        $resumen = [
            'ok' => true,
            'empresa_id' => $empresa->id,
            'desde' => $desde->toDateTimeString(),
            'hasta' => $hasta->toDateTimeString(),
            'revisados' => 0,
            'mapeados' => 0,
            'omitidos' => 0,
            'ya_enviados' => 0,
            'enviados' => 0,
            'simulados' => 0,
            'errores' => 0,
            'lotes' => [],
            'mensajes' => [],
        ];

        // El envío real necesita las dos llaves: la del entorno y la de la
        // corrida. Si falta cualquiera, se degrada a simulación en vez de
        // fallar: producir el payload siempre es seguro y útil.
        $envioReal = $enviar && (bool) config('peoplesoft.enabled') && ! (bool) config('peoplesoft.dry_run');

        if ($enviar && ! $envioReal) {
            $resumen['mensajes'][] = 'Se pidió envío real pero la configuración lo impide; se ejecutó en modo simulación.';
            foreach ($this->client->faltantes() as $falta) {
                $resumen['mensajes'][] = $falta;
            }
        }

        try {
            $mapeos = $this->mapeosPorEmpCode($empresa);
            $pendientes = [];

            $this->marcajesDeLaVentana($empresa, $desde, $hasta)
                ->chunkById((int) config('peoplesoft.db_chunk', 200), function ($marcajes) use (&$resumen, &$pendientes, $mapeos, $empresa) {
                    foreach ($marcajes as $marcaje) {
                        $resumen['revisados']++;

                        $previa = PeoplesoftExportacion::query()
                            ->where('empresa_id', $empresa->id)
                            ->where('biotime_marcaje_id', $marcaje->getKey())
                            ->first();

                        // Ya salió con éxito: no se toca. Reenviar duplicaría
                        // horas en la nómina del cliente.
                        if ($previa && $previa->estado === PeoplesoftExportacion::ESTADO_ENVIADO) {
                            $resumen['ya_enviados']++;

                            continue;
                        }

                        $resultado = $this->mapper->map($marcaje, $mapeos[$marcaje->emp_code] ?? null);

                        if (! $resultado['ok']) {
                            $resumen['omitidos']++;
                            $this->registrar($empresa, $marcaje, [
                                'estado' => PeoplesoftExportacion::ESTADO_OMITIDO,
                                'motivo' => $resultado['motivo'],
                                'emp_code' => $marcaje->emp_code,
                            ]);

                            continue;
                        }

                        $resumen['mapeados']++;
                        $pendientes[] = ['marcaje' => $marcaje, 'fila' => $resultado['fila']];
                    }
                });

            foreach (array_chunk($pendientes, max(1, (int) config('peoplesoft.batch_size', 250))) as $lote) {
                $resumen['lotes'][] = $this->procesarLote($empresa, $lote, $envioReal, $resumen);
            }
        } catch (\Throwable $e) {
            $resumen['ok'] = false;
            $resumen['mensajes'][] = 'Error al exportar: '.$e->getMessage();
            Log::channel('peoplesoft')->error('PeopleSoft export error: '.$e->getMessage(), [
                'empresa_id' => $empresa->id,
                'exception' => $e::class,
            ]);
        }

        Log::channel('peoplesoft')->info('PeopleSoft export', $resumen);

        return $resumen;
    }

    /**
     * Arma, guarda y (si procede) envía un lote.
     *
     * @param  array<int,array{marcaje: BiotimeMarcaje, fila: array<string,mixed>}>  $lote
     * @param  array<string,mixed>  $resumen
     * @return array<string,mixed>
     */
    private function procesarLote(Empresa $empresa, array $lote, bool $envioReal, array &$resumen): array
    {
        $loteUuid = (string) Str::uuid();
        $filas = array_column($lote, 'fila');

        $mensajeXml = $this->builder->build($filas);
        $operacion = (string) config('peoplesoft.operation_punched_time', 'PUNCHED_TIME_ADD.VERSION_1');

        $detalle = [
            'lote' => $loteUuid,
            'marcajes' => count($lote),
            'operacion' => $operacion,
            'bytes' => strlen($mensajeXml),
        ];

        if (! $envioReal) {
            $this->guardarLote($empresa, $lote, $loteUuid, PeoplesoftExportacion::ESTADO_SIMULADO, null, null);
            $resumen['simulados'] += count($lote);
            $detalle['resultado'] = 'simulado';

            return $detalle;
        }

        $respuesta = $this->client->send($operacion, $mensajeXml);

        if ($respuesta['success']) {
            $this->guardarLote($empresa, $lote, $loteUuid, PeoplesoftExportacion::ESTADO_ENVIADO, null, $respuesta);
            $resumen['enviados'] += count($lote);
            $detalle['resultado'] = 'enviado';

            return $detalle;
        }

        $this->guardarLote($empresa, $lote, $loteUuid, PeoplesoftExportacion::ESTADO_ERROR, $respuesta['error'], $respuesta);
        $resumen['errores'] += count($lote);
        $resumen['ok'] = false;
        $resumen['mensajes'][] = $respuesta['error'] ?? 'Fallo al enviar el lote '.$loteUuid;
        $detalle['resultado'] = 'error';
        $detalle['error'] = $respuesta['error'];

        return $detalle;
    }

    /**
     * @param  array<int,array{marcaje: BiotimeMarcaje, fila: array<string,mixed>}>  $lote
     * @param  array<string,mixed>|null  $respuesta
     */
    private function guardarLote(Empresa $empresa, array $lote, string $loteUuid, string $estado, ?string $motivo, ?array $respuesta): void
    {
        DB::transaction(function () use ($empresa, $lote, $loteUuid, $estado, $motivo, $respuesta) {
            foreach ($lote as $item) {
                $this->registrar($empresa, $item['marcaje'], [
                    'estado' => $estado,
                    'motivo' => $motivo,
                    'lote_uuid' => $loteUuid,
                    'payload' => $item['fila'],
                    'respuesta' => $respuesta ? ['status' => $respuesta['status'] ?? null, 'body' => Str::limit((string) ($respuesta['body'] ?? ''), 2000)] : null,
                    'emp_code' => $item['marcaje']->emp_code,
                    'badge_id' => $item['fila']['BADGE_ID'] ?? null,
                    'emplid' => $item['fila']['EMPLID'] ?? null,
                    'empl_rcd' => $item['fila']['EMPL_RCD'] ?? null,
                    'punch_dttm' => $item['fila']['PUNCH_DTTM'] ?? null,
                    'punch_type' => $item['fila']['PUNCH_TYPE'] ?? null,
                    'tcd_id' => $item['fila']['TCD_ID'] ?? null,
                    'enviado_at' => $estado === PeoplesoftExportacion::ESTADO_ENVIADO ? now() : null,
                ]);
            }
        });
    }

    /**
     * updateOrCreate sobre (empresa_id, biotime_marcaje_id): reejecutar la
     * corrida no duplica filas del outbox.
     *
     * @param  array<string,mixed>  $datos
     */
    private function registrar(Empresa $empresa, BiotimeMarcaje $marcaje, array $datos): void
    {
        PeoplesoftExportacion::updateOrCreate(
            ['empresa_id' => $empresa->id, 'biotime_marcaje_id' => $marcaje->getKey()],
            $datos,
        );
    }

    /**
     * Marcajes de la ventana, en orden cronológico.
     *
     * @return Builder<BiotimeMarcaje>
     */
    private function marcajesDeLaVentana(Empresa $empresa, CarbonImmutable $desde, CarbonImmutable $hasta): Builder
    {
        return BiotimeMarcaje::query()
            ->where('empresa_id', $empresa->id)
            ->whereBetween('punch_time', [$desde, $hasta])
            ->orderBy('id');
    }

    /**
     * @return array<string,PeoplesoftEmpleadoMapeo>
     */
    private function mapeosPorEmpCode(Empresa $empresa): array
    {
        return PeoplesoftEmpleadoMapeo::query()
            ->where('empresa_id', $empresa->id)
            ->get()
            ->keyBy('emp_code')
            ->all();
    }
}
