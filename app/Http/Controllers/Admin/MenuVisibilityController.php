<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Services\MenuVisibilityService;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

/**
 * Panel del Super Administrador con dos candados sobre el menú lateral:
 *  1. Por empresa: lo que contrató cada cliente.
 *  2. Por rol: segmentación de los usuarios dentro de cada empresa.
 * Ocultar es puramente visual: no cambia permisos ni el acceso por URL.
 */
class MenuVisibilityController extends Controller
{
    /** Roles de Super Administrador: siempre ven todo, no se configuran. */
    private const SUPER_ROLES = ['Super Administrador', 'super-admin', 'Super Admin', 'super_admin'];

    public function index(Request $request)
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        $empresas = Empresa::withoutTenant()->orderBy('razon_social')
            ->get(['id', 'razon_social', 'nombre_comercial']);
        $roles = Role::whereNotIn('name', self::SUPER_ROLES)->orderBy('name')->get(['id', 'name']);

        return inertia('admin/configuracion/menu-visibilidad', [
            'empresas' => $empresas->map(fn ($e) => [
                'id' => $e->id,
                'nombre' => $e->nombre_comercial ?: $e->razon_social,
            ])->values(),
            'roles' => $roles->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])->values(),
            // id => { clave: false } solo con lo oculto (ausencia = visible)
            'empresaHidden' => $empresas->mapWithKeys(fn ($e) => [
                $e->id => array_fill_keys(MenuVisibilityService::empresaKeys($e->id), false),
            ]),
            'roleHidden' => $roles->mapWithKeys(fn ($r) => [
                $r->id => array_fill_keys(MenuVisibilityService::roleKeys($r->id), false),
            ]),
        ]);
    }

    public function updateEmpresa(Request $request, int $empresa)
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        $empresa = Empresa::withoutTenant()->findOrFail($empresa);
        MenuVisibilityService::syncEmpresa($empresa->id, $this->hiddenKeys($request));

        return $this->ok();
    }

    public function updateRole(Request $request, int $role)
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        $role = Role::findOrFail($role);
        abort_if(in_array($role->name, self::SUPER_ROLES, true), 422, __('The Super Administrator role always sees everything.'));

        MenuVisibilityService::syncRole($role->id, $this->hiddenKeys($request));

        return $this->ok();
    }

    /** @return string[] claves ocultas */
    private function hiddenKeys(Request $request): array
    {
        $validated = $request->validate([
            'hidden' => ['present', 'array', 'max:200'],
            'hidden.*' => ['string', 'max:100', 'regex:/^[a-z_]+(\.[a-z_]+)*$/'],
        ]);

        return $validated['hidden'];
    }

    private function ok()
    {
        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Menu visibility updated.'),
        ]);
    }
}
