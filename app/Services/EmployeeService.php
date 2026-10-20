<?php

namespace App\Services;

use App\Models\Empleado;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class EmployeeService
{
    /**
     * Prevenir bucles de sincronización recursiva entre User y Empleado.
     */
    protected static bool $isSyncing = false;

    /**
     * Obtener listado paginado y filtrado de empleados.
     */
    public function list(array $filters = [], ?int $empresaId = null, ?int $sucursalId = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = Empleado::with(['sucursal', 'user'])
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId));

        if (!empty($sucursalId) && $sucursalId !== 'all') {
            $query->where('sucursal_id', (int) $sucursalId);
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('nombres', 'like', "%{$search}%")
                    ->orWhere('apellidos', 'like', "%{$search}%")
                    ->orWhere('documento_numero', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('telefono', 'like', "%{$search}%")
                    ->orWhere('cargo', 'like', "%{$search}%");
            });
        }

        if (isset($filters['estado']) && $filters['estado'] !== '' && $filters['estado'] !== 'all') {
            $query->where('estado', filter_var($filters['estado'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->orderBy('nombres', 'asc')
            ->orderBy('apellidos', 'asc')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Obtener lista de empleados activos para selectores en POS / Terminal.
     */
    public function getActiveEmployees(?int $empresaId = null, ?int $sucursalId = null): Collection
    {
        return Empleado::query()
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->when($sucursalId && $sucursalId !== 'all', fn ($q) => $q->where('sucursal_id', (int) $sucursalId))
            ->where('estado', true)
            ->orderBy('nombres', 'asc')
            ->get([
                'id',
                'nombres',
                'apellidos',
                'documento_numero',
                'cargo',
                'porcentaje_comision',
                'tipo_comision',
                'comision_aplica_a',
                'sucursal_id',
            ]);
    }

    /**
     * Registrar un nuevo empleado y crear automáticamente su cuenta de usuario.
     */
    public function create(array $data, int $empresaId): Empleado
    {
        return DB::transaction(function () use ($data, $empresaId) {
            static::$isSyncing = true;
            try {
                $data['empresa_id'] = $empresaId;
                $data['porcentaje_comision'] = max(0, min(100, (float) ($data['porcentaje_comision'] ?? 0)));
                $data['porcentaje_comision_reparacion'] = max(0, min(100, (float) ($data['porcentaje_comision_reparacion'] ?? 0)));
                $data['sueldo_base'] = max(0, (float) ($data['sueldo_base'] ?? 0));
                $data['estado'] = isset($data['estado']) ? (bool) $data['estado'] : true;

                $crearUsuario = !isset($data['crear_usuario']) || filter_var($data['crear_usuario'], FILTER_VALIDATE_BOOLEAN);

                // Crear usuario automáticamente si está habilitado
                if ($crearUsuario) {
                    if (empty($data['email'])) {
                        $slug = \Illuminate\Support\Str::slug($data['nombres'] . '.' . $data['apellidos']);
                        $data['email'] = strtolower(($slug ?: 'empleado') . rand(100, 999) . '@fixsale.pos');
                    }

                    $email = strtolower(trim($data['email']));
                    $existingUser = \App\Models\User::where('email', $email)->first();

                    if ($existingUser) {
                        if ($existingUser->empresa_id === $empresaId) {
                            $data['user_id'] = $existingUser->id;
                        }
                    } else {
                        $plainPassword = !empty($data['password']) ? $data['password'] : '12345678';
                        $roleName = !empty($data['rol']) ? $data['rol'] : 'Vendedor';

                        $user = \App\Models\User::create([
                            'name' => trim($data['nombres'] . ' ' . $data['apellidos']),
                            'email' => $email,
                            'username' => $this->generateUniqueUsername($data['nombres'], $data['apellidos']),
                            'telefono' => $data['telefono'] ?? null,
                            'status' => 'activo',
                            'empresa_id' => $empresaId,
                            'sucursal_id' => !empty($data['sucursal_id']) ? (int) $data['sucursal_id'] : null,
                            'password' => \Illuminate\Support\Facades\Hash::make($plainPassword),
                            'sueldo_base' => $data['sueldo_base'] ?? 0,
                        ]);

                        $this->assignUserRole($user, $roleName, $empresaId);

                        $data['user_id'] = $user->id;
                    }
                }

                unset($data['crear_usuario'], $data['password'], $data['rol']);

                return Empleado::create($data);
            } finally {
                static::$isSyncing = false;
            }
        });
    }

    /**
     * Actualizar datos de un empleado y sincronizar su usuario vinculado.
     */
    public function update(Empleado $empleado, array $data): Empleado
    {
        return DB::transaction(function () use ($empleado, $data) {
            static::$isSyncing = true;
            try {
                if (isset($data['porcentaje_comision'])) {
                    $data['porcentaje_comision'] = max(0, min(100, (float) $data['porcentaje_comision']));
                }
                if (isset($data['porcentaje_comision_reparacion'])) {
                    $data['porcentaje_comision_reparacion'] = max(0, min(100, (float) $data['porcentaje_comision_reparacion']));
                }
                if (isset($data['sueldo_base'])) {
                    $data['sueldo_base'] = max(0, (float) $data['sueldo_base']);
                }
                if (isset($data['estado'])) {
                    $data['estado'] = (bool) $data['estado'];
                }

                // Sincronizar datos con usuario existente
                if ($empleado->user_id && $empleado->user) {
                    $userUpdates = [];
                    if (!empty($data['nombres']) || !empty($data['apellidos'])) {
                        $userUpdates['name'] = trim(($data['nombres'] ?? $empleado->nombres) . ' ' . ($data['apellidos'] ?? $empleado->apellidos));
                    }
                    if (isset($data['telefono'])) {
                        $userUpdates['telefono'] = $data['telefono'];
                    }
                    if (isset($data['sucursal_id'])) {
                        $userUpdates['sucursal_id'] = !empty($data['sucursal_id']) ? (int) $data['sucursal_id'] : null;
                    }
                    if (!empty($data['password'])) {
                        $userUpdates['password'] = \Illuminate\Support\Facades\Hash::make($data['password']);
                    }
                    if (isset($data['estado'])) {
                        $userUpdates['status'] = $data['estado'] ? 'activo' : 'inactivo';
                    }
                    if (!empty($userUpdates)) {
                        $empleado->user->update($userUpdates);
                    }
                    if (!empty($data['rol'])) {
                        $this->assignUserRole($empleado->user, $data['rol'], $empleado->empresa_id);
                    }
                } elseif (!empty($data['crear_usuario']) || (!empty($data['email']) && !$empleado->user_id)) {
                    // Crear usuario si no existía
                    $email = strtolower(trim($data['email'] ?? $empleado->email));
                    if ($email) {
                        $existingUser = \App\Models\User::where('email', $email)->first();

                        if ($existingUser && $existingUser->empresa_id === $empleado->empresa_id) {
                            $data['user_id'] = $existingUser->id;
                        } elseif (!$existingUser) {
                            $plainPassword = !empty($data['password']) ? $data['password'] : '12345678';
                            $roleName = !empty($data['rol']) ? $data['rol'] : 'Vendedor';

                            $user = \App\Models\User::create([
                                'name' => trim(($data['nombres'] ?? $empleado->nombres) . ' ' . ($data['apellidos'] ?? $empleado->apellidos)),
                                'email' => $email,
                                'username' => $this->generateUniqueUsername($data['nombres'] ?? $empleado->nombres, $data['apellidos'] ?? $empleado->apellidos),
                                'telefono' => $data['telefono'] ?? $empleado->telefono,
                                'status' => 'activo',
                                'empresa_id' => $empleado->empresa_id,
                                'sucursal_id' => !empty($data['sucursal_id']) ? (int) $data['sucursal_id'] : $empleado->sucursal_id,
                                'password' => \Illuminate\Support\Facades\Hash::make($plainPassword),
                                'sueldo_base' => $data['sueldo_base'] ?? $empleado->sueldo_base,
                            ]);

                            $this->assignUserRole($user, $roleName, $empleado->empresa_id);
                            $data['user_id'] = $user->id;
                        }
                    }
                }

                unset($data['crear_usuario'], $data['password'], $data['rol']);

                $empleado->update($data);
                return $empleado->fresh(['sucursal', 'user']);
            } finally {
                static::$isSyncing = false;
            }
        });
    }

    /**
     * Generar un username único para el usuario del empleado.
     */
    protected function generateUniqueUsername(string $nombres, string $apellidos): string
    {
        $base = strtolower(\Illuminate\Support\Str::slug($nombres . '.' . $apellidos));
        if (empty($base)) {
            $base = 'empleado.' . \Illuminate\Support\Str::random(4);
        }

        $username = $base;
        $counter = 1;
        while (\App\Models\User::where('username', $username)->exists()) {
            $username = $base . $counter;
            $counter++;
        }

        return $username;
    }

    /**
     * Asignar rol al usuario respetando el empresa_id multi-tenant de Spatie.
     */
    protected function assignUserRole(\App\Models\User $user, string $roleName, int $empresaId): void
    {
        setPermissionsTeamId($empresaId);

        $roleNames = match ($roleName) {
            'Técnico y Vendedor', 'Tecnico y Vendedor', 'Técnico y Vendedor (Híbrido)' => ['Técnico', 'Vendedor'],
            default => [$roleName],
        };

        DB::connection('landlord')->table('model_has_roles')
            ->where('model_type', get_class($user))
            ->where('model_id', $user->id)
            ->delete();

        foreach ($roleNames as $name) {
            $role = \App\Models\Role::on('landlord')
                ->where('name', $name)
                ->where(function ($q) use ($empresaId) {
                    $q->where('empresa_id', $empresaId)->orWhereNull('empresa_id');
                })
                ->first();

            if (!$role) {
                $role = \App\Models\Role::on('landlord')->where('name', $name)->first();
            }

            if ($role) {
                $insertData = [
                    'role_id' => $role->id,
                    'model_type' => get_class($user),
                    'model_id' => $user->id,
                ];

                if (\Illuminate\Support\Facades\Schema::connection('landlord')->hasColumn('model_has_roles', 'empresa_id')) {
                    $insertData['empresa_id'] = $empresaId;
                } elseif (\Illuminate\Support\Facades\Schema::connection('landlord')->hasColumn('model_has_roles', 'team_id')) {
                    $insertData['team_id'] = $empresaId;
                }

                DB::connection('landlord')->table('model_has_roles')->insert($insertData);
            }
        }

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Alternar estado activo / inactivo de un empleado.
     */
    public function toggleStatus(Empleado $empleado): bool
    {
        $empleado->estado = !$empleado->estado;
        $empleado->save();
        return $empleado->estado;
    }

    /**
     * Eliminar un empleado (si tiene ventas asociadas se previene o desactiva).
     */
    public function delete(Empleado $empleado): bool
    {
        if ($empleado->sales()->exists() || $empleado->comisionPagos()->exists()) {
            // Si ya tiene historial comercial, no destruir para integridad referencial, desactivar
            $empleado->update(['estado' => false]);
            return false;
        }

        return (bool) $empleado->delete();
    }

    /**
     * Resumen estadístico de empleados.
     */
    public function getStats(?int $empresaId = null, ?int $sucursalId = null): array
    {
        $base = Empleado::query()
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->when($sucursalId && $sucursalId !== 'all', fn ($q) => $q->where('sucursal_id', (int) $sucursalId));

        $total = (clone $base)->count();
        $activos = (clone $base)->where('estado', true)->count();
        $inactivos = $total - $activos;
        $promedioComision = (float) ((clone $base)->where('estado', true)->avg('porcentaje_comision') ?? 0);

        return [
            'total' => $total,
            'activos' => $activos,
            'inactivos' => $inactivos,
            'promedio_comision' => round($promedioComision, 2),
        ];
    }

    /**
     * Divide un nombre completo en nombres y apellidos.
     *
     * @param string $fullName
     * @return array{nombres: string, apellidos: string}
     */
    public function splitFullName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName));
        $parts = array_values(array_filter($parts, fn ($p) => $p !== ''));

        if (empty($parts)) {
            return ['nombres' => 'Usuario', 'apellidos' => ''];
        }

        if (count($parts) === 1) {
            return ['nombres' => $parts[0], 'apellidos' => ''];
        }

        if (count($parts) === 2) {
            return ['nombres' => $parts[0], 'apellidos' => $parts[1]];
        }

        if (count($parts) === 3) {
            return ['nombres' => $parts[0], 'apellidos' => $parts[1] . ' ' . $parts[2]];
        }

        $mid = count($parts) === 4 ? 2 : (int) ceil(count($parts) / 2);
        return [
            'nombres' => implode(' ', array_slice($parts, 0, $mid)),
            'apellidos' => implode(' ', array_slice($parts, $mid)),
        ];
    }

    /**
     * Sincroniza un Usuario individual con su registro de Empleado correspondiente.
     */
    public function syncUserToEmployee(\App\Models\User $user): Empleado
    {
        if (static::$isSyncing) {
            return Empleado::withoutGlobalScope('multitenancy')->where('user_id', $user->id)->first() ?? new Empleado();
        }

        static::$isSyncing = true;
        try {
            $split = $this->splitFullName($user->name ?: ($user->username ?: 'Usuario'));

            // Buscar empleado existente por user_id o por email dentro de la misma empresa
            $empleado = Empleado::withoutGlobalScope('multitenancy')
                ->where('user_id', $user->id)
                ->first();

            if (!$empleado && !empty($user->email)) {
                $empleado = Empleado::withoutGlobalScope('multitenancy')
                    ->where('empresa_id', $user->empresa_id ?? 1)
                    ->where('email', strtolower(trim($user->email)))
                    ->first();
            }

            // Determinar cargo basándose en los roles del usuario
            $roleNames = $user->roles->pluck('name')->toArray();
            $primaryRole = $roleNames[0] ?? null;

            $cargo = match ($primaryRole) {
                'Super Administrador', 'super-admin', 'Super Admin' => 'Super Administrador',
                'Administrador' => 'Administrador',
                'TECNICO DE REPARACIONES', 'Técnico' => 'Técnico de Reparaciones',
                'RECEPCION' => 'Recepción',
                'Vendedor' => 'Vendedor',
                default => $primaryRole ?: 'Colaborador',
            };

            $isTecnico = false;
            foreach ($roleNames as $r) {
                if (str_contains(mb_strtolower($r), 'téc') || str_contains(mb_strtolower($r), 'tec')) {
                    $isTecnico = true;
                    break;
                }
            }

            $isActive = $user->status === 'activo';

            if ($empleado) {
                $empleado->user_id = $user->id;
                $empleado->empresa_id = $user->empresa_id ?? $empleado->empresa_id;
                $empleado->sucursal_id = $user->sucursal_id ?? $empleado->sucursal_id;
                $empleado->nombres = $split['nombres'];
                $empleado->apellidos = $split['apellidos'];

                if (!empty($user->email)) {
                    $empleado->email = strtolower(trim($user->email));
                }
                if (!empty($user->telefono)) {
                    $empleado->telefono = $user->telefono;
                }
                if (empty($empleado->cargo) || $empleado->cargo === 'Colaborador') {
                    $empleado->cargo = $cargo;
                }
                if (($user->sueldo_base ?? 0) > 0 && ($empleado->sueldo_base ?? 0) <= 0) {
                    $empleado->sueldo_base = (float) $user->sueldo_base;
                }

                $empleado->estado = $isActive;
                $empleado->save();

                return $empleado;
            }

            // Si no existe, crear nuevo empleado asociado
            return Empleado::create([
                'empresa_id' => $user->empresa_id ?? 1,
                'sucursal_id' => $user->sucursal_id,
                'user_id' => $user->id,
                'nombres' => $split['nombres'],
                'apellidos' => $split['apellidos'],
                'email' => !empty($user->email) ? strtolower(trim($user->email)) : null,
                'telefono' => $user->telefono,
                'cargo' => $cargo,
                'sueldo_base' => (float) ($user->sueldo_base ?? 0),
                'porcentaje_comision' => 0.00,
                'tipo_comision' => 'porcentaje',
                'comision_aplica_a' => 'subtotal',
                'porcentaje_comision_reparacion' => $isTecnico ? 10.00 : 0.00,
                'tipo_comision_reparacion' => 'porcentaje',
                'comision_reparacion_aplica_a' => 'mano_obra',
                'estado' => $isActive,
                'fecha_ingreso' => $user->created_at ? $user->created_at->toDateString() : now()->toDateString(),
            ]);
        } finally {
            static::$isSyncing = false;
        }
    }

    /**
     * Sincroniza en lote todos los usuarios hacia el módulo de empleados.
     *
     * @param int|null $empresaId
     * @return array{total: int, created: int, updated: int}
     */
    public function syncUsersToEmployees(?int $empresaId = null): array
    {
        $query = \App\Models\User::query()
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId));

        $users = $query->with('roles')->get();

        $created = 0;
        $updated = 0;

        foreach ($users as $user) {
            $alreadyExists = Empleado::withoutGlobalScope('multitenancy')
                ->where('user_id', $user->id)
                ->exists();

            $this->syncUserToEmployee($user);

            if ($alreadyExists) {
                $updated++;
            } else {
                $created++;
            }
        }

        return [
            'total' => $users->count(),
            'created' => $created,
            'updated' => $updated,
        ];
    }
}

