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

        SubscriptionPlan::ensureDefaultPlansExist();
        $planes = SubscriptionPlan::where('activo', true)->get();
        $plan = SubscriptionPlan::getPlanRenovacionDefault() ?? $planes->first();
        $totalSucursales = $empresa->sucursales()->count();

        $pagos = SubscriptionPayment::where('empresa_id', $empresa->id)
            ->with(['user', 'aprobador', 'plan'])
            ->orderBy('created_at', 'desc')
            ->get();

        $suscripcionActiva = Subscription::where('empresa_id', $empresa->id)
            ->with('plan')
            ->orderBy('id', 'desc')
            ->first();

        $bcvRate = $bcvService->getRate() ?? 36.50; // Tasa por defecto de respaldo si falla el API

        // Opciones de cálculo de precios (cobro puramente mensual)
        $opcionesPrecios = [];
        foreach ($planes as $p) {
            $precioMensual = $p->precio_mensual_efectivo;
            $opcionesPrecios[$p->id] = [
                'plan_id' => $p->id,
                'nombre' => $p->nombre,
                'meses' => 1,
                'subtotal_plan' => $precioMensual,
                'precio_mensual_promedio' => $precioMensual,
                'total' => $p->calcularPrecio(1, max(1, $totalSucursales)),
            ];
        }

        // Opción predeterminada para el ciclo 1 mes (compatibilidad con vistas)
        $opcionesPrecios[1] = [
            'meses' => 1,
            'subtotal_plan' => $plan?->precio_mensual_efectivo ?? 499.00,
            'precio_mensual_promedio' => $plan?->precio_mensual_efectivo ?? 499.00,
            'total' => $plan?->calcularPrecio(1, max(1, $totalSucursales)) ?? 499.00,
        ];

        // Obtener la configuración activa de pasarelas de pago de la plataforma (Empresa ID 1 / Dueño del SaaS)
        $masterEmpresa = Empresa::withoutGlobalScopes()->find(1) ?? $empresa;
        $paymentGateways = [
            'paypal' => [
                'active' => (bool) $masterEmpresa->paypal_active,
                'mode' => $masterEmpresa->paypal_mode ?? 'sandbox',
                'client_id' => $masterEmpresa->paypal_client_id ?? '',
            ],
            'mercadopago' => [
                'active' => (bool) $masterEmpresa->mercadopago_active,
                'mode' => $masterEmpresa->mercadopago_mode ?? 'sandbox',
                'public_key' => $masterEmpresa->mercadopago_public_key ?? '',
            ],
            'stripe' => [
                'active' => (bool) $masterEmpresa->stripe_active,
                'mode' => $masterEmpresa->stripe_mode ?? 'test',
                'publishable_key' => $masterEmpresa->stripe_publishable_key ?? '',
            ],
        ];

        $latestSub = $empresa->getLatestSubscriptionRecord();

        return inertia('admin/subscription/index', [
            'empresa' => [
                'id' => $empresa->id,
                'razon_social' => $empresa->razon_social,
                'subscription_status' => $latestSub?->estado ?? $empresa->subscription_status,
                'trial_ends_at' => ($latestSub && $latestSub->estado === 'trial') ? $latestSub->fecha_vencimiento?->format('Y-m-d H:i:s') : $empresa->trial_ends_at?->format('Y-m-d H:i:s'),
                'subscription_expires_at' => $latestSub?->fecha_vencimiento?->format('Y-m-d H:i:s') ?? $empresa->subscription_expires_at?->format('Y-m-d H:i:s'),
                'dias_restantes' => $empresa->dias_restantes_suscripcion,
                'estado_legible' => $empresa->estado_suscripcion_legible,
                'is_exempt' => $empresa->isExemptFromSubscription(),
                'billing_cycle' => $latestSub ? ($latestSub->ciclo_meses . '_months') : $empresa->billing_cycle,
                'max_sucursales' => $latestSub?->max_sucursales ?? $empresa->max_sucursales ?? 1,
                'sucursales_activas' => $totalSucursales,
            ],
            'plan' => $plan,
            'planes' => $planes,
            'opcionesPrecios' => $opcionesPrecios,
            'pagos' => $pagos,
            'suscripcionActiva' => $latestSub,
            'bcvRate' => $bcvRate,
            'paymentGateways' => $paymentGateways,
        ]);
    }

    /**
     * Vista de bloqueo por suscripción vencida.
     */
    public function expired()
    {
        return redirect()->route('admin.subscription.index');
    }

    /**
     * Registrar solicitud de renovación o pago.
     */
    public function renew(Request $request)
    {
        $request->validate([
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'ciclo_meses' => 'nullable|integer|min:1',
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

        $cicloMeses = (int) ($request->input('ciclo_meses') ?: 1);
        $plan = $request->plan_id ? SubscriptionPlan::find($request->plan_id) : SubscriptionPlan::getPlanRenovacionDefault();
        $hasActivePaidSubscription = $empresa->subscription_status === 'active' && ! $empresa->isExemptFromSubscription();

        if ($hasActivePaidSubscription) {
            $nuevasSucursales = max(0, (int) $request->sucursales_contratadas - ($empresa->max_sucursales ?? 1));
            $precioExtra = ($plan?->precio_sucursal_extra_mensual > 0) ? $plan->precio_sucursal_extra_mensual : 10.00;
            $montoCalculado = round($nuevasSucursales * $precioExtra * 1, 2);
            $cicloPago = 1;
        } else {
            $montoCalculado = $plan
                ? $plan->calcularPrecio($cicloMeses, (int) $request->sucursales_contratadas)
                : 499.00;
            $cicloPago = $cicloMeses;
        }

        $comprobantePath = null;
        if ($request->hasFile('comprobante')) {
            $comprobantePath = $request->file('comprobante')->store('comprobantes_suscripcion', 'public');
        }

        SubscriptionPayment::create([
            'empresa_id' => $empresa->id,
            'plan_id' => $plan?->id,
            'user_id' => $user->id,
            'monto' => $montoCalculado,
            'ciclo_meses' => $cicloPago,
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
     * Crear orden de PayPal en la API.
     */
    public function createPaypalOrder(Request $request)
    {
        $request->validate([
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'ciclo_meses' => 'nullable|integer|min:1',
            'sucursales_contratadas' => 'required|integer|min:1',
        ]);

        $cicloMeses = (int) ($request->input('ciclo_meses') ?: 1);
        $empresa = $request->user()->empresa;
        $planId = $request->input('plan_id');
        $plan = $planId ? SubscriptionPlan::find($planId) : SubscriptionPlan::getPlanRenovacionDefault();
        $hasActivePaidSubscription = $empresa->subscription_status === 'active' && ! $empresa->isExemptFromSubscription();

        if ($hasActivePaidSubscription) {
            $nuevasSucursales = max(0, (int) $request->sucursales_contratadas - ($empresa->max_sucursales ?? 1));
            $precioExtra = ($plan?->precio_sucursal_extra_mensual > 0) ? $plan->precio_sucursal_extra_mensual : 10.00;
            $monto = round($nuevasSucursales * $precioExtra, 2);
        } else {
            $monto = $plan ? $plan->calcularPrecio($cicloMeses, (int) $request->sucursales_contratadas) : 499.00;
        }

        $masterEmpresa = Empresa::withoutGlobalScopes()->find(1) ?? $empresa;
        $clientId = $masterEmpresa->paypal_client_id;
        $clientSecret = $masterEmpresa->paypal_client_secret;
        $isLive = $masterEmpresa->paypal_mode === 'live';
        $baseUrl = $isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

        // Obtener Access Token de PayPal
        $response = \Illuminate\Support\Facades\Http::withBasicAuth($clientId, $clientSecret)
            ->asForm()
            ->post("{$baseUrl}/v1/oauth2/token", [
                'grant_type' => 'client_credentials',
            ]);

        if (! $response->successful()) {
            return response()->json(['error' => 'No se pudo autenticar con PayPal API.'], 500);
        }

        $accessToken = $response->json()['access_token'];

        // Crear Orden PayPal
        $orderResponse = \Illuminate\Support\Facades\Http::withToken($accessToken)
            ->post("{$baseUrl}/v2/checkout/orders", [
                'intent' => 'CAPTURE',
                'purchase_units' => [
                    [
                        'amount' => [
                            'currency_code' => 'USD',
                            'value' => number_format($monto, 2, '.', ''),
                        ],
                        'description' => "Renovación Suscripción Fix Sale - {$plan?->nombre} ({$empresa->razon_social})",
                    ],
                ],
            ]);

        return response()->json($orderResponse->json(), $orderResponse->status());
    }

    /**
     * Capturar orden de PayPal completada y activar la suscripción inmediatamente.
     */
    public function capturePaypalOrder(Request $request, $orderId)
    {
        $request->validate([
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'ciclo_meses' => 'nullable|integer|min:1',
            'sucursales_contratadas' => 'required|integer|min:1',
        ]);

        $cicloMeses = (int) ($request->input('ciclo_meses') ?: 1);
        $empresa = $request->user()->empresa;
        $masterEmpresa = Empresa::withoutGlobalScopes()->find(1) ?? $empresa;
        $clientId = $masterEmpresa->paypal_client_id;
        $clientSecret = $masterEmpresa->paypal_client_secret;
        $isLive = $masterEmpresa->paypal_mode === 'live';
        $baseUrl = $isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

        // Obtener Access Token
        $response = \Illuminate\Support\Facades\Http::withBasicAuth($clientId, $clientSecret)
            ->asForm()
            ->post("{$baseUrl}/v1/oauth2/token", [
                'grant_type' => 'client_credentials',
            ]);

        if (! $response->successful()) {
            return response()->json(['error' => 'No se pudo autenticar con PayPal API.'], 500);
        }

        $accessToken = $response->json()['access_token'];

        // Capturar Orden
        $captureResponse = \Illuminate\Support\Facades\Http::withToken($accessToken)
            ->withBody('{}', 'application/json')
            ->post("{$baseUrl}/v2/checkout/orders/{$orderId}/capture");

        $data = $captureResponse->json();

        if ($captureResponse->successful() && isset($data['status']) && $data['status'] === 'COMPLETED') {
            $transactionId = $data['purchase_units'][0]['payments']['captures'][0]['id'] ?? $orderId;
            $planId = $request->input('plan_id');
            $plan = $planId ? SubscriptionPlan::find($planId) : SubscriptionPlan::getPlanRenovacionDefault();
            $hasActivePaidSubscription = $empresa->subscription_status === 'active' && ! $empresa->isExemptFromSubscription();

            if ($hasActivePaidSubscription) {
                $nuevasSucursales = max(0, (int) $request->sucursales_contratadas - ($empresa->max_sucursales ?? 1));
                $precioExtra = ($plan?->precio_sucursal_extra_mensual > 0) ? $plan->precio_sucursal_extra_mensual : 10.00;
                $monto = round($nuevasSucursales * $precioExtra, 2);
            } else {
                $monto = $plan ? $plan->calcularPrecio($cicloMeses, (int) $request->sucursales_contratadas) : 499.00;
            }

            // Extender fecha de expiración calculando desde la tabla subscriptions
            $latestSub = $empresa->getLatestSubscriptionRecord();
            if ($hasActivePaidSubscription) {
                $nuevaFechaExpiracion = $latestSub?->fecha_vencimiento ?? $empresa->subscription_expires_at ?? now();
            } else {
                $baseDate = now();
                if ($latestSub?->fecha_vencimiento && $latestSub->fecha_vencimiento->isFuture()) {
                    $baseDate = $latestSub->fecha_vencimiento->copy();
                }
                $nuevaFechaExpiracion = $baseDate->addMonths($cicloMeses);
            }

            $empresa->update([
                'subscription_status' => 'active',
                'subscription_expires_at' => $nuevaFechaExpiracion,
                'max_sucursales' => max($empresa->max_sucursales ?? 1, (int) $request->sucursales_contratadas),
                'billing_cycle' => (string) $cicloMeses,
            ]);

            $nombrePlan = $hasActivePaidSubscription
                ? 'Sucursales Adicionales'
                : ($plan?->nombre ?? Subscription::getNombrePlanByCiclo($cicloMeses));

            // Actualizar la suscripción existente de la empresa (NO crear registros duplicados)
            $subscription = $empresa->getLatestSubscriptionRecord();
            if ($subscription) {
                $subscription->update([
                    'plan_id' => $plan?->id,
                    'nombre_plan' => $nombrePlan,
                    'ciclo_meses' => $hasActivePaidSubscription ? ($subscription->ciclo_meses ?: $cicloMeses) : $cicloMeses,
                    'max_sucursales' => max($empresa->max_sucursales ?? 1, (int) $request->sucursales_contratadas),
                    'monto_total' => $monto,
                    'fecha_vencimiento' => $nuevaFechaExpiracion,
                    'estado' => 'active',
                ]);
            } else {
                $subscription = Subscription::create([
                    'empresa_id' => $empresa->id,
                    'plan_id' => $plan?->id,
                    'nombre_plan' => $nombrePlan,
                    'ciclo_meses' => $cicloMeses,
                    'max_sucursales' => (int) $request->sucursales_contratadas,
                    'monto_total' => $monto,
                    'fecha_inicio' => now(),
                    'fecha_vencimiento' => $nuevaFechaExpiracion,
                    'estado' => 'active',
                ]);
            }

            // Registrar Pago Aprobado enlazando subscription_id y plan_id
            SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'plan_id' => $plan?->id,
                'empresa_id' => $empresa->id,
                'user_id' => auth()->id(),
                'monto' => $monto,
                'ciclo_meses' => $hasActivePaidSubscription ? 1 : $cicloMeses,
                'sucursales_contratadas' => (int) $request->sucursales_contratadas,
                'metodo_pago' => 'paypal',
                'referencia_pago' => $transactionId,
                'estado' => 'approved',
                'aprobado_por' => auth()->id(),
                'aprobado_at' => now(),
                'notas' => 'Pago automático procesado exitosamente vía PayPal SDK Checkout.',
            ]);
        }

        return response()->json($data, $captureResponse->status());
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
                $sub = $emp->getLatestSubscriptionRecord();
                return [
                    'id' => $emp->id,
                    'razon_social' => $emp->razon_social,
                    'documento' => $emp->documento,
                    'email' => $emp->email,
                    'telefono' => $emp->telefono,
                    'subscription_status' => $sub?->estado ?? $emp->subscription_status,
                    'trial_ends_at' => ($sub && $sub->estado === 'trial') ? $sub->fecha_vencimiento?->format('Y-m-d H:i:s') : $emp->trial_ends_at?->format('Y-m-d H:i:s'),
                    'subscription_expires_at' => $sub?->fecha_vencimiento?->format('Y-m-d H:i:s') ?? $emp->subscription_expires_at?->format('Y-m-d H:i:s'),
                    'dias_restantes' => $emp->dias_restantes_suscripcion,
                    'estado_legible' => $emp->estado_suscripcion_legible,
                    'is_exempt' => $emp->isExemptFromSubscription(),
                    'max_sucursales' => $sub?->max_sucursales ?? $emp->max_sucursales ?? 1,
                    'total_sucursales' => $emp->sucursales_count ?? 1,
                ];
            });

        $pagosPendientes = SubscriptionPayment::with(['empresa', 'user', 'plan'])
            ->where('estado', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        $planes = SubscriptionPlan::where('activo', true)->get();

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
            'plan' => SubscriptionPlan::getPlanRenovacionDefault() ?? $planes->first(),
            'planes' => $planes,
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

            $empresa = $payment->empresa;
            $meses = max(1, (int) $payment->ciclo_meses);

            $hasActivePaidSubscription = $empresa->subscription_status === 'active' && ! $empresa->isExemptFromSubscription();

            // Extender vigencia calculando desde la tabla subscriptions
            $latestSub = $empresa->getLatestSubscriptionRecord();
            if ($hasActivePaidSubscription) {
                $nuevaFechaVencimiento = $latestSub?->fecha_vencimiento ?? $empresa->subscription_expires_at ?? now()->addMonths($meses);
            } else {
                $baseDate = now();
                if ($latestSub?->fecha_vencimiento && $latestSub->fecha_vencimiento->isFuture()) {
                    $baseDate = $latestSub->fecha_vencimiento->copy();
                }
                $nuevaFechaVencimiento = $baseDate->addMonths($meses);
            }

            $empresa->update([
                'subscription_status' => 'active',
                'billing_cycle' => $meses . '_months',
                'subscription_expires_at' => $nuevaFechaVencimiento,
                'max_sucursales' => max($empresa->max_sucursales ?? 1, $payment->sucursales_contratadas),
            ]);

            $plan = $payment->plan ?? ($payment->plan_id ? SubscriptionPlan::find($payment->plan_id) : SubscriptionPlan::getPlanRenovacionDefault());

            $nombrePlan = $hasActivePaidSubscription
                ? 'Sucursales Adicionales'
                : ($plan?->nombre ?? Subscription::getNombrePlanByCiclo($meses));

            // Actualizar la suscripción existente de la empresa (NO crear registros duplicados)
            $subscription = $empresa->getLatestSubscriptionRecord();
            if ($subscription) {
                $subscription->update([
                    'plan_id' => $plan?->id,
                    'nombre_plan' => $nombrePlan,
                    'ciclo_meses' => $hasActivePaidSubscription ? ($subscription->ciclo_meses ?: $meses) : $meses,
                    'max_sucursales' => max($empresa->max_sucursales ?? 1, $payment->sucursales_contratadas),
                    'monto_total' => $payment->monto,
                    'fecha_vencimiento' => $nuevaFechaVencimiento,
                    'estado' => 'active',
                ]);
            } else {
                $subscription = Subscription::create([
                    'empresa_id' => $empresa->id,
                    'plan_id' => $plan?->id,
                    'nombre_plan' => $nombrePlan,
                    'ciclo_meses' => $meses,
                    'max_sucursales' => $payment->sucursales_contratadas,
                    'monto_total' => $payment->monto,
                    'fecha_inicio' => now(),
                    'fecha_vencimiento' => $nuevaFechaVencimiento,
                    'estado' => 'active',
                ]);
            }

            $payment->update([
                'subscription_id' => $subscription->id,
                'plan_id' => $plan?->id,
                'estado' => 'approved',
                'aprobado_por' => $user->id,
                'aprobado_at' => now(),
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

        $status = $request->subscription_status;
        $maxSucursales = (int) $request->max_sucursales;

        if ($status === 'trial') {
            $empresa->update([
                'subscription_status' => 'trial',
                'trial_ends_at' => $fechaVencimiento,
                'max_sucursales' => $maxSucursales,
            ]);
        } else {
            $empresa->update([
                'subscription_status' => $status,
                'subscription_expires_at' => $fechaVencimiento,
                'max_sucursales' => $maxSucursales,
            ]);
        }

        // Actualizar o registrar en la tabla 'subscriptions'
        $latestSub = $empresa->subscriptions()->orderBy('id', 'desc')->first();
        if ($latestSub) {
            $latestSub->update([
                'estado' => $status,
                'fecha_vencimiento' => $fechaVencimiento,
                'max_sucursales' => $maxSucursales,
            ]);
        } else {
            Subscription::create([
                'empresa_id' => $empresa->id,
                'plan_id' => SubscriptionPlan::getPlanRenovacionDefault()?->id,
                'nombre_plan' => $status === 'trial' ? 'Plan Prueba (7 días)' : 'Plan Profesional',
                'ciclo_meses' => 1,
                'max_sucursales' => $maxSucursales,
                'monto_total' => 0.00,
                'fecha_inicio' => now(),
                'fecha_vencimiento' => $fechaVencimiento,
                'estado' => $status,
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Suscripción de {$empresa->razon_social} actualizada correctamente.",
        ]);
    }
}
