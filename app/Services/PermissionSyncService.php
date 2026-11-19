<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSyncService
{
    /**
     * Nombres reservados para roles de Super Administrador.
     */
    public const SUPER_ADMIN_ROLES = [
        'Super Administrador',
        'super-admin',
        'Super Admin',
        'super_admin',
    ];

    /**
     * Catálogo canónico de permisos agrupado por sector => módulo => [permiso => descripción].
     *
     * @return array<string, array<string, array<string, string>>>
     */
    public function catalog(): array
    {
        return [
            'seguridad' => [
                'dashboard' => [
                    'dashboard.view' => 'Ver Dashboard',
                ],
                'usuarios' => [
                    'users.view' => 'Ver Usuarios',
                    'users.create' => 'Crear Usuario',
                    'users.edit' => 'Editar Usuario',
                    'users.delete' => 'Eliminar Usuario',
                ],
                'roles' => [
                    'roles.view' => 'Ver Roles',
                    'roles.create' => 'Crear Rol',
                    'roles.edit' => 'Editar Rol',
                    'roles.delete' => 'Eliminar Rol',
                ],
                'sox' => [
                    'sox.view' => 'Ver Cumplimiento SOX',
                    'sox.manage' => 'Gestionar Políticas SOX',
                ],
            ],
            'organizacion' => [
                'departamentos' => [
                    'departamentos.view' => 'Ver Departamentos',
                    'departamentos.create' => 'Crear Departamento',
                    'departamentos.edit' => 'Editar Departamento',
                    'departamentos.delete' => 'Eliminar Departamento',
                ],
                'cargos' => [
                    'cargos.view' => 'Ver Cargos',
                    'cargos.create' => 'Crear Cargo',
                    'cargos.edit' => 'Editar Cargo',
                    'cargos.delete' => 'Eliminar Cargo',
                ],
                'responsables' => [
                    'responsables.view' => 'Ver Responsables',
                    'responsables.create' => 'Crear Responsable',
                    'responsables.edit' => 'Editar Responsable',
                    'responsables.delete' => 'Eliminar Responsable',
                ],
                'empleados' => [
                    'empleados.view' => 'Ver Empleados',
                    'empleados.create' => 'Crear Empleado',
                    'empleados.edit' => 'Editar Empleado',
                    'empleados.delete' => 'Eliminar Empleado',
                    'empleados.import' => 'Importar Empleados desde Excel',
                ],
                'proveedores' => [
                    'proveedores.view' => 'Ver Proveedores',
                    'proveedores.create' => 'Crear Proveedor',
                    'proveedores.edit' => 'Editar Proveedor',
                    'proveedores.delete' => 'Eliminar Proveedor',
                    'proveedores.send-carnet-whatsapp' => 'Enviar Carnet por WhatsApp a Proveedor',
                ],
                'productores' => [
                    'productores.view' => 'Ver Productores',
                    'productores.create' => 'Crear Productor',
                    'productores.edit' => 'Editar Productor',
                    'productores.delete' => 'Eliminar Productor',
                    'productores.send-carnet-whatsapp' => 'Enviar Carnet por WhatsApp a Productor',
                ],
            ],
            'visitas' => [
                'visitas_temporales' => [
                    'visitas_temporales.view' => 'Ver Visitas Temporales',
                    'visitas_temporales.create' => 'Crear Visita Temporal',
                    'visitas_temporales.edit' => 'Editar Visita Temporal',
                    'visitas_temporales.delete' => 'Eliminar Visita Temporal',
                ],
                'control_acceso' => [
                    'control_acceso.view' => 'Ver Control de Acceso',
                ],
            ],
            'asistencia' => [
                'asistencia' => [
                    'asistencia.view' => 'Ver Módulo de Asistencia',
                    'asistencia.kiosko' => 'Acceso al Kiosko Checador',
                    'asistencia.bitacora' => 'Ver Bitácora de Marcajes',
                    'asistencia.nomina' => 'Ver Pre-Nómina y Cálculo LFT',
                    'asistencia.configuracion' => 'Configurar Asistencia y Turnos LFT',
                ],
                'biotime' => [
                    'biotime.view' => 'Ver Datos de BioTime',
                    'biotime.manage' => 'Sincronizar y Vincular BioTime',
                ],
            ],
            'configuracion' => [
                'empresas' => [
                    'empresas.view' => 'Ver Empresas',
                    'empresas.create' => 'Crear Empresa',
                    'empresas.edit' => 'Editar Empresa',
                    'empresas.delete' => 'Eliminar Empresa',
                ],
                'sucursales' => [
                    'sucursales.view' => 'Ver Sucursales',
                    'sucursales.create' => 'Crear Sucursal',
                    'sucursales.edit' => 'Editar Sucursal',
                    'sucursales.delete' => 'Eliminar Sucursal',
                ],
                'paises' => [
                    'paises.view' => 'Ver Países',
                    'paises.create' => 'Crear País',
                    'paises.edit' => 'Editar País',
                    'paises.delete' => 'Eliminar País',
                ],
                'integraciones' => [
                    'integrations.view' => 'Ver Integraciones',
                    'integrations.edit' => 'Editar Integraciones',
                    'whatsapp.view' => 'Ver Configuración WhatsApp',
                    'whatsapp.manage' => 'Gestionar WhatsApp',
                    'whatsapp.send' => 'Enviar Mensajes WhatsApp',
                    'jaak.view' => 'Ver Configuración JAAK',
                    'jaak.manage' => 'Gestionar Configuración JAAK',
                ],
            ],
            'monitoreo' => [
                'monitoreo' => [
                    'monitoreo.view' => 'Ver Monitoreo',
                    'monitoreo.server' => 'Ver Stats del Servidor',
                    'monitoreo.logins' => 'Ver Historial de Sesiones',
                    'monitoreo.activities' => 'Ver Actividades del Sistema',
                    'monitoreo.database' => 'Gestionar Base de Datos',
                    'monitoreo.backup' => 'Crear Respaldo de BD',
                    'monitoreo.import' => 'Importar Base de Datos',
                ],
            ],
        ];
    }

    /**
     * Metadatos de sectores ordenados para presentación en UI.
     *
     * @return array<string, array{label: string, description: string, order: int}>
     */
    public function sectorMeta(): array
    {
        return [
            'seguridad' => [
                'label' => 'Seguridad',
                'description' => 'Dashboard, usuarios, roles y cumplimiento SOX.',
                'order' => 1,
            ],
            'organizacion' => [
                'label' => 'Organización',
                'description' => 'Estructura operativa, empleados, proveedores y socios.',
                'order' => 2,
            ],
            'visitas' => [
                'label' => 'Visitas y Accesos',
                'description' => 'Visitas temporales, garita y control de acceso.',
                'order' => 3,
            ],
            'asistencia' => [
                'label' => 'Asistencia y Reloj',
                'description' => 'Kiosko checador, bitácora, nómina LFT y BioTime.',
                'order' => 4,
            ],
            'configuracion' => [
                'label' => 'Configuración',
                'description' => 'Empresas, sucursales, países e integraciones.',
                'order' => 5,
            ],
            'monitoreo' => [
                'label' => 'Monitoreo',
                'description' => 'Auditoría, servidor, sesiones y respaldos.',
                'order' => 6,
            ],
            'sistema' => [
                'label' => 'Sistema',
                'description' => 'Permisos generales o autodescubiertos de rutas.',
                'order' => 99,
            ],
        ];
    }

    /**
     * Nombres legibles para cada módulo.
     *
     * @return array<string, string>
     */
    public function moduleMeta(): array
    {
        return [
            'dashboard' => 'Dashboard',
            'usuarios' => 'Usuarios',
            'roles' => 'Roles',
            'sox' => 'Cumplimiento SOX',
            'departamentos' => 'Departamentos',
            'cargos' => 'Cargos',
            'responsables' => 'Responsables',
            'empleados' => 'Empleados',
            'proveedores' => 'Proveedores',
            'productores' => 'Productores',
            'visitas_temporales' => 'Visitas y Garita',
            'control_acceso' => 'Control de Acceso',
            'asistencia' => 'Asistencia LFT',
            'biotime' => 'BioTime PRO',
            'empresas' => 'Empresas',
            'sucursales' => 'Sucursales',
            'paises' => 'Países',
            'integraciones' => 'Integraciones',
            'monitoreo' => 'Monitoreo y Auditoría',
            'general' => 'General',
        ];
    }

    /**
     * Construye el mapa plano esperado combinando el catálogo canónico y el autodescubrimiento de rutas.
     *
     * @return array<string, array{name: string, slug: string, sector: string, module: string, source: string}>
     */
    public function expectedPermissions(): array
    {
        $expected = [];

        foreach ($this->catalog() as $sector => $modules) {
            foreach ($modules as $module => $perms) {
                foreach ($perms as $name => $slug) {
                    $expected[$name] = [
                        'name' => $name,
                        'slug' => $slug,
                        'sector' => $sector,
                        'module' => $module,
                        'source' => 'catalog',
                    ];
                }
            }
        }

        foreach ($this->discoverRoutePermissions() as $perm) {
            if (! isset($expected[$perm['name']])) {
                $expected[$perm['name']] = $perm;
            }
        }

        return $expected;
    }

    /**
     * Descubre permisos declarados en middlewares `permission:...` y `can:...` de las rutas activas.
     *
     * @return array<string, array{name: string, slug: string, sector: string, module: string, source: string}>
     */
    public function discoverRoutePermissions(): array
    {
        $discovered = [];

        foreach (Route::getRoutes() as $route) {
            try {
                $middlewares = $route->gatherMiddleware();
            } catch (\Throwable) {
                continue;
            }

            foreach ($middlewares as $middleware) {
                if (! is_string($middleware)) {
                    continue;
                }

                $names = [];
                if (str_starts_with($middleware, 'permission:')) {
                    $raw = substr($middleware, strlen('permission:'));
                    $names = preg_split('/[|,]/', $raw) ?: [];
                } elseif (str_starts_with($middleware, 'can:')) {
                    $raw = substr($middleware, strlen('can:'));
                    $ability = trim(explode(',', $raw)[0] ?? '');
                    if ($ability !== '' && str_contains($ability, '.')) {
                        $names = [$ability];
                    }
                }

                foreach ($names as $rawName) {
                    $name = trim($rawName);
                    if ($name === '' || isset($discovered[$name])) {
                        continue;
                    }

                    $discovered[$name] = $this->inferPermissionMeta($name);
                }
            }
        }

        return $discovered;
    }

    /**
     * Inspecciona diferencias entre la base de datos y el catálogo esperado + rutas.
     */
    public function inspect(): array
    {
        $expected = $this->expectedPermissions();
        $existing = Permission::withCount('roles')
            ->where('guard_name', 'web')
            ->get()
            ->keyBy('name');

        $toCreate = [];
        $toUpdate = [];

        foreach ($expected as $name => $spec) {
            $current = $existing->get($name);

            if (! $current) {
                $toCreate[] = $spec;
                continue;
            }

            if (
                $current->slug !== $spec['slug'] ||
                $current->sector !== $spec['sector'] ||
                $current->module !== $spec['module']
            ) {
                $toUpdate[] = [
                    'name' => $name,
                    'slug' => $spec['slug'],
                    'current_slug' => $current->slug,
                    'current_sector' => $current->sector,
                    'target_sector' => $spec['sector'],
                    'current_module' => $current->module,
                    'target_module' => $spec['module'],
                    'source' => $spec['source'],
                ];
            }
        }

        $obsolete = [];
        foreach ($existing as $name => $current) {
            if (! isset($expected[$name])) {
                $obsolete[] = [
                    'id' => $current->id,
                    'name' => $current->name,
                    'slug' => $current->slug ?: $current->name,
                    'sector' => $current->sector,
                    'module' => $current->module,
                    'roles_count' => (int) ($current->roles_count ?? 0),
                ];
            }
        }

        $pendingCount = count($toCreate) + count($toUpdate);

        return [
            'to_create' => $toCreate,
            'to_update' => $toUpdate,
            'obsolete' => $obsolete,
            'pending_count' => $pendingCount,
            'obsolete_count' => count($obsolete),
            'in_sync' => $pendingCount === 0 && count($obsolete) === 0,
            'total_expected' => count($expected),
            'total_in_db' => $existing->count(),
        ];
    }

    /**
     * Sincroniza permisos con la base de datos, limpia caché de Spatie y opcionalmente poda obsoletos.
     *
     * @return array{created: int, updated: int, discovered: int, pruned: int, super_admin_synced: int, total: int}
     */
    public function sync(bool $pruneObsolete = false, bool $syncSuperAdmin = true): array
    {
        $expected = $this->expectedPermissions();

        $summary = DB::transaction(function () use ($expected, $pruneObsolete, $syncSuperAdmin) {
            $created = 0;
            $updated = 0;
            $discovered = 0;
            $pruned = 0;
            $superAdminSynced = 0;

            $existing = Permission::where('guard_name', 'web')->get()->keyBy('name');

            foreach ($expected as $name => $spec) {
                $current = $existing->get($name);

                if (! $current) {
                    Permission::create([
                        'name' => $name,
                        'guard_name' => 'web',
                        'slug' => $spec['slug'],
                        'module' => $spec['module'],
                        'sector' => $spec['sector'],
                    ]);
                    $created++;
                    if ($spec['source'] === 'route') {
                        $discovered++;
                    }
                } elseif (
                    $current->slug !== $spec['slug'] ||
                    $current->sector !== $spec['sector'] ||
                    $current->module !== $spec['module']
                ) {
                    $current->update([
                        'slug' => $spec['slug'],
                        'module' => $spec['module'],
                        'sector' => $spec['sector'],
                    ]);
                    $updated++;
                }
            }

            if ($pruneObsolete) {
                $obsoletePerms = Permission::where('guard_name', 'web')
                    ->whereNotIn('name', array_keys($expected))
                    ->get();

                foreach ($obsoletePerms as $perm) {
                    $perm->delete();
                    $pruned++;
                }
            }

            if ($syncSuperAdmin) {
                $allPermissions = Permission::where('guard_name', 'web')->get();
                $superRoles = Role::whereIn('name', self::SUPER_ADMIN_ROLES)->get();

                foreach ($superRoles as $role) {
                    $role->syncPermissions($allPermissions);
                    $superAdminSynced++;
                }
            }

            return [
                'created' => $created,
                'updated' => $updated,
                'discovered' => $discovered,
                'pruned' => $pruned,
                'super_admin_synced' => $superAdminSynced,
                'total' => Permission::where('guard_name', 'web')->count(),
            ];
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $summary;
    }

    /**
     * Infiere sector, módulo y descripción legible para un permiso descubierto en rutas.
     *
     * @return array{name: string, slug: string, sector: string, module: string, source: string}
     */
    protected function inferPermissionMeta(string $name): array
    {
        [$prefix, $action] = array_pad(explode('.', $name, 2), 2, '');

        $sector = match ($prefix) {
            'dashboard', 'users', 'roles', 'sox' => 'seguridad',
            'departamentos', 'cargos', 'responsables', 'empleados', 'proveedores', 'productores' => 'organizacion',
            'visitas_temporales', 'control_acceso' => 'visitas',
            'asistencia', 'biotime' => 'asistencia',
            'empresas', 'sucursales', 'paises', 'integrations', 'whatsapp', 'jaak' => 'configuracion',
            'monitoreo' => 'monitoreo',
            default => 'sistema',
        };

        $module = match ($prefix) {
            'users' => 'usuarios',
            'integrations', 'whatsapp', 'jaak' => 'integraciones',
            '' => 'general',
            default => $prefix,
        };

        $moduleLabel = $this->moduleMeta()[$module] ?? ucfirst(str_replace(['_', '-'], ' ', $module));

        $actionLabel = match ($action) {
            'view' => 'Ver',
            'create' => 'Crear',
            'edit' => 'Editar',
            'delete' => 'Eliminar',
            'manage' => 'Gestionar',
            'import' => 'Importar',
            'export' => 'Exportar',
            default => $action !== '' ? ucfirst(str_replace(['.', '_', '-'], ' ', $action)) : 'Acceso a',
        };

        return [
            'name' => $name,
            'slug' => trim("{$actionLabel} {$moduleLabel}"),
            'sector' => $sector,
            'module' => $module,
            'source' => 'route',
        ];
    }
}
