<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    private function isSuperAdmin(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $user->id === 1
            || $user->hasRole('Super Administrador')
            || $user->hasRole('super-admin')
            || $user->hasRole('Super Admin')
            || \Illuminate\Support\Facades\DB::table('model_has_roles')
                ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_id', $user->id)
                ->whereIn('roles.name', ['Super Administrador', 'super-admin', 'Super Admin'])
                ->exists();
    }

    public function index(Request $request)
    {
        Gate::authorize('viewAny', User::class);

        $search = $request->input('search');
        $status = $request->input('status');
        $roleName = $request->input('role');
        $empresaId = $request->input('empresa_id');
        $sucursalId = $request->input('sucursal_id');
        $perPage = $request->input('perPage', 10);

        $query = User::with(['empresa', 'sucursal', 'roles', 'paisTelefono']);

        $currentUser = auth()->user();
        $isSuperAdmin = $this->isSuperAdmin($currentUser);

        if (! $isSuperAdmin) {
            if ($currentUser?->empresa_id) {
                $query->where('empresa_id', $currentUser->empresa_id);
            }
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($empresaId && $isSuperAdmin) {
            $query->where('empresa_id', $empresaId);
        }

        if ($sucursalId) {
            $query->where('sucursal_id', $sucursalId);
        }

        if ($roleName) {
            $query->role($roleName);
        }

        $users = $query->latest()->paginate($perPage)->withQueryString();

        $statsQuery = User::query();
        if (! $isSuperAdmin) {
            if ($currentUser?->empresa_id) {
                $statsQuery->where('empresa_id', $currentUser->empresa_id);
            }
        }

        $stats = [
            'total' => (clone $statsQuery)->count(),
            'activos' => (clone $statsQuery)->where('status', 'activo')->count(),
            'inactivos' => (clone $statsQuery)->where('status', 'inactivo')->count(),
            'verificados' => (clone $statsQuery)->where(function ($q) {
                $q->whereNotNull('whatsapp_verified_at')
                  ->orWhereNotNull('email_verified_at');
            })->count(),
        ];

        $rolesQuery = DB::connection('landlord')->table('roles')
            ->whereNotIn('name', ['Super Administrador', 'super-admin', 'Super Admin'])
            ->orderBy('name');

        if (! $isSuperAdmin && $currentUser?->empresa_id) {
            $rolesQuery->where(function ($sq) use ($currentUser) {
                $sq->where('empresa_id', $currentUser->empresa_id)
                   ->orWhereNull('empresa_id');
            });
        }

        $roles = $rolesQuery->get(['id', 'name', 'empresa_id']);

        $sucursalesQuery = DB::connection('landlord')->table('sucursales')
            ->where('status', true)
            ->orderBy('nombre');

        if (! $isSuperAdmin && $currentUser?->empresa_id) {
            $sucursalesQuery->where('empresa_id', $currentUser->empresa_id);
        }

        $sucursales = $sucursalesQuery->get(['id', 'nombre', 'empresa_id']);

        return inertia('admin/Usuarios/Index', [
            'users' => UserResource::collection($users),
            'stats' => $stats,
            'roles' => $roles,
            'empresas' => Empresa::where('status', true)->orderBy('razon_social')->get(['id', 'razon_social']),
            'sucursales' => $sucursales,
            'paises' => Pais::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico']),
            'filters' => $request->only(['search', 'status', 'role', 'empresa_id', 'sucursal_id', 'perPage']),
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();
        $plainPassword = $validated['password'] ?? '';
        $sendWelcome = ! empty($validated['send_welcome_whatsapp']);

        try {
            $currentUser = auth()->user();
            $isSuperAdmin = $this->isSuperAdmin($currentUser);

            if (! $isSuperAdmin) {
                if (empty($validated['empresa_id'])) {
                    $validated['empresa_id'] = $currentUser?->empresa_id;
                }
                if (empty($validated['sucursal_id'])) {
                    $validated['sucursal_id'] = $currentUser?->sucursal_id;
                }
            }

            $validated['password'] = Hash::make($validated['password']);
            unset($validated['send_welcome_whatsapp']);

            $user = User::create($validated);

            if (isset($validated['roles'])) {
                $this->syncUserRoles($user, $validated['roles']);
            }

            $whatsappSent = false;

            if ($sendWelcome && ! empty($user->telefono)) {
                try {
                    $empresa = $user->empresa ?? ($user->empresa_id ? Empresa::find($user->empresa_id) : $currentUser?->empresa);
                    $sucursal = $user->sucursal ?? ($user->sucursal_id ? Sucursal::find($user->sucursal_id) : null);
                    $empresaNombre = $empresa?->razon_social ?? config('app.name', 'Servitec');
                    $sucursalNombre = $sucursal?->nombre ?? '';

                    $fullPhone = $this->formatPhoneNumber($user);

                    $loginUrl = config('app.url', url('/'));

                    $message = "🌟 *¡Bienvenido(a) a Fix Sale!* 🌟\n\n"
                        ."Hola *{$user->name}*, nos alegra darte la bienvenida a nuestra plataforma. Tu cuenta de acceso ha sido creada exitosamente.\n\n"
                        ."🔑 *Tus Credenciales de Acceso:*\n"
                        ."━━━━━━━━━━━━━━━━━━━━\n"
                        ."👤 *Nombre:* {$user->name}\n"
                        ."📧 *Correo:* {$user->email}\n"
                        ."🏷️ *Usuario:* ".($user->username ?: $user->email)."\n"
                        ."🔒 *Contraseña:* {$plainPassword}\n"
                        ."🏢 *Empresa:* {$empresaNombre}\n"
                        .(! empty($sucursalNombre) ? "🏬 *Sucursal:* {$sucursalNombre}\n" : '')
                        ."━━━━━━━━━━━━━━━━━━━━\n\n"
                        ."🌐 *Accede al sistema aquí:*\n"
                        ."{$loginUrl}/login\n\n"
                        ."💡 *Recomendación de Seguridad:*\n"
                        ."Por tu seguridad, te sugerimos cambiar tu contraseña al ingresar por primera vez.\n\n"
                        .'¡Cualquier duda o asistencia, estamos a tu disposición!';

                    if ($empresa) {
                        $whatsappService = \App\Services\WhatsAppService::forCompanyOwn($empresa);
                        $res = $whatsappService->sendMessage($fullPhone, $message);
                        if ($res) {
                            $whatsappSent = true;
                        }
                    }
                } catch (\Exception $we) {
                    Log::error('Error al enviar WhatsApp de bienvenida: '.$we->getMessage());
                }
            }

            $message = __('User created successfully.');
            if ($sendWelcome) {
                if ($whatsappSent) {
                    $message .= ' '.__('Bienvenida enviada exitosamente por WhatsApp.');
                } else {
                    $message .= ' '.__('(No se pudo enviar el mensaje por WhatsApp, verifique la conexión del servicio).');
                }
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => $message,
            ]);
        } catch (\Exception $e) {
            Log::error('Error al crear usuario: '.$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error creating the user. Please try again.'),
            ]);
        }
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $validated = $request->validated();

        try {
            if (! empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $user->update($validated);

            if (isset($validated['roles'])) {
                $this->syncUserRoles($user, $validated['roles']);
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('User updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar usuario {$user->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error updating the user. Please try again.'),
            ]);
        }
    }

    public function destroy(User $user)
    {
        try {
            $user->delete();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('User deleted successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar usuario {$user->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error deleting the user. Please try again.'),
            ]);
        }
    }

    public function toggleStatus(User $user)
    {
        try {
            $user->status = $user->status === 'activo' ? 'inactivo' : 'activo';
            $user->save();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Status updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al cambiar estado de usuario {$user->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error updating the status. Please try again.'),
            ]);
        }
    }

    /**
     * Formatea el número de teléfono agregando el código telefónico del país de la empresa/usuario si es necesario.
     */
    private function formatPhoneNumber(User $user): string
    {
        $phone = trim($user->telefono ?? '');
        if (empty($phone)) {
            return '';
        }

        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = substr($cleanPhone, 1);
        }

        // Obtener el código de país (1º país de teléfono, 2º empresa del usuario, 3º empresa del usuario autenticado)
        $user->loadMissing(['paisTelefono', 'empresa.pais']);
        $currentUser = auth()->user();
        if ($currentUser) {
            $currentUser->loadMissing('empresa.pais');
        }

        $codigoPais = $user->paisTelefono?->codigo_telefonico
            ?? $user->empresa?->pais?->codigo_telefonico
            ?? $currentUser?->empresa?->pais?->codigo_telefonico
            ?? '';

        $cleanCodigo = preg_replace('/[^0-9]/', '', $codigoPais);

        if (! empty($cleanCodigo)) {
            if (str_starts_with($cleanPhone, $cleanCodigo)) {
                return $cleanPhone;
            }

            return $cleanCodigo.$cleanPhone;
        }

        // Fallback: verificar si ya incluye algún código de país conocido al inicio
        $codigosComunes = ['593', '502', '503', '504', '505', '506', '507', '591', '595', '598', '52', '58', '57', '34', '54', '56', '51', '1'];
        foreach ($codigosComunes as $code) {
            if (str_starts_with($cleanPhone, $code) && strlen($cleanPhone) >= (strlen($code) + 7)) {
                return $cleanPhone;
            }
        }

        return $cleanPhone;
    }

    /**
     * Sincroniza los roles del usuario asegurando el team_id (empresa_id) correcto en multi-tenancy.
     */
    private function syncUserRoles(User $user, array $roleNames): void
    {
        $targetEmpresaId = $user->empresa_id ?: 1;
        setPermissionsTeamId($targetEmpresaId);

        $roleModels = collect();
        foreach ($roleNames as $roleName) {
            // Buscar específicamente el rol de la empresa del usuario
            $role = \App\Models\Role::on('landlord')
                ->where('name', $roleName)
                ->where('empresa_id', $targetEmpresaId)
                ->first();

            if (! $role) {
                $role = \App\Models\Role::on('landlord')
                    ->where('name', $roleName)
                    ->whereNull('empresa_id')
                    ->first();
            }

            if (! $role) {
                $role = \App\Models\Role::on('landlord')
                    ->where('name', $roleName)
                    ->first();
            }

            if ($role) {
                $roleModels->push($role);
            }
        }

        DB::connection('landlord')->table('model_has_roles')
            ->where('model_type', get_class($user))
            ->where('model_id', $user->id)
            ->delete();

        foreach ($roleModels as $roleModel) {
            DB::connection('landlord')->table('model_has_roles')->insert([
                'role_id' => $roleModel->id,
                'model_type' => get_class($user),
                'model_id' => $user->id,
                'empresa_id' => $targetEmpresaId,
            ]);
        }

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
