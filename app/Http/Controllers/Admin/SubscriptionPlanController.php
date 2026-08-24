<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionPlanController extends Controller
{
    private function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (!$user) return '$';
        $empresa = $user->empresa ?? ($user->empresa_id ? \App\Models\Empresa::find($user->empresa_id) : null);
        if ($empresa && $empresa->pais_id) {
            $pais = \App\Models\Pais::find($empresa->pais_id);
            if ($pais && !empty($pais->simbolo_moneda)) {
                return $pais->simbolo_moneda;
            }
        }
        return '$';
    }

    public function index(Request $request)
    {
        SubscriptionPlan::ensureDefaultPlansExist();

        $planes = SubscriptionPlan::withCount(['subscriptions' => function ($q) {
            $q->whereIn('estado', ['active', 'trial']);
        }])
        ->orderBy('orden', 'asc')
        ->orderBy('id', 'asc')
        ->get();

        // Estadísticas para el header del módulo
        $totalPlanes = $planes->count();
        $planesActivos = $planes->where('activo', true)->count();
        $planesConPromo = $planes->where('tiene_promocion', true)->count();
        $totalSuscripciones = Subscription::whereIn('estado', ['active', 'trial'])->count();

        return Inertia::render('admin/Planes/Index', [
            'planes' => $planes,
            'stats' => [
                'totalPlanes' => $totalPlanes,
                'planesActivos' => $planesActivos,
                'planesConPromo' => $planesConPromo,
                'totalSuscripciones' => $totalSuscripciones,
            ],
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:500',
            'precio_regular_mensual' => 'required|numeric|min:0',
            'precio_promocional_mensual' => 'nullable|numeric|min:0',
            'tiene_promocion' => 'boolean',
            'meses_duracion_promocion' => 'nullable|integer|min:1|max:36',
            'badge_promocion' => 'nullable|string|max:100',
            'destacado' => 'boolean',
            'orden' => 'nullable|integer|min:0',
            'precio_3_meses' => 'nullable|numeric|min:0',
            'precio_6_meses' => 'nullable|numeric|min:0',
            'precio_12_meses' => 'nullable|numeric|min:0',
            'precio_sucursal_extra_mensual' => 'nullable|numeric|min:0',
            'sucursales_incluidas' => 'nullable|integer|min:1',
            'modulos_incluidos' => 'nullable|array',
            'activo' => 'boolean',
        ]);

        // Auto-calcular ciclos si no fueron provistos explícitamente
        $precioRegular = (float) ($validated['precio_regular_mensual'] ?? 0);
        $precioPromo = (float) ($validated['precio_promocional_mensual'] ?? $precioRegular);

        if (empty($validated['precio_3_meses'])) {
            $validated['precio_3_meses'] = round($precioPromo * 3, 2);
        }
        if (empty($validated['precio_6_meses'])) {
            $validated['precio_6_meses'] = round($precioPromo * 6, 2);
        }
        if (empty($validated['precio_12_meses'])) {
            $validated['precio_12_meses'] = round($precioPromo * 12, 2);
        }
        if (!isset($validated['sucursales_incluidas'])) {
            $validated['sucursales_incluidas'] = 1;
        }
        if (!isset($validated['modulos_incluidos'])) {
            $validated['modulos_incluidos'] = ['todos'];
        }

        $plan = SubscriptionPlan::create($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $plan,
                'message' => __('Plan de suscripción creado exitosamente.'),
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Plan de suscripción creado exitosamente.'),
        ]);
    }

    public function update(Request $request, SubscriptionPlan $plane)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:500',
            'precio_regular_mensual' => 'required|numeric|min:0',
            'precio_promocional_mensual' => 'nullable|numeric|min:0',
            'tiene_promocion' => 'boolean',
            'meses_duracion_promocion' => 'nullable|integer|min:1|max:36',
            'badge_promocion' => 'nullable|string|max:100',
            'destacado' => 'boolean',
            'orden' => 'nullable|integer|min:0',
            'precio_3_meses' => 'nullable|numeric|min:0',
            'precio_6_meses' => 'nullable|numeric|min:0',
            'precio_12_meses' => 'nullable|numeric|min:0',
            'precio_sucursal_extra_mensual' => 'nullable|numeric|min:0',
            'sucursales_incluidas' => 'nullable|integer|min:1',
            'modulos_incluidos' => 'nullable|array',
            'activo' => 'boolean',
        ]);

        $plane->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $plane,
                'message' => __('Plan actualizado correctamente.'),
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Plan actualizado correctamente.'),
        ]);
    }

    public function togglePromo(Request $request, SubscriptionPlan $plane)
    {
        $plane->update([
            'tiene_promocion' => !$plane->tiene_promocion,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $plane,
                'message' => __('Estado de promoción actualizado.'),
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Estado de promoción actualizado.'),
        ]);
    }

    public function toggleStatus(Request $request, SubscriptionPlan $plane)
    {
        $plane->update([
            'activo' => !$plane->activo,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $plane,
                'message' => __('Estado del plan actualizado.'),
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Estado del plan actualizado.'),
        ]);
    }

    public function toggleDestacado(Request $request, SubscriptionPlan $plane)
    {
        $plane->update([
            'destacado' => !$plane->destacado,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $plane,
                'message' => __('Destacado del plan actualizado.'),
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Destacado del plan actualizado.'),
        ]);
    }

    public function destroy(Request $request, SubscriptionPlan $plane)
    {
        if ($plane->subscriptions()->count() > 0) {
            $plane->update(['activo' => false]);
            return back()->with('notification', [
                'type' => 'warning',
                'message' => __('El plan tiene suscripciones asociadas y ha sido desactivado en lugar de eliminarse.'),
            ]);
        }

        $plane->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Plan eliminado correctamente.'),
        ]);
    }
}
