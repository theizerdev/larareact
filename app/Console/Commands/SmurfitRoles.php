<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Crea (o pone al día) los perfiles de la matriz de accesos de Smurfit
 * Westrock, la misma en el web y en la app:
 *
 * | Rol                  | Alcance          | Kiosko | Dashboard | Empleados | Bitácoras | Perfil |
 * |----------------------|------------------|--------|-----------|-----------|-----------|--------|
 * | Super Administrador  | Todo             |   x    |     x     |     x     |     x     |   x    |
 * | Administrador        | Su empresa       |   x    |     x     |     x     |     x     |   x    |
 * | Responsable de zona  | Su Legacy        |   x    |     x     |     x     |     x     |   x    |
 * | Gerente RRHH         | Su Legacy y sede |   x    |           |           |     x     |   x    |
 * | Colaborador          | Él mismo         |   x    |           |           |     x     |   x    |
 *
 * Super Administrador es `super-admin` y Administrador es el rol de
 * `smurfit:admin`; este comando crea los otros tres. El alcance no va en el
 * rol: sale de `users.legacy` (AlcancePorLegacy) y de `users.sucursal_id`
 * (Multitenantable). Al Colaborador le basta su cuenta ligada al empleado:
 * checa y ve su bitácora sin permisos.
 *
 * Es idempotente: re-ejecutarlo re-sincroniza los permisos.
 */
class SmurfitRoles extends Command
{
    protected $signature = 'smurfit:roles';

    protected $description = 'Crea los roles Responsable de zona, Gerente RRHH y Colaborador con sus permisos';

    public const RESPONSABLE_ZONA = 'Responsable de zona';

    public const GERENTE_RRHH = 'Gerente RRHH';

    public const COLABORADOR = 'Colaborador';

    /** @var array<string, list<string>> */
    public const ROLES = [
        self::RESPONSABLE_ZONA => [
            'dashboard.view',
            'empleados.view', 'empleados.create', 'empleados.edit',
            'departamentos.view', 'cargos.view', 'sucursales.view', 'responsables.view',
            'asistencia.view', 'asistencia.kiosko', 'asistencia.bitacora', 'asistencia.nomina',
        ],
        // El kiosko de su sede (con enrolamiento) y la bitácora de su gente.
        self::GERENTE_RRHH => [
            'asistencia.kiosko', 'asistencia.bitacora',
        ],
        self::COLABORADOR => [],
    ];

    public function handle(): int
    {
        $todos = array_unique(array_merge(...array_values(self::ROLES)));
        $faltantes = array_diff($todos, Permission::whereIn('name', $todos)->pluck('name')->all());

        if ($faltantes !== []) {
            $this->error('Faltan permisos en la BD (corre PermissionSeeder): '.implode(', ', $faltantes));

            return self::FAILURE;
        }

        DB::transaction(function () {
            foreach (self::ROLES as $nombre => $permisos) {
                Role::firstOrCreate(['name' => $nombre, 'guard_name' => 'web'])->syncPermissions($permisos);
            }
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::ROLES as $nombre => $permisos) {
            $this->info("Rol \"{$nombre}\" con ".count($permisos).' permisos.');
        }

        $this->line('Asigna el Legacy (zona) y la sede de cada usuario en Usuarios: sin ellos ve toda su empresa.');

        return self::SUCCESS;
    }
}
