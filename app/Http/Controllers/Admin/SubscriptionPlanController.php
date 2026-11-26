<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use App\Models\WhatsAppPricingSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
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
        ->get()
        ->map(function (SubscriptionPlan $plan) {
            $plan->setAttribute('cupos_ocupados', $plan->activeSubscriptionsCount());
            $plan->setAttribute('cupos_restantes', $plan->remainingSlots());
            $plan->setAttribute('esta_expirado', $plan->isExpired());
            return $plan;
        });

        // Estadísticas para el header del módulo
        $totalPlanes = $planes->count();
        $planesActivos = $planes->where('activo', true)->count();
        $planesConPromo = $planes->where('tiene_promocion', true)->count();
        $totalSuscripciones = Subscription::whereIn('estado', ['active', 'trial'])->count();

        return Inertia::render('admin/Planes/Index', [
            'planes' => $planes,
            'pricingSetting' => Schema::hasTable('whatsapp_pricing_settings')
                ? WhatsAppPricingSetting::current()
                : [
                    'costo_por_mensaje_usd' => 0.005,
                    'mensajes_gratis_defecto' => 60,
                    'min_compra_mensajes' => 100,
                    'paquetes_recarga' => [100, 500, 1000, 5000],
                    'cobro_activo' => true,
                ],
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
            'ciclo_meses' => 'nullable|integer|min:0|max:36',
            'max_suscripciones' => 'nullable|integer|min:1|max:10000',
            'fecha_expiracion' => 'nullable|date',
            'precio_3_meses' => 'nullable|numeric|min:0',
            'precio_6_meses' => 'nullable|numeric|min:0',
            'precio_12_meses' => 'nullable|numeric|min:0',
            'precio_sucursal_extra_mensual' => 'nullable|numeric|min:0',
            'costo_por_mensaje_usd' => 'nullable|numeric|min:0.0001|max:10',
            'mensajes_incluidos_mes' => 'nullable|integer|min:0|max:100000',
            'max_mensajes_acumulados' => 'nullable|integer|min:0|max:100000',
            'min_compra_mensajes' => 'nullable|integer|min:100|max:100000',
            'sucursales_incluidas' => 'nullable|integer|min:1',
            'modulos_incluidos' => 'nullable|array',
            'activo' => 'boolean',
        ]);

        // Asignar valores por defecto para campos mensuales
        $precioRegular = (float) ($validated['precio_regular_mensual'] ?? 0);
        $precioPromo = (float) ($validated['precio_promocional_mensual'] ?? $precioRegular);

        $validated['precio_3_meses'] = $validated['precio_3_meses'] ?? $precioPromo;
        $validated['precio_6_meses'] = $validated['precio_6_meses'] ?? $precioPromo;
        $validated['precio_12_meses'] = $validated['precio_12_meses'] ?? $precioPromo;

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
            'ciclo_meses' => 'nullable|integer|min:0|max:36',
            'max_suscripciones' => 'nullable|integer|min:1|max:10000',
            'fecha_expiracion' => 'nullable|date',
            'precio_3_meses' => 'nullable|numeric|min:0',
            'precio_6_meses' => 'nullable|numeric|min:0',
            'precio_12_meses' => 'nullable|numeric|min:0',
            'precio_sucursal_extra_mensual' => 'nullable|numeric|min:0',
            'costo_por_mensaje_usd' => 'nullable|numeric|min:0.0001|max:10',
            'mensajes_incluidos_mes' => 'nullable|integer|min:0|max:100000',
            'max_mensajes_acumulados' => 'nullable|integer|min:0|max:100000',
            'min_compra_mensajes' => 'nullable|integer|min:100|max:100000',
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

    /**
     * Actualizar configuración global de precios de mensajería WhatsApp.
     */
    public function updateMessagingPricing(Request $request)
    {
        $validated = $request->validate([
            'costo_por_mensaje_usd' => 'required|numeric|min:0.0001|max:10',
            'mensajes_gratis_defecto' => 'required|integer|min:0|max:100000',
            'max_mensajes_acumulados_defecto' => 'nullable|integer|min:0|max:100000',
            'min_compra_mensajes' => 'required|integer|min:100|max:100000',
            'paquetes_recarga' => 'nullable|array',
            'paquetes_recarga.*' => 'integer|min:100',
            'cobro_activo' => 'boolean',
            'aplicar_a_todos_los_planes' => 'boolean',
        ]);

        $setting = WhatsAppPricingSetting::current();
        $maxAcum = (int) ($validated['max_mensajes_acumulados_defecto'] ?? $setting->max_mensajes_acumulados_defecto ?? 1000);
        $setting->update([
            'costo_por_mensaje_usd' => (float) $validated['costo_por_mensaje_usd'],
            'mensajes_gratis_defecto' => (int) $validated['mensajes_gratis_defecto'],
            'max_mensajes_acumulados_defecto' => $maxAcum,
            'min_compra_mensajes' => (int) $validated['min_compra_mensajes'],
            'paquetes_recarga' => $validated['paquetes_recarga'] ?? $setting->paquetes_recarga,
            'cobro_activo' => (bool) ($validated['cobro_activo'] ?? true),
        ]);

        if (! empty($validated['aplicar_a_todos_los_planes'])) {
            SubscriptionPlan::query()->update([
                'costo_por_mensaje_usd' => (float) $validated['costo_por_mensaje_usd'],
                'mensajes_incluidos_mes' => (int) $validated['mensajes_gratis_defecto'],
                'max_mensajes_acumulados' => $maxAcum,
                'min_compra_mensajes' => (int) $validated['min_compra_mensajes'],
            ]);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $setting->fresh(),
                'message' => __('Configuración de precios de mensajería actualizada.'),
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Configuración de precios de mensajería actualizada.'),
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
