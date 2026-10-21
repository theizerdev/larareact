<?php

namespace App\Services;

use App\Models\BiotimeEmpleado;
use App\Models\BiotimeMarcaje;
use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
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
 *
 * El sentido contrario (de Colaboradores hacia BioTime) es BioTimeEmpleadoPusher.
 */
class BioTimeEmpleadoProvisioner
{
    /** Campo de biotime_empleados que alimenta a cada columna de empleados. */
    private const CAMPOS = [
        'nombres' => 'first_name',
        'apellidos' => 'last_name',
        'tarjeta_acceso_1' => 'card_no',
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
    ): array {
        // Lo que se escribe aquí ya viene de BioTime: no se devuelve allá.
        return BioTimeEmpleadoPusher::sinEnviar(fn () => $this->sincronizarDesdeBioTime($empresa, $cambios, $dryRun, $sucursal, $usuario));
    }

    private function sincronizarDesdeBioTime(Empresa $empresa, array $cambios, bool $dryRun, ?Sucursal $sucursal, ?User $usuario): array
    {
        $res =['creados' => 0, 'actualizados' => 0, 'cuentas' => 0, 'omitidos' => [], 'sin_cuenta' => [], 'nuevos' => []];

        $bios = BiotimeEmpleado::query()
            ->where('empresa_id', $empresa->id)
            ->orderByRaw('CAST(emp_code AS UNSIGNED)')
            ->get();

        $pendientes = $bios->whereNull('empleado_id');
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

        $deptos = DB::table('biotime_departamentos')->where('empresa_id', $empresa->id)->pluck('dept_name', 'dept_code');
        $cargos = DB::table('biotime_cargos')->where('empresa_id', $empresa->id)->pluck('position_name', 'position_code');

        foreach ($pendientes as $bio) {
            $codigo = trim((string) $bio->emp_code);

            if (Empleado::withoutTenant()->where('documento_identidad', $codigo)->exists()) {
                $res['omitidos'][] = "{$codigo} {$bio->nombre_completo}: ya hay un empleado con documento {$codigo}; vincúlalo a mano.";

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
            foreach ($bios->whereNotNull('empleado_id') as $bio) {
                if ($this->actualizar($bio, $empresa, $cambios[$bio->id] ?? [], $deptos, $cargos)) {
                    $res['actualizados']++;
                }
            }
        }

        if (! $dryRun) {
            [$res['cuentas'], $res['sin_cuenta']] = $this->cuentas($empresa);
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
    private function cuentas(Empresa $empresa): array
    {
        $ids = BiotimeEmpleado::query()
            ->where('empresa_id', $empresa->id)
            ->whereNotNull('empleado_id')
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

    private function crear(BiotimeEmpleado $bio, string $codigo, Empresa $empresa, Sucursal $sucursal, User $usuario, $deptos, $cargos): void
    {
        $departamento = $this->departamento($deptos[$bio->dept_code] ?? null, $empresa, $sucursal, $usuario);

        $empleado = Empleado::create([
            'nombres' => $bio->first_name ?: 'N/A',
            'apellidos' => $bio->last_name ?: 'N/A',
            'documento_identidad' => $codigo,
            'tarjeta_acceso_1' => $bio->card_no,
            'telefono' => $bio->mobile,
            'correo' => $bio->email,
            'genero' => $this->genero($bio->gender),
            'fecha_nacimiento' => $bio->birthday?->toDateString(),
            'fecha_ingreso' => $bio->hire_date?->toDateString(),
            'departamento_id' => $departamento?->id,
            'cargo_id' => $this->cargo($cargos[$bio->position_code] ?? null, $departamento, $empresa, $sucursal, $usuario)?->id,
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
            'status' => true,
        ]);

        $bio->update(['empleado_id' => $empleado->id, 'link_status' => 'auto']);

        BiotimeMarcaje::query()->where('biotime_empleado_id', $bio->id)->update(['empleado_id' => $empleado->id]);
    }

    /** @param  array<int,string>  $cambiados */
    private function actualizar(BiotimeEmpleado $bio, Empresa $empresa, array $cambiados, $deptos, $cargos): bool
    {
        $empleado = Empleado::withoutTenant()->find($bio->empleado_id);

        // Sólo se tocan empleados de la misma empresa: un vínculo manual
        // equivocado no debe dejar que el reloj reescriba a otra empresa.
        if ($empleado === null || (int) $empleado->empresa_id !== (int) $empresa->id) {
            return false;
        }

        $sucursal = Sucursal::withoutTenant()->find($empleado->sucursal_id);
        // user_id del empleado es su propia cuenta: los catálogos los firma el
        // primer usuario de la empresa, igual que en el alta.
        $usuario = User::query()->where('empresa_id', $empresa->id)->orderBy('id')->first();

        $puedeCatalogar = $sucursal !== null && $usuario !== null;
        $departamento = $puedeCatalogar ? $this->departamento($deptos[$bio->dept_code] ?? null, $empresa, $sucursal, $usuario) : null;
        // Los cargos cuelgan de un departamento: sin él (el de BioTime o el que ya tiene) no se crea.
        $departamentoCargo = $departamento ?? ($empleado->departamento_id ? Departamento::withoutTenant()->find($empleado->departamento_id) : null);

        $nuevos = [];
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

            if (blank($actual) || ($cambioEnReloj && (string) $actual !== (string) $valor)) {
                // Una tarjeta ya usada por otro empleado no se copia: dos
                // personas con el mismo gafete abrirían la puerta una por otra.
                if ($columna === 'tarjeta_acceso_1' && Empleado::withoutTenant()->where('tarjeta_acceso_1', $valor)->whereKeyNot($empleado->id)->exists()) {
                    continue;
                }
                $nuevos[$columna] = $valor;
            }
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

        return Sucursal::withoutTenant()
            ->where('empresa_id', $empresa->id)
            ->when($id, fn ($q) => $q->whereKey($id))
            ->orderBy('id')
            ->first();
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
