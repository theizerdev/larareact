<?php

namespace App\Services;

use App\Jobs\EnviarEmpleadoBioTime;
use App\Models\BiotimeCargo;
use App\Models\BiotimeDepartamento;
use App\Models\BiotimeEmpleado;
use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\Empresa;
use Illuminate\Support\Facades\Log;

/**
 * Lleva a BioTime los cambios hechos en Organización / Colaboradores: el
 * sentido contrario de BioTimeEmpleadoProvisioner.
 *
 * - Colaborador sin vínculo: si su número (documento_identidad) ya existe en
 *   BioTime se vincula; si no, se da de alta con el área configurada en la
 *   empresa (el área decide a qué relojes llega).
 * - Colaborador vinculado: se mandan sólo los campos que difieren del espejo.
 *   Un campo vacío aquí nunca borra el dato que BioTime sí tiene.
 * - El emp_code no se cambia después del alta: es el ID con el que la persona
 *   está enrolada en los relojes.
 * - No borra ni da de baja en BioTime, y no envía fotos (la API documentada
 *   no las acepta; ver BioTimeFotoService).
 *
 * Tras cada escritura el espejo se refresca con lo que quedó en BioTime, así
 * el siguiente sync no lo toma como un cambio hecho en el reloj.
 */
class BioTimeEmpleadoPusher
{
    /** Columnas de empleados que viajan a BioTime. */
    public const CAMPOS = [
        'nombres', 'apellidos', 'documento_identidad', 'tarjeta_acceso_1', 'telefono',
        'correo', 'genero', 'fecha_nacimiento', 'fecha_ingreso', 'departamento_id', 'cargo_id',
    ];

    /** Lo que el alta automática pone cuando BioTime no trae nombre: no se devuelve al reloj. */
    private const VACIOS = ['N/A'];

    private static int $silencio = 0;

    /**
     * Ejecuta $fn sin programar envíos: lo que escribe el sync de BioTime ya
     * viene de BioTime y devolverlo sería un PATCH inútil por persona.
     *
     * @template T
     *
     * @param  callable(): T  $fn
     * @return T
     */
    public static function sinEnviar(callable $fn): mixed
    {
        self::$silencio++;

        try {
            return $fn();
        } finally {
            self::$silencio--;
        }
    }

    public static function habilitado(?Empresa $empresa): bool
    {
        return $empresa !== null
            && $empresa->biotime_active
            && $empresa->biotime_push
            && (new BioTimeService($empresa))->isConfigured();
    }

    /**
     * Lo llama Empleado al crearse o editarse: encola el envío si cambió algo
     * que BioTime conoce. No se usa wasRecentlyCreated: sigue en true en las
     * ediciones posteriores de la misma instancia.
     */
    public static function programar(Empleado $empleado, bool $nuevo = false): void
    {
        if (self::$silencio > 0) {
            return;
        }

        if (! $nuevo && ! $empleado->wasChanged(self::CAMPOS)) {
            return;
        }

        if (! self::habilitado(Empresa::find($empleado->empresa_id))) {
            return;
        }

        EnviarEmpleadoBioTime::dispatch($empleado->id)->afterCommit();
    }

    /**
     * @return array{ok: bool, accion: string, mensaje: string, reintentar: bool}
     */
    public function enviar(Empleado $empleado, bool $dryRun = false, ?BioTimeService $cliente = null): array
    {
        $empresa = Empresa::find($empleado->empresa_id);

        if (! self::habilitado($empresa)) {
            return $this->resultado(false, 'omitido', 'El envío a BioTime no está activo en esta empresa.');
        }

        $cliente ??= new BioTimeService($empresa);
        $sync = new BioTimeSyncService($cliente);

        $bio = BiotimeEmpleado::query()
            ->where('empresa_id', $empresa->id)
            ->where('empleado_id', $empleado->id)
            ->first();

        if ($bio === null) {
            $codigo = trim((string) $empleado->documento_identidad);

            if (! preg_match((string) config('biotime.emp_code_pattern'), $codigo)) {
                return $this->fallo($empleado, $dryRun, 'omitido', "El número de empleado «{$codigo}» no lo acepta el reloj: deben ser sólo dígitos (".config('biotime.emp_code_pattern').').');
            }

            // Ya puede existir en BioTime: alta hecha a mano allá o un sync que aún no corre.
            $existente = $cliente->findEmployeeByCode($codigo);
            if (! $existente['success']) {
                return $this->fallo($empleado, $dryRun, 'error', $existente['error'] ?? 'No se pudo consultar BioTime.', $existente['status'] === null);
            }

            if ($existente['data'] === null) {
                return $this->crear($empleado, $empresa, $cliente, $sync, $codigo, $dryRun);
            }

            $espejo = BiotimeEmpleado::query()->where('empresa_id', $empresa->id)->where('emp_code', $codigo)->first();
            if ($espejo?->empleado_id && (int) $espejo->empleado_id !== (int) $empleado->id) {
                return $this->fallo($empleado, $dryRun, 'conflicto', "El número {$codigo} ya está vinculado en BioTime a otro colaborador.");
            }

            if ($dryRun) {
                return $this->resultado(true, 'vincular', "Ya existe en BioTime con el número {$codigo}; se vincularía y se actualizaría.");
            }

            $bio = $sync->espejarEmpleado($empresa, $existente['data'], ['empleado_id' => $empleado->id, 'link_status' => 'auto']);
        }

        return $this->actualizar($empleado, $empresa, $cliente, $sync, $bio, $dryRun);
    }

    private function crear(Empleado $empleado, Empresa $empresa, BioTimeService $cliente, BioTimeSyncService $sync, string $codigo, bool $dryRun): array
    {
        if (! $empresa->biotime_push_area_id) {
            return $this->fallo($empleado, $dryRun, 'omitido', 'Falta elegir en Integraciones › Reloj checador el área de BioTime para los colaboradores nuevos.');
        }

        $depto = $this->departamento($empleado, $empresa) ?? $this->departamentoPorDefecto($empresa);
        if ($depto === null) {
            return $this->fallo($empleado, $dryRun, 'omitido', 'BioTime no tiene departamentos sincronizados; corre el sync de catálogos.');
        }

        $payload = array_filter($this->deseado($empleado), fn ($v) => $v !== null) + [
            'emp_code' => $codigo,
            'department' => (int) $depto->biotime_id,
            'area' => [(int) $empresa->biotime_push_area_id],
        ];

        if ($cargo = $this->cargo($empleado, $empresa)) {
            $payload['position'] = (int) $cargo->biotime_id;
        }

        if ($dryRun) {
            return $this->resultado(true, 'crear', "Se daría de alta con el número {$codigo} en el departamento {$depto->dept_name}.");
        }

        $r = $cliente->createEmployee($payload);
        if (! $r['success']) {
            return $this->fallo($empleado, false, 'error', $r['error'] ?? 'BioTime rechazó el alta.', $r['status'] === null);
        }

        $this->refrescarEspejo($empresa, $cliente, $sync, $codigo, $r['data'], ['empleado_id' => $empleado->id, 'link_status' => 'auto']);

        return $this->exito($empleado, 'creado', "Dado de alta en BioTime con el número {$codigo}.");
    }

    private function actualizar(Empleado $empleado, Empresa $empresa, BioTimeService $cliente, BioTimeSyncService $sync, BiotimeEmpleado $bio, bool $dryRun): array
    {
        $actual = [
            'first_name' => $bio->first_name,
            'last_name' => $bio->last_name,
            'card_no' => $bio->card_no,
            'mobile' => $bio->mobile,
            'email' => $bio->email,
            'gender' => $bio->gender,
            'birthday' => $bio->birthday?->format('Y-m-d'),
            'hire_date' => $bio->hire_date?->format('Y-m-d'),
        ];

        $cambios = [];
        foreach ($this->deseado($empleado) as $campo => $valor) {
            if ($valor !== null && (string) $valor !== (string) ($actual[$campo] ?? '')) {
                $cambios[$campo] = $valor;
            }
        }

        $depto = $this->departamento($empleado, $empresa);
        if ($depto !== null && (string) $depto->dept_code !== (string) $bio->dept_code) {
            $cambios['department'] = (int) $depto->biotime_id;
        }

        $cargo = $this->cargo($empleado, $empresa);
        if ($cargo !== null && (string) $cargo->position_code !== (string) $bio->position_code) {
            $cambios['position'] = (int) $cargo->biotime_id;
        }

        if ($cambios === []) {
            return $dryRun
                ? $this->resultado(true, 'sin_cambios', 'BioTime ya tiene estos datos.')
                : $this->exito($empleado, 'sin_cambios', 'BioTime ya tiene estos datos.');
        }

        if ($dryRun) {
            return $this->resultado(true, 'actualizar', 'Se actualizaría: '.implode(', ', array_keys($cambios)).'.');
        }

        $r = $cliente->updateEmployee((string) $bio->biotime_id, $cambios);
        if (! $r['success']) {
            return $this->fallo($empleado, false, 'error', $r['error'] ?? 'BioTime rechazó el cambio.', $r['status'] === null);
        }

        $this->refrescarEspejo($empresa, $cliente, $sync, (string) $bio->emp_code, $r['data']);

        return $this->exito($empleado, 'actualizado', 'Actualizado en BioTime: '.implode(', ', array_keys($cambios)).'.');
    }

    /**
     * Valores que BioTime debería tener según el colaborador; null = no
     * mandar (vacío o no válido para BioTime).
     *
     * @return array<string, string|null>
     */
    private function deseado(Empleado $empleado): array
    {
        $correo = trim((string) $empleado->correo);
        $tarjeta = $this->texto($empleado->tarjeta_acceso_1);

        return [
            'first_name' => $this->texto($empleado->nombres),
            'last_name' => $this->texto($empleado->apellidos),
            // La columna nace en '0' = sin tarjeta.
            'card_no' => $tarjeta !== null && trim($tarjeta, '0') !== '' ? $tarjeta : null,
            'mobile' => $this->texto($empleado->telefono),
            'email' => filter_var($correo, FILTER_VALIDATE_EMAIL) ? $correo : null,
            'gender' => in_array($empleado->genero, ['M', 'F'], true) ? $empleado->genero : null,
            'birthday' => $empleado->fecha_nacimiento?->format('Y-m-d'),
            'hire_date' => $empleado->fecha_ingreso?->format('Y-m-d'),
        ];
    }

    private function texto(mixed $valor): ?string
    {
        $valor = trim((string) $valor);

        return $valor === '' || in_array($valor, self::VACIOS, true) ? null : $valor;
    }

    /** Departamento de BioTime con el mismo nombre que el del colaborador. */
    private function departamento(Empleado $empleado, Empresa $empresa): ?BiotimeDepartamento
    {
        $nombre = $empleado->departamento_id ? Departamento::withoutTenant()->whereKey($empleado->departamento_id)->value('nombre') : null;

        return $this->porNombre(BiotimeDepartamento::query()->where('empresa_id', $empresa->id)->get(), 'dept_name', $nombre);
    }

    /** El departamento base de BioTime (código 1) o, si no existe, el primero. */
    private function departamentoPorDefecto(Empresa $empresa): ?BiotimeDepartamento
    {
        return BiotimeDepartamento::query()->where('empresa_id', $empresa->id)->where('dept_code', '1')->first()
            ?? BiotimeDepartamento::query()->where('empresa_id', $empresa->id)->orderBy('biotime_id')->first();
    }

    private function cargo(Empleado $empleado, Empresa $empresa): ?BiotimeCargo
    {
        $nombre = $empleado->cargo_id ? Cargo::withoutTenant()->whereKey($empleado->cargo_id)->value('nombre') : null;

        return $this->porNombre(BiotimeCargo::query()->where('empresa_id', $empresa->id)->get(), 'position_name', $nombre);
    }

    /** Compara en PHP: LOWER de SQLite no sabe de acentos. */
    private function porNombre($filas, string $campo, ?string $nombre): mixed
    {
        if (blank($nombre)) {
            return null;
        }

        $buscado = mb_strtolower(trim($nombre));

        return $filas->first(fn ($f) => mb_strtolower(trim((string) $f->{$campo})) === $buscado);
    }

    /**
     * Vuelve a leer al empleado: la respuesta del PATCH trae department como
     * id suelto y no como objeto, y el espejo guarda el código.
     */
    private function refrescarEspejo(Empresa $empresa, BioTimeService $cliente, BioTimeSyncService $sync, string $codigo, mixed $respuesta, array $extra = []): void
    {
        $fila = $cliente->findEmployeeByCode($codigo);
        $datos = $fila['success'] && $fila['data'] ? $fila['data'] : (is_array($respuesta) && isset($respuesta['id']) ? $respuesta : null);

        if ($datos !== null) {
            $sync->espejarEmpleado($empresa, $datos, $extra);
        }
    }

    private function exito(Empleado $empleado, string $accion, string $mensaje): array
    {
        $empleado->forceFill(['biotime_pushed_at' => now(), 'biotime_push_error' => null])->saveQuietly();

        if ($accion !== 'sin_cambios') {
            Log::channel('biotime')->info("BioTime envío de colaborador: {$mensaje}", ['empleado_id' => $empleado->id, 'empresa_id' => $empleado->empresa_id]);
        }

        return $this->resultado(true, $accion, $mensaje);
    }

    private function fallo(Empleado $empleado, bool $dryRun, string $accion, string $mensaje, bool $reintentar = false): array
    {
        if (! $dryRun) {
            $empleado->forceFill(['biotime_push_error' => $mensaje])->saveQuietly();
            Log::channel('biotime')->warning("BioTime envío de colaborador no aplicado: {$mensaje}", ['empleado_id' => $empleado->id, 'empresa_id' => $empleado->empresa_id]);
        }

        return $this->resultado(false, $accion, $mensaje, $reintentar);
    }

    /** @return array{ok: bool, accion: string, mensaje: string, reintentar: bool} */
    private function resultado(bool $ok, string $accion, string $mensaje, bool $reintentar = false): array
    {
        return ['ok' => $ok, 'accion' => $accion, 'mensaje' => $mensaje, 'reintentar' => $reintentar];
    }
}
