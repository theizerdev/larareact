<?php

namespace App\Services;

use App\Models\BiotimeArea;
use App\Models\BiotimeCalendario;
use App\Models\BiotimeCargo;
use App\Models\BiotimeDepartamento;
use App\Models\BiotimeDispositivo;
use App\Models\BiotimeEmpleado;
use App\Models\BiotimeHorario;
use App\Models\BiotimeMarcaje;
use App\Models\BiotimePermiso;
use App\Models\BiotimeTurno;
use App\Models\Empleado;
use App\Models\Empresa;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Vuelca los datos de BioTime a las tablas espejo `biotime_*` de Hoshō.
 *
 * Reglas de oro (integración de SOLO LECTURA para producción):
 *  - Todas las escrituras van con updateOrCreate sobre la clave única
 *    (empresa_id, biotime_id) => reejecutar el sync NO duplica nada.
 *  - Los marcajes se piden SIEMPRE con ventana start_time/end_time acotada.
 *  - No se toca asistencia_marcajes ni el cálculo LFT ni WhatsApp.
 *  - El método público sync() nunca propaga excepciones: captura, registra y
 *    devuelve un resumen.
 */
class BioTimeSyncService
{
    /** Partes válidas del sync, en orden de dependencia. */
    public const PARTS = ['terminals', 'catalogs', 'employees', 'transactions', 'attendance'];

    public function __construct(private readonly BioTimeService $client)
    {
    }

    public static function for(Empresa $empresa): self
    {
        return new self(new BioTimeService($empresa));
    }

    /**
     * Ejecuta el sync completo o parcial para una empresa.
     *
     * @param  array<int,string>  $only   Subconjunto de self::PARTS ([] = todas).
     * @param  bool   $full   true = backfill desde config('biotime.backfill_from').
     * @param  string|null  $since  Fecha ISO opcional que fuerza el inicio de la ventana de marcajes.
     * @return array{ok: bool, empresa_id: int, parts: array<string,mixed>, errors: array<int,string>}
     */
    public function sync(Empresa $empresa, array $only = [], bool $full = false, ?string $since = null): array
    {
        $parts = $only ?: self::PARTS;
        $summary = ['ok' => true, 'empresa_id' => $empresa->id, 'parts' => [], 'errors' => []];

        if (! $this->client->isConfigured()) {
            $summary['ok'] = false;
            $summary['errors'][] = 'BioTime no está configurado para esta empresa (URL / usuario / contraseña).';

            return $summary;
        }

        Log::channel('biotime')->info('BioTime sync inicio', [
            'empresa_id' => $empresa->id, 'parts' => $parts, 'full' => $full, 'since' => $since,
        ]);

        foreach ($parts as $part) {
            try {
                $summary['parts'][$part] = match ($part) {
                    'terminals' => $this->syncTerminals($empresa),
                    'catalogs' => $this->syncCatalogs($empresa),
                    'employees' => $this->syncEmployees($empresa),
                    'transactions' => $this->syncTransactions($empresa, $full, $since),
                    'attendance' => $this->syncAttendance($empresa),
                    default => ['skipped' => "parte desconocida: {$part}"],
                };
            } catch (\Throwable $e) {
                $summary['ok'] = false;
                $summary['errors'][] = "[{$part}] ".$e->getMessage();
                Log::channel('biotime')->error("BioTime sync error en {$part}: ".$e->getMessage(), [
                    'empresa_id' => $empresa->id,
                    'exception' => $e::class,
                ]);
            }
        }

        Log::channel('biotime')->info('BioTime sync fin', $summary);

        return $summary;
    }

    /* ------------------------------------------------------------------ */
    /*  Relojes checadores                                                 */
    /* ------------------------------------------------------------------ */

    public function syncTerminals(Empresa $empresa): array
    {
        $res = $this->client->listTerminals();
        if (! $res['success']) {
            throw new \RuntimeException($res['error'] ?? 'No se pudieron leer los relojes.');
        }

        $upserts = 0;
        foreach ($res['data'] as $t) {
            $area = $t['area'] ?? [];
            BiotimeDispositivo::updateOrCreate(
                ['empresa_id' => $empresa->id, 'biotime_id' => $t['id']],
                [
                    'sn' => $t['sn'] ?? null,
                    'alias' => $t['alias'] ?? ($t['terminal_name'] ?? null),
                    'ip_address' => $t['ip_address'] ?? null,
                    'area_name' => is_array($area) ? ($area['area_name'] ?? null) : ($t['area_name'] ?? null),
                    'state' => $t['state'] ?? null,
                    'last_activity' => $this->toDate($t['last_activity'] ?? null),
                    'fw_ver' => $t['fw_ver'] ?? null,
                    'user_count' => $t['user_count'] ?? null,
                    'fp_count' => $t['fp_count'] ?? null,
                    'face_count' => $t['face_count'] ?? null,
                    'palm_count' => $t['palm_count'] ?? null,
                    'transaction_count' => $t['transaction_count'] ?? null,
                    'raw' => $t,
                ],
            );
            $upserts++;
        }

        return ['fetched' => count($res['data']), 'upserted' => $upserts];
    }

    /* ------------------------------------------------------------------ */
    /*  Catálogos: departamentos / áreas / cargos                          */
    /* ------------------------------------------------------------------ */

    public function syncCatalogs(Empresa $empresa): array
    {
        $out = [];

        $dep = $this->client->listDepartments();
        if (! $dep['success']) {
            throw new \RuntimeException($dep['error'] ?? 'No se pudieron leer los departamentos.');
        }
        foreach ($dep['data'] as $d) {
            BiotimeDepartamento::updateOrCreate(
                ['empresa_id' => $empresa->id, 'biotime_id' => $d['id']],
                [
                    'dept_code' => $d['dept_code'] ?? null,
                    'dept_name' => $d['dept_name'] ?? null,
                    'parent_dept_code' => $this->code($d['parent_dept'] ?? null, 'dept_code'),
                    'raw' => $d,
                ],
            );
        }
        $out['departamentos'] = count($dep['data']);

        $areas = $this->client->listAreas();
        if (! $areas['success']) {
            throw new \RuntimeException($areas['error'] ?? 'No se pudieron leer las áreas.');
        }
        foreach ($areas['data'] as $a) {
            BiotimeArea::updateOrCreate(
                ['empresa_id' => $empresa->id, 'biotime_id' => $a['id']],
                [
                    'area_code' => $a['area_code'] ?? null,
                    'area_name' => $a['area_name'] ?? null,
                    'parent_area_code' => $this->code($a['parent_area'] ?? null, 'area_code'),
                    'raw' => $a,
                ],
            );
        }
        $out['areas'] = count($areas['data']);

        $pos = $this->client->listPositions();
        if (! $pos['success']) {
            throw new \RuntimeException($pos['error'] ?? 'No se pudieron leer los cargos.');
        }
        foreach ($pos['data'] as $p) {
            BiotimeCargo::updateOrCreate(
                ['empresa_id' => $empresa->id, 'biotime_id' => $p['id']],
                [
                    'position_code' => $p['position_code'] ?? null,
                    'position_name' => $p['position_name'] ?? null,
                    'raw' => $p,
                ],
            );
        }
        $out['cargos'] = count($pos['data']);

        return $out;
    }

    /* ------------------------------------------------------------------ */
    /*  Empleados + vínculo suave                                          */
    /* ------------------------------------------------------------------ */

    public function syncEmployees(Empresa $empresa): array
    {
        $res = $this->client->listEmployees();
        if (! $res['success']) {
            throw new \RuntimeException($res['error'] ?? 'No se pudieron leer los empleados.');
        }

        // Qué columnas cambió BioTime en cada persona: el alta automática sólo
        // pisa en Organización / Colaboradores lo que cambió en el reloj.
        $cambios = [];

        foreach ($res['data'] as $e) {
            $bio = $this->espejarEmpleado($empresa, $e);

            if (! $bio->wasRecentlyCreated && $bio->wasChanged()) {
                $cambios[$bio->id] = array_keys($bio->getChanges());
            }
        }

        $linked = $this->resolveLinks($empresa);
        $resultado = ['fetched' => count($res['data']), 'auto_linked' => $linked];

        if ($empresa->biotime_auto_alta) {
            $alta = app(BioTimeEmpleadoProvisioner::class)->sincronizar($empresa, $cambios);
            $resultado += ['created' => $alta['creados'], 'updated' => $alta['actualizados'], 'accounts' => $alta['cuentas'], 'skipped' => count($alta['omitidos'])];
            foreach ($alta['omitidos'] as $motivo) {
                Log::channel('biotime')->warning("BioTime alta automática omitida: {$motivo}", ['empresa_id' => $empresa->id]);
            }
            foreach ($alta['sin_cuenta'] as $motivo) {
                Log::channel('biotime')->info("BioTime cuenta de usuario no creada: {$motivo}", ['empresa_id' => $empresa->id]);
            }
        }

        return $resultado;
    }

    /**
     * Guarda en el espejo un empleado tal como lo devuelve el listado de
     * BioTime (con department / position como objeto).
     *
     * @param  array<string,mixed>  $e
     */
    public function espejarEmpleado(Empresa $empresa, array $e, array $extra = []): BiotimeEmpleado
    {
        return BiotimeEmpleado::updateOrCreate(
            ['empresa_id' => $empresa->id, 'emp_code' => (string) ($e['emp_code'] ?? $e['id'])],
            $extra + [
                'biotime_id' => $e['id'],
                'first_name' => $e['first_name'] ?? null,
                'last_name' => $e['last_name'] ?? null,
                'nickname' => $e['nickname'] ?? null,
                'card_no' => $e['card_no'] ?? null,
                'dept_code' => $this->code($e['department'] ?? null, 'dept_code'),
                'position_code' => $this->code($e['position'] ?? null, 'position_code'),
                'area_names' => $this->areaNames($e['area'] ?? null),
                'hire_date' => $this->toDate($e['hire_date'] ?? null),
                'gender' => $e['gender'] ?? null,
                'birthday' => $this->toDate($e['birthday'] ?? null),
                'mobile' => $e['mobile'] ?? null,
                'email' => $e['email'] ?? null,
                'national' => $e['national'] ?? null,
                'internal_emp_num' => $e['internal_emp_num'] ?? null,
                'payroll_num' => $e['payroll_num'] ?? null,
                'enable_att' => $e['enable_att'] ?? null,
                'raw' => $e,
            ],
        );
    }

    /**
     * Intenta vincular biotime_empleados sin match con empleados de Hoshō
     * por documento_identidad / curp / codigo_acceso == emp_code / national /
     * card_no (normalizados). Solo enlaza cuando hay UN único candidato.
     */
    public function resolveLinks(Empresa $empresa): int
    {
        $pendientes = BiotimeEmpleado::query()
            ->where('empresa_id', $empresa->id)
            ->where('link_status', 'unmatched')
            ->get();

        if ($pendientes->isEmpty()) {
            return 0;
        }

        $empleados = Empleado::query()
            ->when($empresa->id, fn ($q) => $q->where('empresa_id', $empresa->id))
            ->get(['id', 'documento_identidad', 'curp', 'codigo_acceso', 'tarjeta_acceso_1', 'tarjeta_acceso_2', 'tarjeta_acceso_3']);

        // Índice normalizado valor -> [empleado_id, ...]
        $index = [];
        foreach ($empleados as $emp) {
            foreach (['documento_identidad', 'curp', 'codigo_acceso', 'tarjeta_acceso_1', 'tarjeta_acceso_2', 'tarjeta_acceso_3'] as $campo) {
                $norm = $this->normalizeId($emp->{$campo} ?? null);
                if ($norm !== null) {
                    $index[$norm][] = $emp->id;
                }
            }
        }

        $linked = 0;
        foreach ($pendientes as $bio) {
            $candidatos = [];
            foreach ([$bio->emp_code, $bio->national, $bio->card_no] as $valor) {
                $norm = $this->normalizeId($valor);
                if ($norm !== null && isset($index[$norm])) {
                    $candidatos = array_merge($candidatos, $index[$norm]);
                }
            }
            $candidatos = array_values(array_unique($candidatos));

            if (count($candidatos) === 1) {
                $bio->update(['empleado_id' => $candidatos[0], 'link_status' => 'auto']);
                $linked++;
            }
        }

        return $linked;
    }

    /* ------------------------------------------------------------------ */
    /*  Marcajes (ventana acotada, idempotente)                            */
    /* ------------------------------------------------------------------ */

    public function syncTransactions(Empresa $empresa, bool $full = false, ?string $since = null): array
    {
        $now = CarbonImmutable::now();

        $start = match (true) {
            $since !== null => CarbonImmutable::parse($since),
            $full => CarbonImmutable::parse((string) config('biotime.backfill_from', '2026-01-01')),
            $empresa->biotime_last_sync_at !== null => CarbonImmutable::parse($empresa->biotime_last_sync_at)
                ->subMinutes((int) config('biotime.sync_overlap_minutes', 5)),
            default => CarbonImmutable::parse((string) config('biotime.backfill_from', '2026-01-01')),
        };

        if ($start->greaterThanOrEqualTo($now)) {
            return ['windows' => 0, 'fetched' => 0, 'upserted' => 0, 'from' => $start->toDateTimeString(), 'to' => $now->toDateTimeString()];
        }

        // Mapa emp_code -> biotime_empleado_id / empleado_id para resolver FKs.
        $empMap = BiotimeEmpleado::query()
            ->where('empresa_id', $empresa->id)
            ->get(['id', 'emp_code', 'empleado_id'])
            ->keyBy(fn ($r) => (string) $r->emp_code);

        $windowDays = max(1, (int) config('biotime.window_days', 30));
        $chunk = max(50, (int) config('biotime.db_chunk', 200));

        $windows = 0;
        $fetched = 0;
        $upserted = 0;
        $maxId = (int) ($empresa->biotime_last_transaction_id ?? 0);

        $cursor = $start;
        while ($cursor->lessThan($now)) {
            $windowEnd = $cursor->addDays($windowDays);
            if ($windowEnd->greaterThan($now)) {
                $windowEnd = $now;
            }

            $res = $this->client->listTransactions([
                'start_time' => $cursor->format('Y-m-d H:i:s'),
                'end_time' => $windowEnd->format('Y-m-d H:i:s'),
            ]);

            if (! $res['success']) {
                throw new \RuntimeException($res['error'] ?? 'No se pudieron leer los marcajes.');
            }

            $windows++;
            $rows = $res['data'];
            $fetched += count($rows);

            foreach (array_chunk($rows, $chunk) as $slice) {
                DB::transaction(function () use ($slice, $empresa, $empMap, &$upserted, &$maxId) {
                    foreach ($slice as $m) {
                        $empCode = (string) ($m['emp_code'] ?? '');
                        $link = $empMap->get($empCode);
                        $bioId = (int) ($m['id'] ?? 0);

                        BiotimeMarcaje::updateOrCreate(
                            ['empresa_id' => $empresa->id, 'biotime_id' => $bioId],
                            [
                                'emp_code' => $empCode,
                                'biotime_empleado_id' => $link->id ?? null,
                                'empleado_id' => $link->empleado_id ?? null,
                                'dispositivo_sn' => $m['terminal_sn'] ?? null,
                                'dispositivo_alias' => $m['terminal_alias'] ?? null,
                                'area_alias' => $m['area_alias'] ?? null,
                                'punch_time' => $this->toDate($m['punch_time'] ?? null),
                                'punch_state' => isset($m['punch_state']) ? (string) $m['punch_state'] : null,
                                'punch_state_label' => BiotimeMarcaje::labelPunchState($m['punch_state'] ?? null),
                                'verify_type' => isset($m['verify_type']) ? (int) $m['verify_type'] : null,
                                'verify_type_label' => BiotimeMarcaje::labelVerifyType($m['verify_type'] ?? null),
                                'work_code' => $m['work_code'] ?? null,
                                'latitude' => $this->num($m['latitude'] ?? null),
                                'longitude' => $this->num($m['longitude'] ?? null),
                                'gps_location' => $m['gps_location'] ?? null,
                                'temperature' => $this->num($m['temperature'] ?? null),
                                'is_mask' => isset($m['is_mask']) && $m['is_mask'] !== null ? (int) $m['is_mask'] : null,
                                'source' => isset($m['source']) && $m['source'] !== null ? (int) $m['source'] : null,
                                'upload_time' => $this->toDate($m['upload_time'] ?? null),
                                'raw' => $m,
                            ],
                        );

                        $upserted++;
                        $maxId = max($maxId, $bioId);
                    }
                });
            }

            $cursor = $windowEnd;
        }

        // Avanza la marca de agua sólo si no hubo excepción (llegamos aquí).
        $empresa->forceFill([
            'biotime_last_sync_at' => $now,
            'biotime_last_transaction_id' => $maxId ?: $empresa->biotime_last_transaction_id,
        ])->save();

        return [
            'windows' => $windows,
            'fetched' => $fetched,
            'upserted' => $upserted,
            'from' => $start->toDateTimeString(),
            'to' => $now->toDateTimeString(),
            'max_transaction_id' => $maxId,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  Asistencia: horarios, turnos, calendarios y permisos (/att/api/)   */
    /* ------------------------------------------------------------------ */

    /**
     * Estos cuatro endpoints devuelven siempre el conjunto completo (no hay
     * incremental), así que tras cada lectura exitosa se borran del espejo
     * las filas que ya no existen en BioTime: un turno o calendario eliminado
     * allá no debe seguir apareciendo aquí.
     */
    public function syncAttendance(Empresa $empresa): array
    {
        $out = [];

        $horarios = $this->attRows($this->client->listTimeIntervals(), 'horarios');
        if ($horarios === null) {
            $out['horarios'] = 'no disponible';
        } else {
            foreach ($horarios as $h) {
                BiotimeHorario::updateOrCreate(
                    ['empresa_id' => $empresa->id, 'biotime_id' => (string) $h['id']],
                    [
                        'alias' => $h['alias'] ?? null,
                        'use_mode' => isset($h['use_mode']) ? (string) $h['use_mode'] : null,
                        'in_time' => $h['in_time'] ?? null,
                        'out_time' => $h['out_time'] ?? null,
                        'duration' => $this->int($h['duration'] ?? null),
                        'work_time_duration' => $this->int($h['work_time_duration'] ?? null),
                        'break_time_duration' => $this->int($h['break_time_duration'] ?? null),
                        'cross_day' => (bool) $this->bool($h['cross_day'] ?? false),
                        'in_required' => $this->bool($h['in_required'] ?? null),
                        'out_required' => $this->bool($h['out_required'] ?? null),
                        'raw' => $h,
                    ],
                );
            }
            $out['horarios'] = count($horarios);
            $out['horarios_eliminados'] = $this->prune(BiotimeHorario::class, $empresa, $horarios);
        }

        $turnos = $this->attRows($this->client->listShifts(), 'turnos');
        if ($turnos === null) {
            $out['turnos'] = 'no disponible';
        } else {
            foreach ($turnos as $t) {
                BiotimeTurno::updateOrCreate(
                    ['empresa_id' => $empresa->id, 'biotime_id' => (string) $t['id']],
                    [
                        'alias' => $t['alias'] ?? null,
                        'shift_timetable' => is_array($t['shift_timetable'] ?? null)
                            ? implode(',', $t['shift_timetable'])
                            : ($t['shift_timetable'] ?? null),
                        'cycle_unit' => isset($t['cycle_unit']) ? (string) $t['cycle_unit'] : null,
                        'shift_cycle' => $this->int($t['shift_cycle'] ?? null),
                        'auto_shift' => $this->bool($t['auto_shift'] ?? null),
                        'raw' => $t,
                    ],
                );
            }
            $out['turnos'] = count($turnos);
            $out['turnos_eliminados'] = $this->prune(BiotimeTurno::class, $empresa, $turnos);
        }

        $calendarios = $this->attRows($this->client->listSchedules(), 'calendarios');
        if ($calendarios === null) {
            $out['calendarios'] = 'no disponible';
        } else {
            // En los calendarios `employee` es el id interno de BioTime (no el
            // emp_code) y `shift` el id del turno.
            $empMap = BiotimeEmpleado::query()
                ->where('empresa_id', $empresa->id)
                ->get(['id', 'biotime_id', 'empleado_id'])
                ->keyBy(fn ($r) => (string) $r->biotime_id);
            $turnoMap = BiotimeTurno::query()
                ->where('empresa_id', $empresa->id)
                ->pluck('id', 'biotime_id');

            foreach ($calendarios as $c) {
                $employeeId = $this->code($c['employee'] ?? null, 'id');
                $shiftId = $this->code($c['shift'] ?? null, 'id');
                $link = $employeeId !== null ? $empMap->get($employeeId) : null;

                BiotimeCalendario::updateOrCreate(
                    ['empresa_id' => $empresa->id, 'biotime_id' => (string) $c['id']],
                    [
                        'employee_biotime_id' => $employeeId,
                        'shift_biotime_id' => $shiftId,
                        'biotime_empleado_id' => $link->id ?? null,
                        'empleado_id' => $link->empleado_id ?? null,
                        'biotime_turno_id' => $shiftId !== null ? ($turnoMap[$shiftId] ?? null) : null,
                        'start_date' => $this->toDate($c['start_date'] ?? null),
                        'end_date' => $this->toDate($c['end_date'] ?? null),
                        'raw' => $c,
                    ],
                );
            }
            $out['calendarios'] = count($calendarios);
            $out['calendarios_eliminados'] = $this->prune(BiotimeCalendario::class, $empresa, $calendarios);
        }

        $out += $this->syncLeaves($empresa);

        return $out;
    }

    /** @return array<string,mixed> */
    private function syncLeaves(Empresa $empresa): array
    {
        $total = $this->client->countLeaves();
        if (! $total['success']) {
            if ($total['status'] === 404) {
                return ['permisos' => 'no disponible'];
            }
            throw new \RuntimeException($total['error'] ?? 'No se pudieron leer los permisos.');
        }

        $max = (int) config('biotime.leaves_max', 20000);
        if ($total['count'] > $max) {
            Log::channel('biotime')->warning('BioTime permisos omitidos: el total supera biotime.leaves_max', [
                'empresa_id' => $empresa->id, 'count' => $total['count'], 'max' => $max,
            ]);

            return ['permisos' => "omitido: BioTime reporta {$total['count']} y el tope es {$max} (BIOTIME_LEAVES_MAX)"];
        }

        $permisos = $total['count'] === 0 ? [] : $this->attRows($this->client->listLeaves(), 'permisos');
        if ($permisos === null) {
            return ['permisos' => 'no disponible'];
        }

        $empMap = BiotimeEmpleado::query()
            ->where('empresa_id', $empresa->id)
            ->get(['id', 'emp_code', 'empleado_id'])
            ->keyBy(fn ($r) => (string) $r->emp_code);

        $chunk = max(50, (int) config('biotime.db_chunk', 200));

        foreach (array_chunk($permisos, $chunk) as $slice) {
            DB::transaction(function () use ($slice, $empresa, $empMap) {
                foreach ($slice as $p) {
                    $empCode = isset($p['get_emp_code']) ? (string) $p['get_emp_code'] : ($p['emp_code'] ?? null);
                    $link = $empCode !== null ? $empMap->get($empCode) : null;

                    BiotimePermiso::updateOrCreate(
                        ['empresa_id' => $empresa->id, 'biotime_id' => (string) $p['id']],
                        [
                            'emp_code' => $empCode,
                            'biotime_empleado_id' => $link->id ?? null,
                            'empleado_id' => $link->empleado_id ?? null,
                            'first_name' => $p['get_emp_first_name'] ?? null,
                            'last_name' => $p['get_emp_last_name'] ?? null,
                            'dept_name' => $p['get_emp_dept'] ?? null,
                            'category' => isset($p['category']) ? (string) $p['category'] : null,
                            'start_time' => $this->toDate($p['start_time'] ?? null),
                            'end_time' => $this->toDate($p['end_time'] ?? null),
                            'apply_reason' => $p['apply_reason'] ?? null,
                            'apply_time' => $this->toDate($p['apply_time'] ?? null),
                            'audit_status' => isset($p['audit_status']) ? (string) $p['audit_status'] : null,
                            'audit_reason' => $p['audit_reason'] ?? null,
                            'audit_time' => $this->toDate($p['audit_time'] ?? null),
                            'last_approver' => $p['last_approver'] ?? null,
                            'raw' => $p,
                        ],
                    );
                }
            });
        }

        return [
            'permisos' => count($permisos),
            'permisos_eliminados' => $this->prune(BiotimePermiso::class, $empresa, $permisos),
        ];
    }

    /**
     * Filas de un endpoint /att/api/. Null si este BioTime no lo tiene (404,
     * p. ej. attschedules en BioTime Cloud); cualquier otro error se propaga.
     *
     * @return array<int,array<string,mixed>>|null
     */
    private function attRows(array $res, string $label): ?array
    {
        if ($res['success']) {
            return $res['data'];
        }

        if (($res['status'] ?? null) === 404) {
            return null;
        }

        throw new \RuntimeException($res['error'] ?? "No se pudieron leer los {$label}.");
    }

    /**
     * Borra del espejo las filas de la empresa que ya no vinieron de BioTime.
     *
     * @param  class-string<Model>  $model
     * @param  array<int,array<string,mixed>>  $rows
     */
    private function prune(string $model, Empresa $empresa, array $rows): int
    {
        $vigentes = array_map(fn ($r) => (string) $r['id'], $rows);

        return $model::query()
            ->where('empresa_id', $empresa->id)
            ->when($vigentes !== [], fn ($q) => $q->whereNotIn('biotime_id', $vigentes))
            ->delete();
    }

    private function int(mixed $value): ?int
    {
        return is_numeric($value) ? (int) $value : null;
    }

    /**
     * BioTime manda los sí/no traducidos según el idioma de la instancia
     * ("Yes", "Sí", "No") y en otros campos como 0/1 o true/false.
     */
    private function bool(mixed $value): ?bool
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_bool($value)) {
            return $value;
        }
        if (is_numeric($value)) {
            return (int) $value !== 0;
        }

        return in_array(mb_strtolower(trim((string) $value)), ['yes', 'sí', 'si', 'true'], true);
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    private function toDate(?string $value): ?string
    {
        if ($value === null || $value === '' || str_starts_with($value, '0000')) {
            return null;
        }

        try {
            return CarbonImmutable::parse($value)->toDateTimeString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function num(mixed $value): ?float
    {
        return is_numeric($value) ? (float) $value : null;
    }

    /**
     * BioTime devuelve algunas relaciones como objeto {id,code,name} y otras
     * como id suelto. Extrae el "code" cuando es objeto.
     */
    private function code(mixed $value, string $codeKey): ?string
    {
        if (is_array($value)) {
            return isset($value[$codeKey]) ? (string) $value[$codeKey] : (isset($value['id']) ? (string) $value['id'] : null);
        }

        return $value !== null ? (string) $value : null;
    }

    private function areaNames(mixed $areas): ?array
    {
        if (! is_array($areas)) {
            return null;
        }

        $names = [];
        foreach ($areas as $a) {
            if (is_array($a)) {
                $names[] = $a['area_name'] ?? ($a['area_code'] ?? null);
            } else {
                $names[] = $a;
            }
        }

        return array_values(array_filter($names, fn ($n) => $n !== null && $n !== ''));
    }

    /**
     * Normaliza un identificador para comparar: sin espacios ni signos,
     * mayúsculas, sin ceros a la izquierda. Devuelve null si queda vacío o
     * es un placeholder tipo "0".
     */
    private function normalizeId(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $clean = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) $value) ?? '');
        $clean = ltrim($clean, '0');

        return ($clean === '' || $clean === '0') ? null : $clean;
    }
}
