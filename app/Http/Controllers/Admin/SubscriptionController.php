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

        $precio3 = ($plan?->precio_3_meses > 0) ? $plan->precio_3_meses : 89.00;
        $precio6 = ($plan?->precio_6_meses > 0) ? $plan->precio_6_meses : 159.00;
        $precio12 = ($plan?->precio_12_meses > 0) ? $plan->precio_12_meses : 288.00;

        // Opciones de cálculo de precios
        $opcionesPrecios = [
            3 => [
                'meses' => 3,
                'subtotal_plan' => $precio3,
                'precio_mensual_promedio' => round($precio3 / 3, 2),
                'total' => $plan ? $plan->calcularPrecio(3, max(1, $totalSucursales)) : 89.00,
            ],
            6 => [
                'meses' => 6,
                'subtotal_plan' => $precio6,
                'precio_mensual_promedio' => round($precio6 / 6, 2),
                'total' => $plan ? $plan->calcularPrecio(6, max(1, $totalSucursales)) : 159.00,
            ],
            12 => [
                'meses' => 12,
                'subtotal_plan' => $precio12,
                'precio_mensual_promedio' => round($precio12 / 12, 2),
                'total' => $plan ? $plan->calcularPrecio(12, max(1, $totalSucursales)) : 288.00,
            ],
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
                'billing_cycle' => $empresa->billing_cycle,
                'max_sucursales' => $empresa->max_sucursales ?? 1,
                'sucursales_activas' => $totalSucursales,
            ],
            'plan' => $plan,
            'planes' => $planes,
            'opcionesPrecios' => $opcionesPrecios,
            'pagos' => $pagos,
            'suscripcionActiva' => $suscripcionActiva,
            'bcvRate' => $bcvRate,
            'paymentGateways' => $paymentGateways,
        ]);
    }

    /**
     * Vista de bloqueo por suscripción vencida.
     */
    public function expired(\App\Services\BcvRateService $bcvService)
    {
        $user = auth()->user();
        $empresa = $user?->empresa;

        if ($empresa && $empresa->hasActiveSubscription()) {
            return redirect('/admin/dashboard');
        }

        SubscriptionPlan::ensureDefaultPlansExist();
        $planes = SubscriptionPlan::where('activo', true)
            ->where('precio_3_meses', '>', 0)
            ->orderBy('precio_12_meses', 'asc')
            ->get();

        if ($planes->isEmpty()) {
            $planes = SubscriptionPlan::where('activo', true)->get();
        }

        $plan = SubscriptionPlan::getPlanRenovacionDefault() ?? $planes->first();
        $totalSucursales = $empresa ? $empresa->sucursales()->count() : 1;

        $bcvRate = $bcvService->getRate() ?? 36.50;

        $precio3 = ($plan?->precio_3_meses > 0) ? $plan->precio_3_meses : 89.00;
        $precio6 = ($plan?->precio_6_meses > 0) ? $plan->precio_6_meses : 159.00;
        $precio12 = ($plan?->precio_12_meses > 0) ? $plan->precio_12_meses : 288.00;

        $opcionesPrecios = [
            3 => [
                'meses' => 3,
                'subtotal_plan' => $precio3,
                'precio_mensual_promedio' => round($precio3 / 3, 2),
                'total' => $plan ? $plan->calcularPrecio(3, max(1, $totalSucursales)) : 89.00,
            ],
            6 => [
                'meses' => 6,
                'subtotal_plan' => $precio6,
                'precio_mensual_promedio' => round($precio6 / 6, 2),
                'total' => $plan ? $plan->calcularPrecio(6, max(1, $totalSucursales)) : 159.00,
            ],
            12 => [
                'meses' => 12,
                'subtotal_plan' => $precio12,
                'precio_mensual_promedio' => round($precio12 / 12, 2),
                'total' => $plan ? $plan->calcularPrecio(12, max(1, $totalSucursales)) : 288.00,
            ],
        ];

        $masterEmpresa = Empresa::withoutGlobalScopes()->find(1) ?? $empresa;
        $paymentGateways = [
            'paypal' => [
                'active' => (bool) $masterEmpresa?->paypal_active,
                'mode' => $masterEmpresa?->paypal_mode ?? 'sandbox',
                'client_id' => $masterEmpresa?->paypal_client_id ?? '',
            ],
            'mercadopago' => [
                'active' => (bool) $masterEmpresa?->mercadopago_active,
                'mode' => $masterEmpresa?->mercadopago_mode ?? 'sandbox',
                'public_key' => $masterEmpresa?->mercadopago_public_key ?? '',
            ],
            'stripe' => [
                'active' => (bool) $masterEmpresa?->stripe_active,
                'mode' => $masterEmpresa?->stripe_mode ?? 'test',
                'publishable_key' => $masterEmpresa?->stripe_publishable_key ?? '',
            ],
        ];

        return inertia('subscription/expired', [
            'empresa' => $empresa ? [
                'id' => $empresa->id,
                'razon_social' => $empresa->razon_social,
                'subscription_status' => $empresa->subscription_status,
                'trial_ends_at' => $empresa->trial_ends_at?->format('Y-m-d H:i:s'),
                'subscription_expires_at' => $empresa->subscription_expires_at?->format('Y-m-d H:i:s'),
                'dias_restantes' => $empresa->dias_restantes_suscripcion,
                'estado_legible' => $empresa->estado_suscripcion_legible,
                'is_exempt' => $empresa->isExemptFromSubscription(),
                'billing_cycle' => $empresa->billing_cycle,
                'max_sucursales' => $empresa->max_sucursales ?? 1,
                'sucursales_activas' => $totalSucursales,
            ] : null,
            'plan' => $plan,
            'planes' => $planes,
            'opcionesPrecios' => $opcionesPrecios,
            'bcvRate' => $bcvRate,
            'paymentGateways' => $paymentGateways,
        ]);
    }

    /**
     * Registrar solicitud de renovación o pago.
     */
    public function renew(Request $request)
    {
        $request->validate([
            'plan_id' => 'nullable|exists:subscription_plans,id',
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

        $plan = $request->plan_id ? SubscriptionPlan::find($request->plan_id) : SubscriptionPlan::getPlanRenovacionDefault();
        $montoCalculado = $plan
            ? $plan->calcularPrecio((int) $request->ciclo_meses, (int) $request->sucursales_contratadas)
            : 89.00;

        $comprobantePath = null;
        if ($request->hasFile('comprobante')) {
            $comprobantePath = $request->file('comprobante')->store('comprobantes_suscripcion', 'public');
        }

        SubscriptionPayment::create([
            'empresa_id' => $empresa->id,
            'plan_id' => $plan?->id,
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
     * Crear orden de PayPal en la API.
     */
    public function createPaypalOrder(Request $request)
    {
       
        $request->validate([
            'ciclo_meses' => 'required|integer|in:3,6,12',
            'sucursales_contratadas' => 'required|integer|min:1',
        ]);

        $empresa = $request->user()->empresa;
        $plan = SubscriptionPlan::firstOrCreate(
            ['nombre' => 'Plan Full'],
            [
                'descripcion' => 'Acceso completo a todos los módulos operativos del sistema (Ventas, Inventario, Caja, Clientes, Créditos, Servicios). Excluye monitoreo e integraciones.',
                'precio_3_meses' => 89.00,
                'precio_6_meses' => 159.00,
                'precio_12_meses' => 288.00,
                'precio_sucursal_extra_mensual' => 10.00,
                'sucursales_incluidas' => 1,
                'modulos_incluidos' => ['ventas', 'cajas', 'inventarios', 'productos', 'servicios', 'clientes', 'creditos', 'metas_ventas'],
                'activo' => true,
            ]
        );
        $monto = $plan ? $plan->calcularPrecio((int) $request->ciclo_meses, (int) $request->sucursales_contratadas) : 89.00;

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
                        'description' => "Renovación Suscripción Fix Sale - {$request->ciclo_meses} meses ({$empresa->razon_social})",
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
            'ciclo_meses' => 'required|integer|in:3,6,12',
            'sucursales_contratadas' => 'required|integer|min:1',
        ]);

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
            $monto = $plan ? $plan->calcularPrecio((int) $request->ciclo_meses, (int) $request->sucursales_contratadas) : 89.00;

            // Extender fecha de expiración calculando desde la tabla subscriptions
            $latestSub = $empresa->getLatestSubscriptionRecord();
            if ($hasActivePaidSubscription) {
                $nuevaFechaExpiracion = $latestSub?->fecha_vencimiento ?? $empresa->subscription_expires_at ?? now();
            } else {
                $baseDate = now();
                if ($latestSub?->fecha_vencimiento && $latestSub->fecha_vencimiento->isFuture()) {
                    $baseDate = $latestSub->fecha_vencimiento->copy();
                }
                $nuevaFechaExpiracion = $baseDate->addMonths((int) $request->ciclo_meses);
            }

            $empresa->update([
                'subscription_status' => 'active',
                'subscription_expires_at' => $nuevaFechaExpiracion,
                'max_sucursales' => max($empresa->max_sucursales ?? 1, (int) $request->sucursales_contratadas),
                'billing_cycle' => (string) $request->ciclo_meses,
            ]);

            // Crear el registro de la Suscripción
            $subscription = Subscription::create([
                'empresa_id' => $empresa->id,
                'plan_id' => $plan?->id,
                'nombre_plan' => Subscription::getNombrePlanByCiclo((int) $request->ciclo_meses),
                'ciclo_meses' => (int) $request->ciclo_meses,
                'max_sucursales' => (int) $request->sucursales_contratadas,
                'monto_total' => $monto,
                'fecha_inicio' => now(),
                'fecha_vencimiento' => $nuevaFechaExpiracion,
                'estado' => 'active',
            ]);

            // Registrar Pago Aprobado enlazando subscription_id y plan_id
            SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'plan_id' => $plan?->id,
                'empresa_id' => $empresa->id,
                'user_id' => auth()->id(),
                'monto' => $monto,
                'ciclo_meses' => (int) $request->ciclo_meses,
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
            $meses = $payment->ciclo_meses;

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

            // Registrar suscripción activa
            $subscription = Subscription::create([
                'empresa_id' => $empresa->id,
                'plan_id' => $plan?->id,
                'nombre_plan' => Subscription::getNombrePlanByCiclo($meses),
                'ciclo_meses' => $meses,
                'max_sucursales' => $payment->sucursales_contratadas,
                'monto_total' => $payment->monto,
                'fecha_inicio' => now(),
                'fecha_vencimiento' => $nuevaFechaVencimiento,
                'estado' => 'active',
            ]);

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
                'ciclo_meses' => 12,
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
