<?php

namespace App\Console\Commands;

use App\Models\AsistenciaMarcaje;
use App\Models\BiotimeDispositivo;
use App\Models\BiotimeEmpleado;
use App\Models\BiotimeMarcaje;
use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\TurnoLaboral;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Datos demo del reloj checador para la instancia de Smurfit Westrock.
 *
 * Arma lo mínimo para enseñar el flujo completo sin el reloj físico: dos
 * jornadas, colaboradores ficticios en Organización, el mismo padrón en el
 * espejo de BioTime (vinculado 1 a 1 por número de empleado), un reloj demo
 * y 50 marcajes repartidos en los últimos días hábiles. Cada marcaje se
 * guarda en el espejo de BioTime y en la bitácora de asistencia.
 *
 * Todo lo que crea queda marcado (motivo_registro / sn / raw.demo) para que
 * `--limpiar` lo quite sin tocar datos reales. Nombres, teléfonos y correos
 * son inventados; los correos usan el dominio reservado .invalid.
 */
class SmurfitDemo extends Command
{
    protected $signature = 'smurfit:demo
        {--empresa= : ID de la empresa (por defecto la que se llama Smurfit…)}
        {--marcajes=50 : Cuántos marcajes generar}
        {--limpiar : Borra los datos demo en vez de crearlos}';

    protected $description = 'Carga (o borra) jornadas, colaboradores, reloj y marcajes demo del reloj checador';

    public const MARCA = 'Datos demo Smurfit';

    public const DISPOSITIVO_SN = 'DEMO-ZK-0001';

    /** Rango de ids de BioTime reservado al demo, lejos de los reales. */
    private const BIOTIME_ID_BASE = 900_000_000;

    /** [nombres, apellidos, género, departamento, cargo, jornada] — todos ficticios. */
    private const COLABORADORES = [
        ['Mariana', 'Ochoa Villaseñor', 'F', 'Producción', 'Operador de corrugadora', 'diurna'],
        ['Héctor', 'Lozano Ibarra', 'M', 'Producción', 'Operador de corrugadora', 'diurna'],
        ['Rosa Elena', 'Cárdenas Mejía', 'F', 'Producción', 'Supervisor de turno', 'diurna'],
        ['Iván', 'Saldaña Rueda', 'M', 'Conversión', 'Operador de troqueladora', 'diurna'],
        ['Claudia', 'Navarro Treviño', 'F', 'Conversión', 'Operador de impresora flexográfica', 'diurna'],
        ['Jorge Luis', 'Bautista Amaya', 'M', 'Almacén', 'Montacarguista', 'diurna'],
        ['Fernanda', 'Rangel Quiroz', 'F', 'Calidad', 'Inspector de calidad', 'diurna'],
        ['Omar', 'Esquivel Durán', 'M', 'Mantenimiento', 'Técnico electromecánico', 'nocturna'],
        ['Diana', 'Peralta Solís', 'F', 'Producción', 'Operador de corrugadora', 'nocturna'],
        ['Raúl', 'Mendoza Arriaga', 'M', 'Almacén', 'Montacarguista', 'nocturna'],
        ['Karla', 'Villalobos Fuentes', 'F', 'Conversión', 'Operador de troqueladora', 'nocturna'],
        ['Sergio', 'Camacho Leyva', 'M', 'Mantenimiento', 'Técnico electromecánico', 'nocturna'],
    ];

    /** punch_state de BioTime => tipo_marcaje de la bitácora. */
    private const TIPOS = [
        '0' => 'entrada',
        '2' => 'salida_comida',
        '3' => 'entrada_comida',
        '1' => 'salida',
    ];

    public function handle(): int
    {
        $empresa = $this->option('empresa')
            ? Empresa::find($this->option('empresa'))
            : Empresa::where('razon_social', 'like', 'Smurfit%')->orderBy('id')->first();

        if (! $empresa) {
            $this->error('No encontré la empresa de Smurfit. Pásala con --empresa=<id>.');

            return self::FAILURE;
        }

        if ($this->option('limpiar')) {
            $this->limpiar($empresa);

            return self::SUCCESS;
        }

        $sucursal = Sucursal::where('empresa_id', $empresa->id)->orderBy('id')->first();
        $autor = User::withoutGlobalScopes()->where('username', SmurfitAdmin::USERNAME)->first()
            ?? User::withoutGlobalScopes()->where('empresa_id', $empresa->id)->orderBy('id')->first();

        if (! $sucursal || ! $autor) {
            $this->error('La empresa necesita al menos una sucursal y un usuario (corre antes smurfit:admin).');

            return self::FAILURE;
        }

        $total = max(1, (int) $this->option('marcajes'));

        DB::transaction(function () use ($empresa, $sucursal, $autor, $total) {
            $turnos = $this->jornadas($empresa, $sucursal);
            $empleados = $this->colaboradores($empresa, $sucursal, $autor, $turnos);
            $dispositivo = $this->reloj($empresa, count($empleados));
            $bioEmpleados = $this->padronBioTime($empresa, $empleados);
            $creados = $this->marcajes($empresa, $sucursal, $dispositivo, $empleados, $bioEmpleados, $total);

            $this->info('Jornadas: '.implode(', ', array_map(fn ($t) => $t->nombre, $turnos)));
            $this->info('Colaboradores demo: '.count($empleados).' (mismo padrón en BioTime, vinculados 1 a 1).');
            $this->info("Reloj demo: {$dispositivo->alias} ({$dispositivo->sn}).");
            $this->info("Marcajes: {$creados} en BioTime y {$creados} en la bitácora de asistencia.");
        });

        return self::SUCCESS;
    }

    /** @return array{diurna: TurnoLaboral, nocturna: TurnoLaboral} */
    private function jornadas(Empresa $empresa, Sucursal $sucursal): array
    {
        $base = ['empresa_id' => $empresa->id, 'sucursal_id' => $sucursal->id, 'status' => true];

        return [
            'diurna' => TurnoLaboral::withoutGlobalScopes()->updateOrCreate(
                ['empresa_id' => $empresa->id, 'nombre' => 'Diurna lunes a viernes'],
                $base + [
                    'tipo_jornada' => 'diurna',
                    'hora_entrada' => '08:00:00',
                    'hora_salida' => '17:00:00',
                    'horas_diarias_ley' => 8.00,
                    'minutos_descanso' => 60,
                    'descanso_pagado' => false,
                    'dias_laborables' => [1, 2, 3, 4, 5],
                ],
            ),
            'nocturna' => TurnoLaboral::withoutGlobalScopes()->updateOrCreate(
                ['empresa_id' => $empresa->id, 'nombre' => 'Nocturna lunes a sábado'],
                $base + [
                    'tipo_jornada' => 'nocturna',
                    'hora_entrada' => '22:00:00',
                    'hora_salida' => '05:30:00',
                    'horas_diarias_ley' => 7.00,
                    'minutos_descanso' => 30,
                    'descanso_pagado' => true,
                    'dias_laborables' => [1, 2, 3, 4, 5, 6],
                ],
            ),
        ];
    }

    /** @return list<Empleado> */
    private function colaboradores(Empresa $empresa, Sucursal $sucursal, User $autor, array $turnos): array
    {
        $empleados = [];

        foreach (self::COLABORADORES as $i => [$nombres, $apellidos, $genero, $depto, $cargo, $jornada]) {
            $departamento = Departamento::withoutGlobalScopes()->firstOrCreate(
                ['empresa_id' => $empresa->id, 'nombre' => $depto],
                ['sucursal_id' => $sucursal->id, 'user_id' => $autor->id, 'status' => 1],
            );
            $puesto = Cargo::withoutGlobalScopes()->firstOrCreate(
                ['empresa_id' => $empresa->id, 'departamento_id' => $departamento->id, 'nombre' => $cargo],
                ['sucursal_id' => $sucursal->id, 'user_id' => $autor->id, 'status' => 1],
            );

            // Número de empleado de 6 dígitos (layout de alta), en la serie 9xxxxx.
            $numero = (string) (900001 + $i);

            $existente = Empleado::withoutGlobalScopes()->where('documento_identidad', $numero)->first();
            if ($existente && $existente->motivo_registro !== self::MARCA) {
                throw new \RuntimeException("El número {$numero} ya es de un colaborador real (#{$existente->id}); no lo sobrescribo.");
            }

            $empleados[] = Empleado::withoutGlobalScopes()->updateOrCreate(
                ['documento_identidad' => $numero],
                [
                    'nombres' => $nombres,
                    'apellidos' => $apellidos,
                    'genero' => $genero,
                    'correo' => 'colaborador'.$numero.'@demo.invalid',
                    'telefono' => '33'.str_pad((string) (10000000 + $i * 7919), 8, '0', STR_PAD_LEFT),
                    'departamento_id' => $departamento->id,
                    'cargo_id' => $puesto->id,
                    'turno_laboral_id' => $turnos[$jornada]->id,
                    'empresa_id' => $empresa->id,
                    'sucursal_id' => $sucursal->id,
                    'motivo_registro' => self::MARCA,
                    'status' => true,
                ],
            );
        }

        return $empleados;
    }

    private function reloj(Empresa $empresa, int $usuarios): BiotimeDispositivo
    {
        return BiotimeDispositivo::updateOrCreate(
            ['empresa_id' => $empresa->id, 'biotime_id' => self::BIOTIME_ID_BASE + 1],
            [
                'sn' => self::DISPOSITIVO_SN,
                'alias' => 'Reloj demo — Planta Guadalajara',
                'ip_address' => null,
                'area_name' => 'Planta Guadalajara',
                'state' => 1,
                'last_activity' => now(),
                'fw_ver' => 'ZKTeco (demo)',
                'user_count' => $usuarios,
                'face_count' => $usuarios,
                'fp_count' => 0,
                'palm_count' => 0,
                'transaction_count' => (int) $this->option('marcajes'),
                'raw' => ['demo' => true],
            ],
        );
    }

    /**
     * El mismo padrón de Organización / Colaboradores, del lado de BioTime:
     * emp_code = número de empleado, igual que resolveLinks() los empareja.
     *
     * @param  list<Empleado>  $empleados
     * @return array<int, BiotimeEmpleado> por empleado_id
     */
    private function padronBioTime(Empresa $empresa, array $empleados): array
    {
        $padron = [];

        foreach ($empleados as $i => $empleado) {
            $padron[$empleado->id] = BiotimeEmpleado::updateOrCreate(
                ['empresa_id' => $empresa->id, 'emp_code' => $empleado->documento_identidad],
                [
                    'biotime_id' => self::BIOTIME_ID_BASE + 100 + $i,
                    'first_name' => $empleado->nombres,
                    'last_name' => $empleado->apellidos,
                    'gender' => $empleado->genero,
                    'email' => $empleado->correo,
                    'mobile' => $empleado->telefono,
                    'area_names' => ['Planta Guadalajara'],
                    'enable_att' => true,
                    'empleado_id' => $empleado->id,
                    'link_status' => 'auto',
                    'raw' => ['demo' => true],
                ],
            );
        }

        return $padron;
    }

    /**
     * Reparte los marcajes en los días hábiles más recientes, del más nuevo
     * hacia atrás: jornada diurna con comida (4 checadas) y nocturna con
     * entrada/salida (2 checadas, la salida cae al día siguiente). Incluye
     * algunos retardos para que la bitácora muestre incidencias.
     *
     * @param  list<Empleado>  $empleados
     * @param  array<int, BiotimeEmpleado>  $padron
     */
    private function marcajes(Empresa $empresa, Sucursal $sucursal, BiotimeDispositivo $reloj, array $empleados, array $padron, int $total): int
    {
        $this->borrarMarcajes($empresa);

        mt_srand(2026); // mismos minutos en cada corrida

        $punches = [];
        $dia = CarbonImmutable::today()->subDay();

        while (count($punches) < $total) {
            if ($dia->isSunday()) {
                $dia = $dia->subDay();

                continue;
            }

            foreach ($empleados as $empleado) {
                $diurna = $empleado->turno_laboral_id === $empleados[0]->turno_laboral_id;

                if ($diurna && $dia->isSaturday()) {
                    continue;
                }

                $retardo = mt_rand(1, 10) === 1 ? mt_rand(11, 25) : 0;

                if ($diurna) {
                    $entrada = $dia->setTime(7, 50)->addMinutes(mt_rand(0, 12) + $retardo);
                    $comida = $dia->setTime(13, 0)->addMinutes(mt_rand(0, 20));
                    $dayPunches = [
                        ['0', $entrada],
                        ['2', $comida],
                        ['3', $comida->addMinutes(mt_rand(50, 62))],
                        ['1', $dia->setTime(17, 0)->addMinutes(mt_rand(0, 15))],
                    ];
                } else {
                    $dayPunches = [
                        ['0', $dia->setTime(21, 50)->addMinutes(mt_rand(0, 12) + $retardo)],
                        ['1', $dia->addDay()->setTime(5, 30)->addMinutes(mt_rand(0, 10))],
                    ];
                }

                foreach ($dayPunches as [$estado, $hora]) {
                    if ($hora->isFuture()) {
                        continue;
                    }
                    $punches[] = [$empleado, $estado, $hora];
                    if (count($punches) >= $total) {
                        break 3;
                    }
                }
            }

            $dia = $dia->subDay();
        }

        foreach ($punches as $k => [$empleado, $estado, $hora]) {
            BiotimeMarcaje::create([
                'empresa_id' => $empresa->id,
                'biotime_id' => self::BIOTIME_ID_BASE + 1000 + $k,
                'emp_code' => $empleado->documento_identidad,
                'biotime_empleado_id' => $padron[$empleado->id]->id,
                'empleado_id' => $empleado->id,
                'dispositivo_sn' => $reloj->sn,
                'dispositivo_alias' => $reloj->alias,
                'area_alias' => $reloj->area_name,
                'punch_time' => $hora,
                'punch_state' => $estado,
                'punch_state_label' => BiotimeMarcaje::labelPunchState($estado),
                'verify_type' => 15,
                'verify_type_label' => BiotimeMarcaje::labelVerifyType(15),
                'upload_time' => $hora->addSeconds(mt_rand(5, 90)),
                'raw' => ['demo' => true],
            ]);

            AsistenciaMarcaje::withoutGlobalScopes()->create([
                'empresa_id' => $empresa->id,
                'sucursal_id' => $sucursal->id,
                'empleado_id' => $empleado->id,
                'tipo_marcaje' => self::TIPOS[$estado],
                'fecha_hora' => $hora,
                'origen' => 'biotime',
                'dispositivo_id' => $reloj->sn,
                'observaciones' => self::MARCA,
            ]);
        }

        return count($punches);
    }

    private function borrarMarcajes(Empresa $empresa): void
    {
        BiotimeMarcaje::where('empresa_id', $empresa->id)->where('dispositivo_sn', self::DISPOSITIVO_SN)->delete();
        AsistenciaMarcaje::withoutGlobalScopes()->where('empresa_id', $empresa->id)->where('observaciones', self::MARCA)->delete();
    }

    private function limpiar(Empresa $empresa): void
    {
        DB::transaction(function () use ($empresa) {
            $this->borrarMarcajes($empresa);

            $ids = Empleado::withoutGlobalScopes()
                ->where('empresa_id', $empresa->id)
                ->where('motivo_registro', self::MARCA)
                ->pluck('id');

            $bio = BiotimeEmpleado::where('empresa_id', $empresa->id)->whereIn('empleado_id', $ids)->delete();
            $dispositivos = BiotimeDispositivo::where('empresa_id', $empresa->id)->where('sn', self::DISPOSITIVO_SN)->delete();
            $empleados = Empleado::withoutGlobalScopes()->whereIn('id', $ids)->delete();

            // Jornadas, departamentos y cargos se quedan: pueden ya tener
            // colaboradores reales asignados.
            $this->info("Borrados: {$empleados} colaboradores, {$bio} empleados BioTime, {$dispositivos} reloj y sus marcajes demo.");
        });
    }
}
