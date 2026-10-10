<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Crea (o pone al día) el administrador del cliente Smurfit Westrock.
 *
 * Con el superadministrador se ve todo: monitoreo, empresas, países, roles y
 * los módulos apagados. Este rol deja sólo lo que opera el cliente en su
 * instancia: organización, reloj checador, BioTime y sus propios usuarios.
 * Es idempotente: re-ejecutarlo re-sincroniza los permisos del rol.
 */
class SmurfitAdmin extends Command
{
    protected $signature = 'smurfit:admin
        {--email= : Correo del usuario administrador (obligatorio la primera vez)}
        {--password= : Contraseña temporal; si se omite se genera una}
        {--empresa= : ID de la empresa (por defecto la que se llama Smurfit…)}';

    protected $description = 'Crea el rol "Administrador Smurfit" con permisos recortados y el usuario "Smurfit Westrock"';

    public const ROL = 'Administrador Smurfit';

    public const USERNAME = 'smurfitwestrock';

    /** Permisos del rol. Lo que no está aquí, el cliente no lo ve. */
    public const PERMISOS = [
        'dashboard.view',

        // Sus propios usuarios (Multitenantable los limita a su empresa).
        'users.view', 'users.create', 'users.edit',

        // Organización / Colaboradores
        'sucursales.view', 'sucursales.create', 'sucursales.edit',
        'departamentos.view', 'departamentos.create', 'departamentos.edit', 'departamentos.delete',
        'cargos.view', 'cargos.create', 'cargos.edit', 'cargos.delete',
        'responsables.view', 'responsables.create', 'responsables.edit', 'responsables.delete',
        'empleados.view', 'empleados.create', 'empleados.edit', 'empleados.delete', 'empleados.import',

        // Reloj checador
        'asistencia.view', 'asistencia.kiosko', 'asistencia.bitacora', 'asistencia.nomina', 'asistencia.configuracion',
        'biotime.view', 'biotime.manage',

        // Integraciones (configurar la conexión con BioTime Cloud)
        'integrations.view', 'integrations.edit',
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

        $faltantes = array_diff(self::PERMISOS, Permission::whereIn('name', self::PERMISOS)->pluck('name')->all());
        if ($faltantes !== []) {
            $this->error('Faltan permisos en la BD (corre PermissionSeeder): '.implode(', ', $faltantes));

            return self::FAILURE;
        }

        $user = User::withoutGlobalScopes()->where('username', self::USERNAME)->first();
        $email = $this->option('email') ? Str::lower(trim($this->option('email'))) : $user?->email;

        if (! $email || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Indica un correo válido con --email=.');

            return self::FAILURE;
        }

        $passwordNueva = $this->option('password') ?: ($user ? null : self::passwordTemporal());

        DB::transaction(function () use ($empresa, $email, $passwordNueva, &$user) {
            $rol = Role::firstOrCreate(['name' => self::ROL, 'guard_name' => 'web']);
            $rol->syncPermissions(self::PERMISOS);

            $user ??= new User;
            $user->fill([
                'name' => 'Smurfit Westrock',
                'username' => self::USERNAME,
                'email' => $email,
                'status' => 'activo',
                'empresa_id' => $empresa->id,
                'sucursal_id' => Sucursal::where('empresa_id', $empresa->id)->orderBy('id')->value('id'),
            ]);

            if ($passwordNueva) {
                $user->password = Hash::make($passwordNueva);
                // Sin fecha de cambio: en el primer inicio de sesión se le
                // obliga a cambiarla (política SOX de EnsurePasswordNotExpired).
                $user->password_changed_at = null;
            }

            $user->email_verified_at ??= now();
            $user->save();

            // Sólo este rol: si antes tenía admin o super-admin, se le quitan.
            $user->syncRoles([self::ROL]);
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->info("Rol \"".self::ROL.'" con '.count(self::PERMISOS).' permisos.');
        $this->info("Usuario #{$user->id} {$user->email} (empresa #{$empresa->id} {$empresa->razon_social}).");

        if ($passwordNueva && ! $this->option('password')) {
            $this->warn('Contraseña temporal (se muestra una sola vez; se pedirá cambiarla al entrar):');
            $this->line('  '.$passwordNueva);
        }

        return self::SUCCESS;
    }

    /** 20 caracteres con mayúsculas, minúsculas, números y símbolos (política SOX: mínimo 15). */
    public static function passwordTemporal(): string
    {
        // Str::password garantiza letra, número y símbolo, pero no ambas cajas.
        do {
            $password = Str::password(20);
        } while (! preg_match('/[a-z]/', $password) || ! preg_match('/[A-Z]/', $password));

        return $password;
    }
}
