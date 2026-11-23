<?php

namespace App\Services;

use App\Models\BiotimeDispositivo;
use App\Models\BiotimeEmpleado;
use App\Models\BiotimeMarcaje;
use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * Mantiene Organización / Colaboradores al día con el padrón de BioTime.
 *
 * - Alta: cada persona del reloj sin vínculo se crea (sin turno a propósito:
 *   un turno supuesto inventaría retardos) y se vincula por su emp_code.
 * - Actualización: BioTime manda sobre lo que cambia ALLÁ. Un campo se pisa
 *   sólo cuando BioTime lo cambió en esta corrida; los demás sólo se rellenan
 *   si están vacíos. Así una corrección hecha a mano en el sistema no se pierde
 *   a menos que alguien vuelva a cambiar ese mismo dato en el reloj.
 *
 * - Cuenta: cada colaborador del reloj con correo válido y libre recibe una
 *   cuenta de Usuarios SIN rol (no ve nada hasta que un admin se lo asigne)
 *   y un correo para definir su contraseña. Nadie conoce la inicial.
 *
 * No borra ni desactiva a nadie y no toca fotos (la API no las expone).
 * Quien sólo está en áreas cuyos relojes se eliminaron en Hoshō se deja
 * como está: ni se crea ni se actualiza.
 *
 * El sentido contrario (de Colaboradores hacia BioTime) es BioTimeEmpleadoPusher.
 */
class BioTimeEmpleadoProvisioner
{
    /** Campo de biotime_empleados que alimenta a cada columna de empleados. */
    private const CAMPOS = [
        'nombres' => 'first_name',
        'apellidos' => 'last_name',
        'documento_identidad' => 'emp_code',
        'codigo_acceso' => 'emp_code',
        'tarjeta_acceso_1' => 'card_no',
        'curp' => 'national',
        'telefono' => 'mobile',
        'correo' => 'email',
        'genero' => 'gender',
        'fecha_nacimiento' => 'birthday',
        'fecha_ingreso' => 'hire_date',
        'departamento_id' => 'dept_code',
        'cargo_id' => 'position_code',
    ];

    /** TLD reservados (RFC 2606 / 6761): ningún buzón real vive en ellos. */
    private const DOMINIOS_SIN_CORREO = ['invalid', 'test', 'example', 'localhost', 'local'];

    /**
     * @param  array<int, array<int,string>>  $cambios  biotime_empleados.id => columnas que BioTime cambió en esta corrida
     * @return array{creados: int, actualizados: int, cuentas: int, omitidos: array<int,string>, sin_cuenta: array<int,string>, nuevos: array<int,string>}
     */
    public function sincronizar(
        Empresa $empresa,
        array $cambios = [],
        bool $dryRun = false,
        ?Sucursal $sucursal = null,
        ?User $usuario = null,
        bool $forceUpdate = true,
    ): array {
        // Lo que se escribe aquí ya viene de BioTime: no se devuelve allá.
        return BioTimeEmpleadoPusher::sinEnviar(fn () => $this->sincronizarDesdeBioTime($empresa, $cambios, $dryRun, $sucursal, $usuario, $forceUpdate));
    }

    private function sincronizarDesdeBioTime(
        Empresa $empresa,
        array $cambios,
        bool $dryRun,
        ?Sucursal $sucursal,
        ?User $usuario,
        bool $forceUpdate = true,
    ): array {
        $res = ['diag' => '', 'creados' => 0, 'actualizados' => 0, 'cuentas' => 0, 'omitidos' => [], 'sin_cuenta' => [], 'nuevos' => []];

        $sinReloj = BiotimeDispositivo::areasSinReloj($empresa->id);

        $bios = $this->conReloj(BiotimeEmpleado::query()
            ->where('empresa_id', $empresa->id)
            ->orderByRaw('CAST(emp_code AS UNSIGNED)')
            ->get(), $sinReloj);

        $deptos = DB::table('biotime_departamentos')->where('empresa_id', $empresa->id)->pluck('dept_name', 'dept_code');
        $cargos = DB::table('biotime_cargos')->where('empresa_id', $empresa->id)->pluck('position_name', 'position_code');

        // 1. ACTUALIZAR ya vinculados primero para alinear codigo_acceso/documento_identidad y liberar códigos viejos
        if (! $dryRun) {
            foreach ($bios->whereNotNull('empleado_id') as $bio) {
                if ($this->actualizar($bio, $empresa, $cambios[$bio->id] ?? [], $deptos, $cargos, $forceUpdate)) {
                    $res['actualizados']++;
                }
            }
        }

        // 2. Auto-vincular pendientes cuyo documento, código de acceso, tarjeta o CURP ya coincida con Hoshō
        $vinculadosIds = BiotimeEmpleado::query()
            ->where('empresa_id', $empresa->id)
            ->whereNotNull('empleado_id')
            ->pluck('empleado_id');

        foreach ($bios->whereNull('empleado_id') as $bio) {
            $codigo = trim((string) $bio->emp_code);
            $existente = Empleado::withoutTenant()
                ->where('empresa_id', $empresa->id)
                ->when($vinculadosIds->isNotEmpty(), fn ($q) => $q->whereNotIn('id', $vinculadosIds))
                ->where(function ($q) use ($codigo, $bio) {
                    $q->where('documento_identidad', $codigo)
                        ->orWhere('codigo_acceso', $codigo);
                    if (! empty($bio->card_no)) {
                        $q->orWhere('tarjeta_acceso_1', trim((string) $bio->card_no));
                    }
                    if (! empty($bio->national)) {
                        $q->orWhere('curp', trim((string) $bio->national));
                    }
                })
                ->first();

            if ($existente) {
                $bio->update(['empleado_id' => $existente->id, 'link_status' => 'auto']);
                $vinculadosIds->push($existente->id);
                BiotimeMarcaje::query()
                    ->where('biotime_empleado_id', $bio->id)
                    ->update(['empleado_id' => $existente->id]);

                if (! $dryRun && $this->actualizar($bio, $empresa, $cambios[$bio->id] ?? [], $deptos, $cargos, $forceUpdate)) {
                    $res['actualizados']++;
                }
            }
        }

        // Recargar con los vínculos aplicados
        $bios = $this->conReloj(BiotimeEmpleado::query()
            ->where('empresa_id', $empresa->id)
            ->orderByRaw('CAST(emp_code AS UNSIGNED)')
            ->get(), $sinReloj);

        $pendientes = $bios->whereNull('empleado_id');
        $res['diag'] = sprintf('en espejo: %d, ya vinculados: %d, pendientes de crear: %d', $bios->count(), $bios->whereNotNull('empleado_id')->count(), $pendientes->count());
        $contexto = null;

        if ($pendientes->isNotEmpty()) {
            $sucursal ??= $this->sucursalPorDefecto($empresa);
            $usuario ??= User::query()->where('empresa_id', $empresa->id)->orderBy('id')->first();

            if ($sucursal === null || $usuario === null) {
                $res['omitidos'][] = $sucursal === null
                    ? 'La empresa no tiene sucursal donde dar de alta a los empleados.'
                    : 'La empresa no tiene un usuario que firme los catálogos nuevos.';
                $pendientes = collect();
            } else {
                $contexto = [$sucursal, $usuario];
            }
        }

        // 3. CREAR: Los que no están en Hosho se crean con todos los datos que están en BioTime
        foreach ($pendientes as $bio) {
            $codigo = trim((string) $bio->emp_code);

            if ($codigo === '') {
                $res['omitidos'][] = "{$bio->nombre_completo}: sin emp_code en BioTime.";
                continue;
            }

            // Verificación defensiva contra duplicados en la misma empresa
            $existente = Empleado::withoutTenant()
                ->where('empresa_id', $empresa->id)
                ->when($vinculadosIds->isNotEmpty(), fn ($q) => $q->whereNotIn('id', $vinculadosIds))
                ->where(fn ($q) => $q->where('documento_identidad', $codigo)->orWhere('codigo_acceso', $codigo))
                ->first();

            if ($existente) {
                $bio->update(['empleado_id' => $existente->id, 'link_status' => 'auto']);
                $vinculadosIds->push($existente->id);
                BiotimeMarcaje::query()->where('biotime_empleado_id', $bio->id)->update(['empleado_id' => $existente->id]);
                if (! $dryRun && $this->actualizar($bio, $empresa, $cambios[$bio->id] ?? [], $deptos, $cargos, $forceUpdate)) {
                    $res['actualizados']++;
                }
                continue;
            }

            if (Empleado::withoutTenant()->where('documento_identidad', $codigo)->exists()) {
                $res['omitidos'][] = "{$codigo} {$bio->nombre_completo}: el número de empleado ya está ocupado en otra empresa.";
                continue;
            }

            $res['nuevos'][] = "{$codigo} {$bio->nombre_completo}";
            $res['creados']++;

            if (! $dryRun) {
                [$suc, $usr] = $contexto;
                DB::transaction(fn () => $this->crear($bio, $codigo, $empresa, $suc, $usr, $deptos, $cargos));
            }
        }

        if (! $dryRun) {
            [$res['cuentas'], $res['sin_cuenta']] = $this->cuentas($empresa, $sinReloj);
        }

        if (! $dryRun && ($res['creados'] || $res['actualizados'] || $res['cuentas'])) {
            Log::channel('biotime')->info('BioTime alta/actualización de empleados', [
                'empresa_id' => $empresa->id, 'creados' => $res['creados'], 'actualizados' => $res['actualizados'], 'cuentas' => $res['cuentas'],
            ]);
        }

        return $res;
    }

    /**
     * Da cuenta de Usuarios a los colaboradores del reloj que aún no tienen.
     * Se omite (y se reporta) a quien no tenga correo válido o use uno que ya
     * es de otro usuario: vincular a mano es más seguro que adivinar.
     *
     * @return array{0: int, 1: array<int,string>}
     */
    private function cuentas(Empresa $empresa, array $sinReloj): array
    {
        $ids = $this->conReloj(BiotimeEmpleado::query()
            ->where('empresa_id', $empresa->id)
            ->whereNotNull('empleado_id')
            ->get(['empleado_id', 'area_names']), $sinReloj)
            ->pluck('empleado_id');

        $empleados = Empleado::withoutTenant()
            ->whereIn('id', $ids)
            ->where('empresa_id', $empresa->id)
            ->whereNull('user_id')
            ->get();

        $creadas = 0;
        $omitidos = [];

        foreach ($empleados as $empleado) {
            $nombre = trim("{$empleado->nombres} {$empleado->apellidos}");
            $correo = Str::lower(trim((string) $empleado->correo));

            if (! filter_var($correo, FILTER_VALIDATE_EMAIL)) {
                $omitidos[] = "{$nombre}: sin correo válido, no se le creó cuenta.";

                continue;
            }

            // Dominios reservados (los del demo usan .invalid) nunca reciben el
            // enlace para definir la contraseña: la cuenta quedaría inservible.
            if (in_array(Str::afterLast($correo, '.'), self::DOMINIOS_SIN_CORREO, true)) {
                $omitidos[] = "{$nombre}: {$correo} no recibe correo, no se le creó cuenta.";

                continue;
            }

            if (User::withoutTenant()->where('email', $correo)->exists()) {
                $omitidos[] = "{$nombre}: el correo {$correo} ya es de otro usuario; vincúlalo a mano.";

                continue;
            }

            $user = DB::transaction(function () use ($empleado, $nombre, $correo) {
                // Sin rol y con una contraseña que nadie conoce: la persona la
                // define con el enlace de restablecimiento. password_changed_at
                // vacío obliga a cambiarla si alguien llegara a entrar con otra.
                $user = User::withoutTenant()->create([
                    'name' => $nombre,
                    'email' => $correo,
                    'password' => Str::password(40),
                    'status' => 'activo',
                    'empresa_id' => $empleado->empresa_id,
                    'sucursal_id' => $empleado->sucursal_id,
                ]);
                $empleado->update(['user_id' => $user->id]);

                return $user;
            });

            // En la cola: el primer sync puede crear cientos de cuentas y no
            // debe esperar a que salga cada correo.
            dispatch(fn () => Password::broker()->sendResetLink(['email' => $user->email]));
            $creadas++;
        }

        return [$creadas, $omitidos];
    }

    /**
     * @param  Collection<int,BiotimeEmpleado>  $bios
     * @param  array<int,string>  $sinReloj
     * @return Collection<int,BiotimeEmpleado>
     */
    private function conReloj(Collection $bios, array $sinReloj): Collection
    {
        return $bios->reject(fn (BiotimeEmpleado $bio) => BiotimeDispositivo::soloEnAreasSinReloj($bio->area_names, $sinReloj));
    }

    private function crear(BiotimeEmpleado $bio, string $codigo, Empresa $empresa, Sucursal $sucursal, User $usuario, $deptos, $cargos): void
    {
        $departamento = $this->departamento($deptos[$bio->dept_code] ?? null, $empresa, $sucursal, $usuario);

        $cardNo = $bio->card_no ? trim((string) $bio->card_no) : null;
        if ($cardNo && Empleado::withoutTenant()->where('tarjeta_acceso_1', $cardNo)->exists()) {
            $cardNo = null;
        }

        $curp = $bio->national ? trim((string) $bio->national) : null;
        if ($curp && Empleado::withoutTenant()->where('empresa_id', $empresa->id)->where('curp', $curp)->exists()) {
            $curp = null;
        }

        $codigoAcceso = null;
        if ($codigo !== '' && mb_strlen($codigo) <= 20 && ! Empleado::withoutTenant()->where('codigo_acceso', $codigo)->exists()) {
            $codigoAcceso = $codigo;
        }

        $empleado = Empleado::create([
            'nombres' => $bio->first_name ?: 'N/A',
            'apellidos' => $bio->last_name ?: 'N/A',
            'documento_identidad' => $codigo,
            'codigo_acceso' => $codigoAcceso,
            'tarjeta_acceso_1' => $cardNo,
            'curp' => $curp,
            'telefono' => $bio->mobile ? trim((string) $bio->mobile) : null,
            'correo' => $bio->email ? trim((string) $bio->email) : null,
            'genero' => $this->genero($bio->gender),
            'fecha_nacimiento' => $bio->birthday?->toDateString(),
            'fecha_ingreso' => $bio->hire_date?->toDateString(),
            'departamento_id' => $departamento?->id,
            'cargo_id' => $this->cargo($cargos[$bio->position_code] ?? null, $departamento, $empresa, $sucursal, $usuario)?->id,
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'status' => $bio->enable_att !== null ? (bool) $bio->enable_att : true,
        ]);

        $bio->update(['empleado_id' => $empleado->id, 'link_status' => 'auto']);

        BiotimeMarcaje::query()->where('biotime_empleado_id', $bio->id)->update(['empleado_id' => $empleado->id]);
    }

    /** @param  array<int,string>  $cambiados */
    private function actualizar(
        BiotimeEmpleado $bio,
        Empresa $empresa,
        array $cambiados,
        $deptos,
        $cargos,
        bool $forceUpdate = true,
    ): bool {
        $empleado = Empleado::withoutTenant()->find($bio->empleado_id);

        // Sólo se tocan empleados de la misma empresa: un vínculo manual
        // equivocado no debe dejar que el reloj reescriba a otra empresa.
        if ($empleado === null || (int) $empleado->empresa_id !== (int) $empresa->id) {
            return false;
        }

        $sucursal = Sucursal::withoutTenant()->find($empleado->sucursal_id);
        if ($sucursal === null) {
            $sucursal = $this->sucursalPorDefecto($empresa);
        }

        // user_id del empleado es su propia cuenta: los catálogos los firma el
        // primer usuario de la empresa, igual que en el alta.
        $usuario = User::query()->where('empresa_id', $empresa->id)->orderBy('id')->first();

        $puedeCatalogar = $sucursal !== null && $usuario !== null;
        $departamento = $puedeCatalogar ? $this->departamento($deptos[$bio->dept_code] ?? null, $empresa, $sucursal, $usuario) : null;
        // Los cargos cuelgan de un departamento: sin él (el de BioTime o el que ya tiene) no se crea.
        $departamentoCargo = $departamento ?? ($empleado->departamento_id ? Departamento::withoutTenant()->find($empleado->departamento_id) : null);

        $nuevos = [];

        // Si el empleado no tenía sucursal asignada, le asignamos la detectada por defecto
        if ($empleado->sucursal_id === null && $sucursal !== null) {
            $nuevos['sucursal_id'] = $sucursal->id;
        }

        foreach (self::CAMPOS as $columna => $origen) {
            $valor = match ($columna) {
                'genero' => $this->genero($bio->gender),
                'fecha_nacimiento' => $bio->birthday?->toDateString(),
                'fecha_ingreso' => $bio->hire_date?->toDateString(),
                'departamento_id' => $departamento?->id,
                'cargo_id' => $puedeCatalogar && $departamentoCargo ? $this->cargo($cargos[$bio->position_code] ?? null, $departamentoCargo, $empresa, $sucursal, $usuario)?->id : null,
                default => blank($bio->{$origen}) ? null : trim((string) $bio->{$origen}),
            };

            if ($valor === null) {
                continue;
            }

            $actual = $empleado->getAttribute($columna);
            $actual = $actual instanceof \DateTimeInterface ? $actual->format('Y-m-d') : $actual;

            $cambioEnReloj = in_array($origen, $cambiados, true);
            $esCodigoBioTime = in_array($columna, ['codigo_acceso', 'documento_identidad'], true);

            if (blank($actual) || $forceUpdate || $esCodigoBioTime || ($cambioEnReloj && (string) $actual !== (string) $valor)) {
                if ((string) $actual !== (string) $valor) {
                    if ($columna === 'codigo_acceso' && (mb_strlen((string) $valor) > 20 || Empleado::withoutTenant()->where('codigo_acceso', $valor)->whereKeyNot($empleado->id)->exists())) {
                        continue;
                    }
                    if ($columna === 'documento_identidad' && Empleado::withoutTenant()->where('documento_identidad', $valor)->whereKeyNot($empleado->id)->exists()) {
                        continue;
                    }
                    // Una tarjeta ya usada por otro empleado no se copia: dos
                    // personas con el mismo gafete abrirían la puerta una por otra.
                    if ($columna === 'tarjeta_acceso_1' && Empleado::withoutTenant()->where('tarjeta_acceso_1', $valor)->whereKeyNot($empleado->id)->exists()) {
                        continue;
                    }
                    if ($columna === 'curp' && Empleado::withoutTenant()->where('empresa_id', $empresa->id)->where('curp', $valor)->whereKeyNot($empleado->id)->exists()) {
                        continue;
                    }
                    $nuevos[$columna] = $valor;
                }
            }
        }

        if ($bio->enable_att !== null && (bool) $empleado->status !== (bool) $bio->enable_att) {
            $nuevos['status'] = (bool) $bio->enable_att;
        }

        if ($nuevos === []) {
            return false;
        }

        $empleado->update($nuevos);

        return true;
    }

    private function genero(?string $g): ?string
    {
        return match (strtoupper(trim((string) $g))) {
            'M' => 'M',
            'F' => 'F',
            default => null,
        };
    }

    /** La sucursal donde ya viven los empleados de esta empresa; si no hay, la primera. */
    private function sucursalPorDefecto(Empresa $empresa): ?Sucursal
    {
        $id = Empleado::withoutTenant()
            ->where('empresa_id', $empresa->id)
            ->whereNotNull('sucursal_id')
            ->select('sucursal_id', DB::raw('count(*) as n'))
            ->groupBy('sucursal_id')
            ->orderByDesc('n')
            ->value('sucursal_id');

        $sucursal = Sucursal::withoutTenant()
            ->where('empresa_id', $empresa->id)
            ->when($id, fn ($q) => $q->whereKey($id))
            ->orderBy('id')
            ->first();

        // Una empresa recién creada puede no tener sucursales: sin una, nadie
        // de BioTime se podría dar de alta. Se crea una principal.
        return $sucursal ?? Sucursal::withoutTenant()->create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Principal',
            'codigo_numeral' => '01',
            'status' => true,
        ]);
    }

    private function departamento(?string $nombre, Empresa $empresa, Sucursal $sucursal, User $usuario): ?Departamento
    {
        if (blank($nombre)) {
            return null;
        }

        return Departamento::withoutTenant()->firstOrCreate(
            ['empresa_id' => $empresa->id, 'nombre' => trim($nombre)],
            ['sucursal_id' => $sucursal->id, 'user_id' => $usuario->id, 'status' => true],
        );
    }

    private function cargo(?string $nombre, ?Departamento $departamento, Empresa $empresa, Sucursal $sucursal, User $usuario): ?Cargo
    {
        if (blank($nombre)) {
            return null;
        }

        return Cargo::withoutTenant()->firstOrCreate(
            ['empresa_id' => $empresa->id, 'nombre' => trim($nombre)],
            ['departamento_id' => $departamento?->id, 'sucursal_id' => $sucursal->id, 'user_id' => $usuario->id, 'status' => true],
        );
    }
}
