<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuVisibilitySetting;
use Illuminate\Http\Request;

/**
 * Panel para que el superadmin oculte/muestre módulos y submódulos del menú
 * lateral. Config global (no por rol ni por usuario). Ocultar es puramente
 * visual: no cambia permisos ni el acceso por URL.
 */
class MenuVisibilityController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        return inertia('admin/configuracion/menu-visibilidad', [
            'visibility' => MenuVisibilitySetting::map(),
        ]);
    }

    public function update(Request $request)
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        $validated = $request->validate([
            'visibility' => ['array'],
            'visibility.*' => ['boolean'],
        ]);

        foreach ($validated['visibility'] ?? [] as $menuKey => $visible) {
            MenuVisibilitySetting::updateOrCreate(
                ['menu_key' => $menuKey],
                ['visible' => (bool) $visible],
            );
        }

        MenuVisibilitySetting::bustCache();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Menu visibility updated.'),
        ]);
    }
}
