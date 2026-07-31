<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\SubscriptionPlan;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SubscriptionController extends Controller
{
    /**
     * Panel principal de Suscripción para la empresa actual.
     */
    public function index(\App\Services\BcvRateService $bcvService)
    {
        $user = auth()->user();
        $empresa = $user->empresa;

        if (! $empresa) {
            abort(404, 'Empresa no encontrada.');
        }

        $plan = SubscriptionPlan::first();
        $totalSucursales = $empresa->sucursales()->count();

        $pagos = SubscriptionPayment::where('empresa_id', $empresa->id)
            ->with(['user', 'aprobador'])
            ->orderBy('created_at', 'desc')
            ->get();

        $suscripcionActiva = Subscription::where('empresa_id', $empresa->id)
            ->orderBy('id', 'desc')
            ->first();

        $bcvRate = $bcvService->getRate() ?? 36.50; // Tasa por defecto de respaldo si falla el API

        // Opciones de cálculo de precios
        $opcionesPrecios = [
            3 => [
                'meses' => 3,
                'subtotal_plan' => $plan?->precio_3_meses ?? 89.00,
                'precio_mensual_promedio' => round(($plan?->precio_3_meses ?? 89.00) / 3, 2),
                'total' => $plan ? $plan->calcularPrecio(3, max(1, $totalSucursales)) : 89.00,
            ],
            6 => [
                'meses' => 6,
                'subtotal_plan' => $plan?->precio_6_meses ?? 159.00,
                'precio_mensual_promedio' => round(($plan?->precio_6_meses ?? 159.00) / 6, 2),
                'total' => $plan ? $plan->calcularPrecio(6, max(1, $totalSucursales)) : 159.00,
            ],
            12 => [
                'meses' => 12,
                'subtotal_plan' => $plan?->precio_12_meses ?? 288.00,
                'precio_mensual_promedio' => round(($plan?->precio_12_meses ?? 288.00) / 12, 2),
                'total' => $plan ? $plan->calcularPrecio(12, max(1, $totalSucursales)) : 288.00,
            ],
        ];

        return inertia('admin/subscription/index', [
            'empresa' => [
                'id' => $empresa->id,
                'razon_social' => $empresa->razon_social,
                'subscription_status' => $empresa->subscription_status,
                'trial_ends_at' => $empresa->trial_ends_at?->format('Y-m-d H:i:s'),
                'subscription_expires_at' => $empresa->subscription_expires_at?->format('Y-m-d H:i:s'),
                'dias_restantes' => $empresa->dias_restantes_suscripcion,
                'estado_legible' => $empresa->estado_suscripcion_legible,
                'is_exempt' => $empresa->isExemptFromSubscription(),
                'max_sucursales' => $empresa->max_sucursales ?? 1,
                'sucursales_activas' => $totalSucursales,
            ],
            'plan' => $plan,
            'opcionesPrecios' => $opcionesPrecios,
            'pagos' => $pagos,
            'suscripcionActiva' => $suscripcionActiva,
            'bcvRate' => $bcvRate,
        ]);
    }

    /**
     * Vista de bloqueo por suscripción vencida.
     */
    public function expired()
    {
        $user = auth()->user();
        $empresa = $user?->empresa;

        if ($empresa && $empresa->hasActiveSubscription()) {
            return redirect('/admin/dashboard');
        }

        $plan = SubscriptionPlan::first();
        $totalSucursales = $empresa ? $empresa->sucursales()->count() : 1;

        $opcionesPrecios = [
            3 => [
                'meses' => 3,
                'total' => $plan ? $plan->calcularPrecio(3, max(1, $totalSucursales)) : 89.00,
            ],
            6 => [
                'meses' => 6,
                'total' => $plan ? $plan->calcularPrecio(6, max(1, $totalSucursales)) : 159.00,
            ],
            12 => [
                'meses' => 12,
                'total' => $plan ? $plan->calcularPrecio(12, max(1, $totalSucursales)) : 288.00,
            ],
        ];

        return inertia('subscription/expired', [
            'empresa' => $empresa ? [
                'id' => $empresa->id,
                'razon_social' => $empresa->razon_social,
                'subscription_status' => $empresa->subscription_status,
                'trial_ends_at' => $empresa->trial_ends_at?->format('Y-m-d H:i:s'),
                'subscription_expires_at' => $empresa->subscription_expires_at?->format('Y-m-d H:i:s'),
                'max_sucursales' => $empresa->max_sucursales ?? 1,
                'sucursales_activas' => $totalSucursales,
            ] : null,
            'plan' => $plan,
            'opcionesPrecios' => $opcionesPrecios,
        ]);
    }

    /**
     * Registrar solicitud de renovación o pago.
     */
    public function renew(Request $request)
    {
        $request->validate([
            'ciclo_meses' => 'required|integer|in:3,6,12',
            'sucursales_contratadas' => 'required|integer|min:1',
            'metodo_pago' => 'required|string',
            'referencia_pago' => 'nullable|string|max:100',
            'comprobante' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'notas' => 'nullable|string|max:500',
        ]);

        $user = auth()->user();
        $empresa = $user->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => 'No se encontró la empresa asociada al usuario.',
            ]);
        }

        $plan = SubscriptionPlan::first();
        $montoCalculado = $plan
            ? $plan->calcularPrecio((int) $request->ciclo_meses, (int) $request->sucursales_contratadas)
            : 89.00;

        $comprobantePath = null;
        if ($request->hasFile('comprobante')) {
            $comprobantePath = $request->file('comprobante')->store('comprobantes_suscripcion', 'public');
        }

        SubscriptionPayment::create([
            'empresa_id' => $empresa->id,
            'user_id' => $user->id,
            'monto' => $montoCalculado,
            'ciclo_meses' => (int) $request->ciclo_meses,
            'sucursales_contratadas' => (int) $request->sucursales_contratadas,
            'metodo_pago' => $request->metodo_pago,
            'referencia_pago' => $request->referencia_pago,
            'comprobante_path' => $comprobantePath,
            'notas' => $request->notas,
            'estado' => 'pending',
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Solicitud de renovación enviada con éxito. El administrador verificará su pago a la brevedad.',
        ]);
    }

    /**
     * Panel de Gestión Global de Suscripciones (Empresa ID 1 / SaaS Owner).
     */
    public function manage()
    {
        $user = auth()->user();

        // Solo permitir acceso si el usuario pertenece a la Empresa ID 1 o es Super Administrador
        if ($user->empresa_id !== 1 && ! $user->hasRole('Super Administrador')) {
            abort(403, 'No tiene permisos para acceder al gestor global de suscripciones.');
        }

        $empresas = Empresa::withCount('sucursales')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'razon_social' => $emp->razon_social,
                    'documento' => $emp->documento,
                    'email' => $emp->email,
                    'telefono' => $emp->telefono,
                    'subscription_status' => $emp->subscription_status,
                    'trial_ends_at' => $emp->trial_ends_at?->format('Y-m-d H:i:s'),
                    'subscription_expires_at' => $emp->subscription_expires_at?->format('Y-m-d H:i:s'),
                    'dias_restantes' => $emp->dias_restantes_suscripcion,
                    'estado_legible' => $emp->estado_suscripcion_legible,
                    'is_exempt' => $emp->isExemptFromSubscription(),
                    'max_sucursales' => $emp->max_sucursales ?? 1,
                    'total_sucursales' => $emp->sucursales_count,
                ];
            });

        $pagosPendientes = SubscriptionPayment::with(['empresa', 'user'])
            ->where('estado', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        $plan = SubscriptionPlan::first();

        $stats = [
            'total_empresas' => $empresas->count(),
            'activas' => $empresas->where('is_exempt', false)->where('subscription_status', 'active')->count(),
            'trial' => $empresas->where('is_exempt', false)->where('subscription_status', 'trial')->count(),
            'vencidas' => $empresas->where('is_exempt', false)->where('subscription_status', 'expired')->count(),
            'exentas' => $empresas->where('is_exempt', true)->count(),
            'pagos_pendientes' => $pagosPendientes->count(),
        ];

        return inertia('admin/subscription/manage', [
            'empresas' => $empresas,
            'pagosPendientes' => $pagosPendientes,
            'plan' => $plan,
            'stats' => $stats,
        ]);
    }

    /**
     * Aprobar un pago y activar/extender la suscripción de la empresa.
     */
    public function approvePayment(Request $request, SubscriptionPayment $payment)
    {
        $user = auth()->user();
        if ($user->empresa_id !== 1 && ! $user->hasRole('Super Administrador')) {
            abort(403, 'No autorizado.');
        }

        try {
            DB::beginTransaction();

            $payment->update([
                'estado' => 'approved',
                'aprobado_por' => $user->id,
                'aprobado_at' => now(),
            ]);

            $empresa = $payment->empresa;
            $meses = $payment->ciclo_meses;

            // Calcular nueva fecha de vencimiento
            $baseDate = ($empresa->subscription_expires_at && $empresa->subscription_expires_at->isFuture())
                ? $empresa->subscription_expires_at
                : now();

            $nuevaFechaVencimiento = $baseDate->copy()->addMonths($meses);

            $empresa->update([
                'subscription_status' => 'active',
                'billing_cycle' => $meses . '_months',
                'subscription_expires_at' => $nuevaFechaVencimiento,
                'max_sucursales' => max($empresa->max_sucursales ?? 1, $payment->sucursales_contratadas),
            ]);

            // Registrar suscripción activa
            Subscription::create([
                'empresa_id' => $empresa->id,
                'plan_id' => SubscriptionPlan::first()?->id,
                'nombre_plan' => 'Plan Full',
                'ciclo_meses' => $meses,
                'max_sucursales' => $payment->sucursales_contratadas,
                'monto_total' => $payment->monto,
                'fecha_inicio' => now(),
                'fecha_vencimiento' => $nuevaFechaVencimiento,
                'estado' => 'active',
            ]);

            DB::commit();

            return back()->with('notification', [
                'type' => 'success',
                'message' => "Pago aprobado y suscripción activada para {$empresa->razon_social} hasta " . $nuevaFechaVencimiento->format('d/m/Y') . '.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error aprobando suscripción: ' . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => 'Error procesando la aprobación del pago: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Rechazar un pago de renovación.
     */
    public function rejectPayment(Request $request, SubscriptionPayment $payment)
    {
        $user = auth()->user();
        if ($user->empresa_id !== 1 && ! $user->hasRole('Super Administrador')) {
            abort(403, 'No autorizado.');
        }

        $payment->update([
            'estado' => 'rejected',
            'notas' => $request->input('notas', 'Pago rechazado por el administrador.'),
        ]);

        return back()->with('notification', [
            'type' => 'info',
            'message' => 'El pago ha sido marcado como rechazado.',
        ]);
    }

    /**
     * Ajustar o extender manualmente días de prueba/suscripción a una empresa.
     */
    public function updateEmpresaSubscription(Request $request, Empresa $empresa)
    {
        $user = auth()->user();
        if ($user->empresa_id !== 1 && ! $user->hasRole('Super Administrador')) {
            abort(403, 'No autorizado.');
        }

        $request->validate([
            'subscription_status' => 'required|in:trial,active,expired,cancelled',
            'fecha_vencimiento' => 'required|date',
            'max_sucursales' => 'required|integer|min:1',
        ]);

        $fechaVencimiento = \Carbon\Carbon::parse($request->fecha_vencimiento);

        if ($request->subscription_status === 'trial') {
            $empresa->update([
                'subscription_status' => 'trial',
                'trial_ends_at' => $fechaVencimiento,
                'max_sucursales' => (int) $request->max_sucursales,
            ]);
        } else {
            $empresa->update([
                'subscription_status' => $request->subscription_status,
                'subscription_expires_at' => $fechaVencimiento,
                'max_sucursales' => (int) $request->max_sucursales,
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Suscripción de {$empresa->razon_social} actualizada correctamente.",
        ]);
    }
}
