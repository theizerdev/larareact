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
    public function index(Request $request, \App\Services\BcvRateService $bcvService)
    {
        $user = auth()->user();
        $empresa = $user->empresa;

        if (! $empresa) {
            abort(404, 'Empresa no encontrada.');
        }

        SubscriptionPlan::ensureDefaultPlansExist();
        $planes = SubscriptionPlan::available()->orderBy('orden', 'asc')->get();
        $suscripcionActiva = Subscription::where('empresa_id', $empresa->id)
            ->with('plan')
            ->orderBy('id', 'desc')
            ->first();

        $requestedPlanId = $request->integer('plan_id');
        $activeSubPlan = ($suscripcionActiva?->plan
            && $suscripcionActiva->plan->activo
            && ((float) $suscripcionActiva->plan->precio_regular_mensual > 0 || (float) $suscripcionActiva->plan->precio_12_meses > 0))
            ? $planes->firstWhere('id', $suscripcionActiva->plan->id)
            : null;

        $plan = ($requestedPlanId ? $planes->firstWhere('id', $requestedPlanId) : null)
            ?? $activeSubPlan
            ?? SubscriptionPlan::getPlanRenovacionDefault()
            ?? $planes->first();
        $totalSucursales = $empresa->sucursales()->count();

        $pagos = SubscriptionPayment::where('empresa_id', $empresa->id)
            ->with(['user', 'aprobador', 'plan'])
            ->orderBy('created_at', 'desc')
            ->get();

        $bcvRate = $bcvService->getRate() ?? 36.50; // Tasa por defecto de respaldo si falla el API

        // Opciones de cálculo de precios respetando el ciclo del plan (mensual o anual)
        $opcionesPrecios = [];
        foreach ($planes as $p) {
            $meses = max(1, (int) ($p->ciclo_meses ?: 1));
            $subtotal = $meses === 12 && (float) $p->precio_12_meses > 0
                ? (float) $p->precio_12_meses
                : $p->precio_mensual_efectivo;
            $opcionesPrecios[$p->id] = [
                'plan_id' => $p->id,
                'nombre' => $p->nombre,
                'meses' => $meses,
                'subtotal_plan' => $subtotal,
                'precio_mensual_promedio' => round($subtotal / $meses, 2),
                'total' => $p->calcularPrecio($meses, max(1, $totalSucursales)),
            ];
        }

        // Opción predeterminada (compatibilidad con vistas)
        $defaultMeses = max(1, (int) ($plan?->ciclo_meses ?: 1));
        $defaultSubtotal = $defaultMeses === 12 && (float) ($plan?->precio_12_meses ?? 0) > 0
            ? (float) $plan->precio_12_meses
            : ($plan?->precio_mensual_efectivo ?? 149.00);
        $opcionesPrecios[1] = $opcionesPrecios[1] ?? [
            'meses' => $defaultMeses,
            'subtotal_plan' => $defaultSubtotal,
            'precio_mensual_promedio' => round($defaultSubtotal / $defaultMeses, 2),
            'total' => $plan?->calcularPrecio($defaultMeses, max(1, $totalSucursales)) ?? 149.00,
        ];

        // Obtener la configuración activa de pasarelas de pago de la plataforma (Empresa ID 1 / Dueño del SaaS)
        $masterEmpresa = Empresa::withoutGlobalScopes()->find(1) ?? $empresa;
        $primaryGateway = $masterEmpresa->primary_payment_gateway ?? 'stripe';
        $paymentGateways = [
            'stripe' => [
                'active' => (bool) $masterEmpresa->stripe_active,
                'mode' => $masterEmpresa->stripe_mode ?? 'test',
                'publishable_key' => $masterEmpresa->stripe_publishable_key ?? '',
                'is_primary' => $primaryGateway === 'stripe',
            ],
            'paypal' => [
                'active' => (bool) $masterEmpresa->paypal_active,
                'mode' => $masterEmpresa->paypal_mode ?? 'sandbox',
                'client_id' => $masterEmpresa->paypal_client_id ?? '',
                'is_primary' => $primaryGateway === 'paypal',
            ],
            'mercadopago' => [
                'active' => (bool) $masterEmpresa->mercadopago_active,
                'mode' => $masterEmpresa->mercadopago_mode ?? 'sandbox',
                'public_key' => $masterEmpresa->mercadopago_public_key ?? '',
                'is_primary' => $primaryGateway === 'mercadopago',
            ],
        ];

        $latestSub = $empresa->getLatestSubscriptionRecord();
        $hasActivePaidSubscription = $this->hasActivePaidSubscription($empresa, $latestSub);

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
            'hasActivePaidSubscription' => $hasActivePaidSubscription,
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
     * Determina si la empresa tiene una suscripción paga vigente (no exenta y no vencida).
     */
    protected function hasActivePaidSubscription(Empresa $empresa, ?Subscription $latestSub = null): bool
    {
        if ($empresa->isExemptFromSubscription()) {
            return false;
        }

        $sub = $latestSub ?? $empresa->getLatestSubscriptionRecord();

        return $sub !== null
            && $sub->estado === 'active'
            && $sub->fecha_vencimiento !== null
            && now()->lte($sub->fecha_vencimiento);
    }

    /**
     * Normaliza la duración en meses según el ciclo del plan seleccionado.
     */
    protected function normalizeCicloMeses(?SubscriptionPlan $plan, int $requestedMonths): int
    {
        $raw = max(1, $requestedMonths);

        if ($plan && (int) $plan->ciclo_meses === 12) {
            $periodos = ($raw <= 12) ? 1 : min(3, max(1, (int) round($raw / 12)));

            return 12 * $periodos;
        }

        return min(24, $raw);
    }

    /**
     * Calcula cotización unificada para adelanto de mensualidad, prorrateo de sucursales o renovación.
     *
     * @return array{
     *   has_active_paid: bool,
     *   modo_pago: string,
     *   tipo_pago: string,
     *   ciclo_meses: int,
     *   sucursales_contratadas: int,
     *   nuevas_sucursales: int,
     *   dias_restantes: int,
     *   monto_plan_ciclo: float,
     *   monto_prorrateo: float,
     *   monto: float,
     *   nota: ?string
     * }
     */
    protected function calculateSubscriptionQuote(
        Empresa $empresa,
        ?SubscriptionPlan $plan,
        int $requestedMonths,
        int $sucursalesContratadas,
        ?string $requestedMode = null
    ): array {
        $latestSub = $empresa->getLatestSubscriptionRecord();
        $hasActivePaid = $this->hasActivePaidSubscription($empresa, $latestSub);
        $currentMaxSucursales = max(1, (int) ($latestSub?->max_sucursales ?? $empresa->max_sucursales ?? 1));
        $sucursalesFinal = $hasActivePaid
            ? max($currentMaxSucursales, $sucursalesContratadas)
            : max(1, $sucursalesContratadas);

        $cicloMeses = $this->normalizeCicloMeses($plan, $requestedMonths);
        $diasRestantes = max(1, $empresa->dias_restantes_suscripcion);
        $nuevasSucursales = max(0, $sucursalesFinal - $currentMaxSucursales);

        if ($hasActivePaid && $requestedMode === 'proration') {
            $montoProrrateo = $nuevasSucursales > 0
                ? ($plan
                    ? $plan->calcularProrrateoSucursalExtra($nuevasSucursales, $diasRestantes)
                    : round($nuevasSucursales * (84.72 / 30) * $diasRestantes, 2))
                : 0.00;

            return [
                'has_active_paid' => true,
                'modo_pago' => 'proration',
                'tipo_pago' => 'proration',
                'ciclo_meses' => 0,
                'sucursales_contratadas' => $sucursalesFinal,
                'nuevas_sucursales' => $nuevasSucursales,
                'dias_restantes' => $diasRestantes,
                'monto_plan_ciclo' => 0.00,
                'monto_prorrateo' => round($montoProrrateo, 2),
                'monto' => round($montoProrrateo, 2),
                'nota' => "Prorrateo por {$diasRestantes} día(s) restante(s): {$nuevasSucursales} sucursal(es) extra.",
            ];
        }

        $montoPlanCiclo = $plan
            ? $plan->calcularPrecio($cicloMeses, $sucursalesFinal)
            : round((149.00 + (max(0, $sucursalesFinal - 1) * 84.72)) * $cicloMeses, 2);

        if ($hasActivePaid) {
            $montoProrrateo = $nuevasSucursales > 0
                ? ($plan
                    ? $plan->calcularProrrateoSucursalExtra($nuevasSucursales, $diasRestantes)
                    : round($nuevasSucursales * (84.72 / 30) * $diasRestantes, 2))
                : 0.00;

            $montoTotal = round($montoPlanCiclo + $montoProrrateo, 2);
            $mesLabel = $cicloMeses === 1 ? '1 mes' : "{$cicloMeses} meses";
            $nota = "Pago adelantado de {$mesLabel} ({$sucursalesFinal} sucursal(es))";
            if ($nuevasSucursales > 0) {
                $nota .= " + prorrateo {$nuevasSucursales} sucursal(es) extra ({$diasRestantes}d)";
            }

            return [
                'has_active_paid' => true,
                'modo_pago' => 'advance',
                'tipo_pago' => 'advance',
                'ciclo_meses' => $cicloMeses,
                'sucursales_contratadas' => $sucursalesFinal,
                'nuevas_sucursales' => $nuevasSucursales,
                'dias_restantes' => $diasRestantes,
                'monto_plan_ciclo' => round($montoPlanCiclo, 2),
                'monto_prorrateo' => round($montoProrrateo, 2),
                'monto' => $montoTotal,
                'nota' => $nota . '.',
            ];
        }

        $mesLabel = $cicloMeses === 1 ? '1 mes' : "{$cicloMeses} meses";

        return [
            'has_active_paid' => false,
            'modo_pago' => 'renewal',
            'tipo_pago' => 'subscription',
            'ciclo_meses' => $cicloMeses,
            'sucursales_contratadas' => $sucursalesFinal,
            'nuevas_sucursales' => 0,
            'dias_restantes' => $diasRestantes,
            'monto_plan_ciclo' => round($montoPlanCiclo, 2),
            'monto_prorrateo' => 0.00,
            'monto' => round($montoPlanCiclo, 2),
            'nota' => $cicloMeses > 1 ? "Renovación adelantada por {$mesLabel} ({$sucursalesFinal} sucursal(es))." : null,
        ];
    }

    /**
     * Vista de bloqueo por suscripción vencida.
     */
    public function expired()
    {
        return redirect()->route('admin.subscription.index');
    }

    /**
     * Registrar solicitud de renovación, adelanto de mensualidad o prorrateo de sucursales.
     */
    public function renew(Request $request)
    {
        $request->validate([
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'ciclo_meses' => 'nullable|integer|min:1|max:36',
            'sucursales_contratadas' => 'required|integer|min:1',
            'modo_pago' => 'nullable|in:advance,proration,renewal',
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
        if ($plan && ! $plan->hasAvailableSlotsForEmpresa($empresa->id)) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => 'Este plan ha alcanzado su límite de cupos disponibles o ya caducó.',
            ]);
        }

        $requestedMonths = (int) ($request->input('ciclo_meses') ?: ($plan?->ciclo_meses ?: 1));
        $quote = $this->calculateSubscriptionQuote(
            $empresa,
            $plan,
            $requestedMonths,
            (int) $request->sucursales_contratadas,
            $request->input('modo_pago')
        );

        if ($quote['monto'] <= 0) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => 'Para agregar sucursales por prorrateo debes incrementar al menos 1 sucursal adicional, o selecciona "Adelantar Mensualidad".',
            ]);
        }

        $comprobantePath = null;
        if ($request->hasFile('comprobante')) {
            $comprobantePath = $request->file('comprobante')->store('comprobantes_suscripcion', 'public');
        }

        $notasCompletas = trim(($request->notas ? $request->notas . ' | ' : '') . ($quote['nota'] ?? ''));

        SubscriptionPayment::create([
            'empresa_id' => $empresa->id,
            'plan_id' => $plan?->id,
            'tipo_pago' => $quote['tipo_pago'],
            'user_id' => $user->id,
            'monto' => $quote['monto'],
            'ciclo_meses' => $quote['ciclo_meses'],
            'sucursales_contratadas' => $quote['sucursales_contratadas'],
            'metodo_pago' => $request->metodo_pago,
            'referencia_pago' => $request->referencia_pago,
            'comprobante_path' => $comprobantePath,
            'estado' => 'pending',
            'notas' => $notasCompletas ?: null,
        ]);

        $successMessage = $quote['tipo_pago'] === 'advance'
            ? 'Tu pago adelantado ha sido registrado exitosamente. Al aprobarse se sumará a tu fecha de corte actual.'
            : 'Tu comprobante de pago ha sido registrado exitosamente. Será revisado y aprobado a la brevedad posible.';

        return back()->with('notification', [
            'type' => 'success',
            'message' => $successMessage,
        ]);
    }

    /**
     * Registrar solicitud de compra/recarga de mensajes de WhatsApp (mínimo 100 mensajes).
     */
    public function topupWhatsApp(Request $request)
    {
        $user = auth()->user();
        $empresa = $user?->empresa;
        if (! $empresa) {
            return response()->json(['error' => 'No se encontró la empresa asociada al usuario.'], 404);
        }

        $billingService = app(\App\Services\WhatsAppBillingService::class);
        $pricing = $billingService->resolvePricingForEmpresa($empresa);
        $minMensajes = max(100, (int) ($pricing['min_purchase_messages'] ?? 100));

        $validated = $request->validate([
            'mensajes' => "required|integer|min:{$minMensajes}|max:1000000",
            'metodo_pago' => 'required|string|max:50',
            'referencia_pago' => 'nullable|string|max:100',
            'comprobante' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'notas' => 'nullable|string|max:500',
        ], [
            'mensajes.min' => "La compra mínima es de {$minMensajes} mensajes.",
        ]);

        $mensajes = (int) $validated['mensajes'];
        $montoUsd = round($mensajes * (float) $pricing['unit_cost_usd'], 4);

        $comprobantePath = null;
        if ($request->hasFile('comprobante')) {
            $comprobantePath = $request->file('comprobante')->store('comprobantes_suscripcion', 'public');
        }

        $payment = SubscriptionPayment::create([
            'empresa_id' => $empresa->id,
            'plan_id' => $pricing['subscription']?->plan_id,
            'tipo_pago' => 'whatsapp_topup',
            'mensajes_comprados' => $mensajes,
            'user_id' => $user->id,
            'monto' => $montoUsd,
            'ciclo_meses' => 0,
            'sucursales_contratadas' => 1,
            'metodo_pago' => $validated['metodo_pago'],
            'referencia_pago' => $validated['referencia_pago'] ?? null,
            'comprobante_path' => $comprobantePath,
            'estado' => 'pending',
            'notas' => trim("Recarga WhatsApp: {$mensajes} mensajes (\${$montoUsd} USD). " . ($validated['notas'] ?? '')),
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'payment' => $payment,
                'message' => "Solicitud de recarga por {$mensajes} mensajes (\${$montoUsd} USD) registrada. Será acreditada al aprobarse el pago.",
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Solicitud de recarga por {$mensajes} mensajes (\${$montoUsd} USD) registrada.",
        ]);
    }

    /**
     * Crear orden de PayPal en la API.
     */
    public function createPaypalOrder(Request $request)
    {
        $request->validate([
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'ciclo_meses' => 'nullable|integer|min:1|max:36',
            'sucursales_contratadas' => 'required|integer|min:1',
            'modo_pago' => 'nullable|in:advance,proration,renewal',
        ]);

        $empresa = $request->user()->empresa;
        $planId = $request->input('plan_id');
        $plan = $planId ? SubscriptionPlan::find($planId) : SubscriptionPlan::getPlanRenovacionDefault();
        if ($plan && ! $plan->hasAvailableSlotsForEmpresa($empresa->id)) {
            return response()->json(['error' => 'Este plan ha alcanzado su límite de cupos disponibles o ya caducó.'], 422);
        }

        $requestedMonths = (int) ($request->input('ciclo_meses') ?: ($plan?->ciclo_meses ?: 1));
        $quote = $this->calculateSubscriptionQuote(
            $empresa,
            $plan,
            $requestedMonths,
            (int) $request->sucursales_contratadas,
            $request->input('modo_pago')
        );

        if ($quote['monto'] <= 0) {
            return response()->json(['error' => 'Selecciona al menos 1 sucursal extra para prorrateo o usa Adelantar Mensualidad.'], 422);
        }

        $monto = $quote['monto'];
        $descPrefix = match ($quote['tipo_pago']) {
            'advance' => "Adelanto ({$quote['ciclo_meses']} mes(es))",
            'proration' => 'Prorrateo sucursales',
            default => 'Renovación Suscripción',
        };

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
                            'currency_code' => 'MXN',
                            'value' => number_format($monto, 2, '.', ''),
                        ],
                        'description' => "{$descPrefix} Fix Sale - {$plan?->nombre} ({$empresa->razon_social})",
                    ],
                ],
            ]);

        return response()->json($orderResponse->json(), $orderResponse->status());
    }

    /**
     * Capturar orden de PayPal completada y activar o adelantar la suscripción inmediatamente.
     */
    public function capturePaypalOrder(Request $request, $orderId)
    {
        $request->validate([
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'ciclo_meses' => 'nullable|integer|min:1|max:36',
            'sucursales_contratadas' => 'required|integer|min:1',
            'modo_pago' => 'nullable|in:advance,proration,renewal',
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
            $existing = SubscriptionPayment::where('referencia_pago', $transactionId)->first();

            if (! $existing && $empresa) {
                $planId = $request->input('plan_id');
                $plan = $planId ? SubscriptionPlan::find($planId) : SubscriptionPlan::getPlanRenovacionDefault();
                $requestedMonths = (int) ($request->input('ciclo_meses') ?: ($plan?->ciclo_meses ?: 1));
                $quote = $this->calculateSubscriptionQuote(
                    $empresa,
                    $plan,
                    $requestedMonths,
                    (int) $request->sucursales_contratadas,
                    $request->input('modo_pago')
                );

                $notes = match ($quote['tipo_pago']) {
                    'advance' => 'Pago adelantado vía PayPal: ' . ($quote['nota'] ?? ''),
                    'proration' => 'Pago automático vía PayPal: ' . ($quote['nota'] ?? ''),
                    default => 'Pago automático procesado exitosamente vía PayPal SDK Checkout.',
                };

                $this->activateSubscription(
                    $empresa,
                    $plan,
                    $quote['ciclo_meses'],
                    $quote['sucursales_contratadas'],
                    $quote['monto'],
                    'paypal',
                    $transactionId,
                    $notes,
                    $quote['tipo_pago']
                );
            }
        }

        return response()->json($data, $captureResponse->status());
    }

    /**
     * Crear sesión de Checkout en Stripe (Pasarela Principal de Suscripciones SaaS).
     */
    public function createStripeCheckoutSession(Request $request)
    {
        $request->validate([
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'ciclo_meses' => 'nullable|integer|min:1|max:36',
            'sucursales_contratadas' => 'required|integer|min:1',
            'modo_pago' => 'nullable|in:advance,proration,renewal',
        ]);

        $user = $request->user();
        $empresa = $user->empresa;

        if (! $empresa) {
            return response()->json(['error' => 'No se encontró la empresa asociada al usuario.'], 404);
        }

        $masterEmpresa = Empresa::withoutGlobalScopes()->find(1) ?? $empresa;
        $secretKey = $masterEmpresa->stripe_secret_key;

        if (empty($secretKey)) {
            return response()->json([
                'error' => 'Las credenciales de Stripe no están configuradas en el sistema. Contacte al administrador.',
            ], 400);
        }

        $planId = $request->input('plan_id');
        $plan = $planId ? SubscriptionPlan::find($planId) : SubscriptionPlan::getPlanRenovacionDefault();
        if ($plan && ! $plan->hasAvailableSlotsForEmpresa($empresa->id)) {
            return response()->json(['error' => 'Este plan ha alcanzado su límite de cupos disponibles o ya caducó.'], 422);
        }

        $requestedMonths = (int) ($request->input('ciclo_meses') ?: ($plan?->ciclo_meses ?: 1));
        $quote = $this->calculateSubscriptionQuote(
            $empresa,
            $plan,
            $requestedMonths,
            (int) $request->sucursales_contratadas,
            $request->input('modo_pago')
        );

        if ($quote['monto'] <= 0) {
            return response()->json([
                'error' => 'Para agregar sucursales por prorrateo debes incrementar al menos 1 sucursal adicional, o selecciona "Adelantar Mensualidad".',
            ], 422);
        }

        $monto = $quote['monto'];
        $cicloMeses = $quote['ciclo_meses'];
        $sucursalesContratadas = $quote['sucursales_contratadas'];
        $nombrePlan = $plan?->nombre ?? "Plan {$cicloMeses} " . ($cicloMeses === 1 ? 'Mes' : 'Meses');
        $unitAmount = (int) round($monto * 100);

        $productName = match ($quote['tipo_pago']) {
            'advance' => "FixSale POS - Pago Adelantado: {$nombrePlan}",
            'proration' => "FixSale POS - Prorrateo de Sucursales ({$nombrePlan})",
            default => "FixSale POS - Suscripción: {$nombrePlan}",
        };
        $productDescription = match ($quote['tipo_pago']) {
            'advance' => "Adelanto de {$cicloMeses} mes(es) para {$sucursalesContratadas} sucursal(es) - {$empresa->razon_social}",
            'proration' => "Prorrateo por {$quote['dias_restantes']} día(s) para {$quote['nuevas_sucursales']} sucursal(es) adicional(es) - {$empresa->razon_social}",
            default => "Renovación por {$cicloMeses} mes(es) para {$sucursalesContratadas} sucursal(es) - {$empresa->razon_social}",
        };

        try {
            $sessionData = [
                'mode' => 'payment',
                'customer_email' => $empresa->email ?: $user->email,
                'client_reference_id' => (string) $empresa->id,
                'success_url' => route('admin.subscription.stripe.success') . '?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('admin.subscription.stripe.cancel'),
                'line_items' => [
                    [
                        'price_data' => [
                            'currency' => 'mxn',
                            'unit_amount' => $unitAmount,
                            'product_data' => [
                                'name' => $productName,
                                'description' => $productDescription,
                            ],
                        ],
                        'quantity' => 1,
                    ],
                ],
                'metadata' => [
                    'empresa_id' => (string) $empresa->id,
                    'user_id' => (string) $user->id,
                    'plan_id' => (string) ($plan?->id ?? ''),
                    'ciclo_meses' => (string) $cicloMeses,
                    'sucursales_contratadas' => (string) $sucursalesContratadas,
                    'tipo_pago' => $quote['tipo_pago'],
                    'modo_pago' => $quote['modo_pago'],
                    'monto' => (string) $monto,
                    'currency' => 'mxn',
                ],
            ];

            $response = \Illuminate\Support\Facades\Http::withToken($secretKey)
                ->asForm()
                ->post('https://api.stripe.com/v1/checkout/sessions', $sessionData);

            $data = $response->json();

            if (! $response->successful() || ! isset($data['url'])) {
                $errorMessage = $data['error']['message'] ?? 'Error desconocido al contactar Stripe API.';
                return response()->json(['error' => $errorMessage], 400);
            }

            return response()->json([
                'success' => true,
                'checkout_url' => $data['url'],
                'session_id' => $data['id'],
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Stripe Checkout Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error al comunicarse con Stripe: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Retorno exitoso de Stripe Checkout: verifica sesión, activa suscripción y notifica ventana principal.
     */
    public function stripeSuccess(Request $request)
    {
        $sessionId = $request->query('session_id');

        if (! $sessionId) {
            return $this->renderPopupClose(false, 'Identificador de sesión Stripe no encontrado.');
        }

        $user = $request->user();
        $empresa = $user?->empresa;
        $masterEmpresa = Empresa::withoutGlobalScopes()->find(1) ?? $empresa;
        $secretKey = $masterEmpresa?->stripe_secret_key;

        if (empty($secretKey)) {
            return $this->renderPopupClose(false, 'Configuración de Stripe no encontrada.');
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withToken($secretKey)
                ->get("https://api.stripe.com/v1/checkout/sessions/{$sessionId}");

            if (! $response->successful()) {
                return $this->renderPopupClose(false, 'No se pudo verificar la sesión con Stripe.');
            }

            $session = $response->json();

            if (($session['payment_status'] ?? '') === 'paid') {
                $existing = SubscriptionPayment::where('referencia_pago', $sessionId)->first();
                $meta = $session['metadata'] ?? [];
                $tipoPago = $meta['tipo_pago'] ?? 'subscription';
                $cicloMeses = (int) ($meta['ciclo_meses'] ?? 1);

                if (! $existing && $empresa) {
                    $planId = ! empty($meta['plan_id']) ? (int) $meta['plan_id'] : null;
                    $sucursales = (int) ($meta['sucursales_contratadas'] ?? ($empresa->max_sucursales ?? 1));
                    $monto = ($session['amount_total'] ?? 0) / 100;
                    $plan = $planId ? SubscriptionPlan::find($planId) : SubscriptionPlan::getPlanRenovacionDefault();
                    $notes = $tipoPago === 'advance'
                        ? "Pago adelantado de {$cicloMeses} mes(es) procesado y acreditado exitosamente vía Stripe Checkout."
                        : ($tipoPago === 'proration'
                            ? 'Prorrateo de sucursal(es) extra procesado exitosamente vía Stripe Checkout.'
                            : 'Pago automático procesado y acreditado exitosamente vía Stripe Checkout.');

                    $this->activateSubscription(
                        $empresa,
                        $plan,
                        $cicloMeses,
                        $sucursales,
                        $monto,
                        'stripe',
                        $sessionId,
                        $notes,
                        $tipoPago
                    );
                }

                if ($request->user() && ! empty($request->user()->telefono) && ! $request->user()->whatsapp_verified_at) {
                    return redirect()->route('verify-whatsapp.index')
                        ->with('status', '¡Pago con Stripe completado! Ahora verifica tu WhatsApp para vincular tu código QR.');
                }

                $popupMessage = $tipoPago === 'advance'
                    ? "¡Pago adelantado con Stripe completado! Se han sumado {$cicloMeses} mes(es) adicionales a tu fecha de vencimiento."
                    : '¡Pago con Stripe completado exitosamente! Tu suscripción ha sido activada y extendida de forma inmediata.';

                return $this->renderPopupClose(true, $popupMessage, $sessionId);
            }

            return $this->renderPopupClose(false, 'El pago en Stripe está en proceso de confirmación.');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Stripe Success Callback Error: ' . $e->getMessage());
            return $this->renderPopupClose(false, 'Error al verificar pago de Stripe: ' . $e->getMessage());
        }
    }

    /**
     * Retorno al cancelar en Stripe Checkout: cierra popup y notifica ventana principal.
     */
    public function stripeCancel(Request $request)
    {
        return $this->renderPopupClose(false, 'Has cancelado la operación de pago con Stripe.');
    }

    /**
     * Renderiza página HTML para comunicar resultado a ventana principal (postMessage) y cerrar ventana flotante.
     */
    protected function renderPopupClose(bool $success, string $message, ?string $sessionId = null)
    {
        $payload = json_encode([
            'type' => $success ? 'STRIPE_PAYMENT_SUCCESS' : 'STRIPE_PAYMENT_CANCEL',
            'success' => $success,
            'message' => $message,
            'sessionId' => $sessionId,
        ]);

        $redirectUrl = route('admin.subscription.index');
        $statusIcon = $success ? '✅' : 'ℹ️';
        $statusTitle = $success ? '¡Pago Exitoso!' : 'Pago Cancelado';
        $accentColor = $success ? '#16a34a' : '#f59e0b';

        $html = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{$statusTitle}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #f8fafc;
            color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
            border: 1px solid #e2e8f0;
            padding: 36px 28px;
            text-align: center;
            max-width: 440px;
            width: 100%;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 16px;
            line-height: 1;
        }
        h2 {
            margin: 0 0 10px;
            font-size: 20px;
            font-weight: 700;
            color: {$accentColor};
        }
        p {
            margin: 0 0 16px;
            font-size: 14px;
            color: #64748b;
            line-height: 1.5;
        }
        .spinner {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 2px solid #e2e8f0;
            border-top-color: {$accentColor};
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            vertical-align: middle;
            margin-right: 8px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .closing-text {
            font-size: 13px;
            color: #94a3b8;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">{$statusIcon}</div>
        <h2>{$statusTitle}</h2>
        <p>{$message}</p>
        <div class="closing-text">
            <span class="spinner"></span> Cerrando ventana y actualizando sistema...
        </div>
    </div>
    <script>
        const payload = {$payload};
        try {
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(payload, '*');
                setTimeout(() => {
                    window.close();
                }, 1200);
            } else {
                setTimeout(() => {
                    window.location.href = "{$redirectUrl}";
                }, 1500);
            }
        } catch (e) {
            window.location.href = "{$redirectUrl}";
        }
    </script>
</body>
</html>
HTML;

        return response($html)->header('Content-Type', 'text/html; charset=utf-8');
    }

    /**
     * Helper central para aplicar la activación o extensión de una suscripción tras pago aprobado.
     */
    protected function applySubscriptionActivation(
        Empresa $empresa,
        ?SubscriptionPlan $plan,
        int $cicloMeses,
        int $sucursalesContratadas,
        float $monto,
        string $tipoPago = 'subscription'
    ): Subscription {
        $latestSub = $empresa->getLatestSubscriptionRecord();
        $isProrationOnly = $tipoPago === 'proration';
        $effectiveMonths = max(1, $cicloMeses);
        $newMaxSucursales = max($empresa->max_sucursales ?? 1, $sucursalesContratadas);

        if ($isProrationOnly) {
            $nuevaFechaExpiracion = $latestSub?->fecha_vencimiento ?? $empresa->subscription_expires_at ?? now();
        } else {
            $baseDate = now();
            if ($latestSub?->fecha_vencimiento && $latestSub->fecha_vencimiento->isFuture()) {
                $baseDate = $latestSub->fecha_vencimiento->copy();
            }
            $nuevaFechaExpiracion = $baseDate->addMonths($effectiveMonths);
        }

        $empresaUpdate = [
            'subscription_status' => 'active',
            'subscription_expires_at' => $nuevaFechaExpiracion,
            'max_sucursales' => $newMaxSucursales,
        ];
        if (! $isProrationOnly) {
            $empresaUpdate['billing_cycle'] = $effectiveMonths . '_months';
        }
        $empresa->update($empresaUpdate);

        $nombrePlan = $isProrationOnly
            ? ($latestSub?->nombre_plan && $latestSub->nombre_plan !== 'Sucursales Adicionales' ? $latestSub->nombre_plan : ($plan?->nombre ?? 'Plan Mensual'))
            : ($plan?->nombre ?? Subscription::getNombrePlanByCiclo($effectiveMonths));

        $montoCicloPlan = $isProrationOnly
            ? ($latestSub?->monto_total ?: $monto)
            : ($plan ? $plan->calcularPrecio($effectiveMonths, $newMaxSucursales) : $monto);

        if ($latestSub) {
            $subUpdate = [
                'plan_id' => $plan?->id ?? $latestSub->plan_id,
                'nombre_plan' => $nombrePlan,
                'ciclo_meses' => $isProrationOnly ? ($latestSub->ciclo_meses ?: $effectiveMonths) : $effectiveMonths,
                'max_sucursales' => $newMaxSucursales,
                'monto_total' => $montoCicloPlan,
                'fecha_vencimiento' => $nuevaFechaExpiracion,
                'estado' => 'active',
            ];
            if (! $isProrationOnly) {
                $subUpdate['last_reminder_sent_at'] = null;
                $subUpdate['reminder_sent_count'] = 0;
            }
            $latestSub->update($subUpdate);

            return $latestSub;
        }

        return Subscription::create([
            'empresa_id' => $empresa->id,
            'plan_id' => $plan?->id,
            'nombre_plan' => $nombrePlan,
            'ciclo_meses' => $effectiveMonths,
            'max_sucursales' => $newMaxSucursales,
            'monto_total' => $montoCicloPlan,
            'fecha_inicio' => now(),
            'fecha_vencimiento' => $nuevaFechaExpiracion,
            'estado' => 'active',
        ]);
    }

    /**
     * Helper para activar y extender la suscripción luego de un pago aprobado (Stripe / PayPal).
     */
    protected function activateSubscription(
        Empresa $empresa,
        ?SubscriptionPlan $plan,
        int $cicloMeses,
        int $sucursalesContratadas,
        float $monto,
        string $metodoPago,
        string $transactionId,
        ?string $customNotes = null,
        string $tipoPago = 'subscription'
    ): void {
        \Illuminate\Support\Facades\DB::transaction(function () use (
            $empresa,
            $plan,
            $cicloMeses,
            $sucursalesContratadas,
            $monto,
            $metodoPago,
            $transactionId,
            $customNotes,
            $tipoPago
        ) {
            $subscription = $this->applySubscriptionActivation(
                $empresa,
                $plan,
                $cicloMeses,
                $sucursalesContratadas,
                $monto,
                $tipoPago
            );

            SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'plan_id' => $plan?->id,
                'tipo_pago' => $tipoPago,
                'empresa_id' => $empresa->id,
                'user_id' => auth()->id() ?? $empresa->users()->first()?->id ?? 1,
                'monto' => $monto,
                'ciclo_meses' => $tipoPago === 'proration' ? 0 : max(1, $cicloMeses),
                'sucursales_contratadas' => $sucursalesContratadas,
                'metodo_pago' => $metodoPago,
                'referencia_pago' => $transactionId,
                'estado' => 'approved',
                'aprobado_por' => auth()->id() ?? 1,
                'aprobado_at' => now(),
                'notas' => $customNotes ?? "Pago procesado exitosamente vía {$metodoPago}.",
            ]);
        });
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
                    'last_reminder_sent_at' => $sub?->last_reminder_sent_at?->format('Y-m-d H:i:s'),
                    'reminder_sent_count' => $sub?->reminder_sent_count ?? 0,
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
            'stripeBalance' => app(\App\Services\StripeBalanceService::class)->getBalance(),
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

            if (($payment->tipo_pago ?? 'subscription') === 'whatsapp_topup') {
                $mensajes = max(100, (int) ($payment->mensajes_comprados ?? 100));
                app(\App\Services\WhatsAppBillingService::class)->creditTopup(
                    $empresa->id,
                    $mensajes,
                    (float) $payment->monto,
                    $payment->user_id,
                    $payment->id,
                    'Recarga aprobada de mensajes WhatsApp'
                );

                $payment->update([
                    'estado' => 'approved',
                    'aprobado_por' => $user->id,
                    'fecha_aprobacion' => now(),
                ]);

                DB::commit();

                return back()->with('notification', [
                    'type' => 'success',
                    'message' => "Recarga de {$mensajes} mensajes aprobada y acreditada a {$empresa->nombre_comercial}.",
                ]);
            }

            $paymentTipo = $payment->tipo_pago ?? 'subscription';
            $isLegacyProration = $paymentTipo === 'subscription'
                && str_contains((string) $payment->notas, 'Prorrateo por')
                && ! str_contains((string) $payment->notas, 'Pago adelantado');
            $effectiveTipo = $isLegacyProration ? 'proration' : $paymentTipo;

            $plan = $payment->plan ?? ($payment->plan_id ? SubscriptionPlan::find($payment->plan_id) : SubscriptionPlan::getPlanRenovacionDefault());
            $subscription = $this->applySubscriptionActivation(
                $empresa,
                $plan,
                (int) $payment->ciclo_meses,
                (int) $payment->sucursales_contratadas,
                (float) $payment->monto,
                $effectiveTipo
            );

            $payment->update([
                'subscription_id' => $subscription->id,
                'plan_id' => $plan?->id,
                'tipo_pago' => $effectiveTipo,
                'estado' => 'approved',
                'aprobado_por' => $user->id,
                'aprobado_at' => now(),
            ]);

            DB::commit();

            $nuevaFechaVencimiento = $subscription->fecha_vencimiento;

            return back()->with('notification', [
                'type' => 'success',
                'message' => "Pago aprobado y suscripción activada para {$empresa->razon_social} hasta " . ($nuevaFechaVencimiento ? $nuevaFechaVencimiento->format('d/m/Y') : 'vigente') . '.',
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

    /**
     * Enviar recordatorio manual de vencimiento por WhatsApp a una empresa.
     */
    public function sendReminder(Request $request, Empresa $empresa)
    {
        $user = auth()->user();
        if ($user->empresa_id !== 1 && ! $user->hasRole('Super Administrador')) {
            abort(403, 'No autorizado.');
        }

        if ($empresa->isExemptFromSubscription()) {
            return back()->with('notification', [
                'type' => 'warning',
                'message' => 'Esta empresa está exenta de control de suscripción.',
            ]);
        }

        $sub = $empresa->getLatestSubscriptionRecord();
        if (! $sub || ! $sub->fecha_vencimiento) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => 'La empresa no posee una fecha de vencimiento registrada.',
            ]);
        }

        $telefono = $empresa->telefono;
        $rawCodigo = $empresa->paisTelefono?->codigo_telefonico
            ?? $empresa->pais?->codigo_telefonico
            ?? '52';
        $codigoPais = preg_replace('/[^0-9]/', '', $rawCodigo) ?: '52';

        if (empty($telefono)) {
            $adminUser = $empresa->users()->first();
            $telefono = $adminUser?->phone ?? $adminUser?->telefono;
        }

        if (empty($telefono)) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => "La empresa {$empresa->razon_social} no tiene ningún teléfono registrado.",
            ]);
        }

        $cleanPhone = preg_replace('/[^0-9]/', '', $telefono);
        if (! str_starts_with($cleanPhone, $codigoPais) && strlen($cleanPhone) <= 11) {
            $cleanPhone = ltrim($cleanPhone, '0');
            $cleanPhone = $codigoPais . $cleanPhone;
        }

        $diasRestantes = $empresa->dias_restantes_suscripcion;
        $fechaFormateada = $sub->fecha_vencimiento->format('d/m/Y');
        $nombrePlan = $sub->nombre_plan ?? 'Plan FixSale';
        $sucursales = $sub->max_sucursales ?? $empresa->max_sucursales ?? 1;

        $diasTexto = match ($diasRestantes) {
            0 => '¡VENCE HOY!',
            1 => '1 día restante (¡Mañana!)',
            default => "{$diasRestantes} días restantes",
        };

        $mensajePersonalizado = $request->input('mensaje');
        if (! empty($mensajePersonalizado)) {
            $mensaje = $mensajePersonalizado;
        } else {
            $mensaje = "🔔 *RECORDATORIO DE VENCIMIENTO FIXSALE*\n\n"
                . "Estimado/a *{$empresa->razon_social}*,\n\n"
                . "Le recordamos que su suscripción al plan *{$nombrePlan}* está próxima a vencer.\n\n"
                . "📅 *Fecha límite:* {$fechaFormateada}\n"
                . "⏳ *Tiempo restante:* {$diasTexto}\n"
                . "🏢 *Sucursales activas:* {$sucursales}\n\n"
                . "Para garantizar la continuidad operativa de su sistema y evitar la suspensión del servicio en sus sucursales, puede reportar su pago o renovar su plan en línea ingresando al panel:\n"
                . "👉 " . url('/admin/monitoring/subscription') . "\n\n"
                . "Si ya realizó su pago, por favor ignore este mensaje.\n"
                . "_Equipo de Soporte FixSale_";
        }

        try {
            $user = auth()->user();
            $sucursal = null;
            if ($user && $user->sucursal_id) {
                $sucursal = \App\Models\Sucursal::find($user->sucursal_id);
            }
            if (! $sucursal || empty($sucursal->whatsapp_instance)) {
                $sucursal = \App\Models\Sucursal::where('empresa_id', 1)
                    ->where('whatsapp_active', true)
                    ->where('whatsapp_status', 'connected')
                    ->whereNotNull('whatsapp_instance')
                    ->first()
                    ?? \App\Models\Sucursal::where('empresa_id', 1)->first();
            }

            $whatsappService = $sucursal
                ? \App\Services\WhatsAppService::forSucursal($sucursal)
                : new \App\Services\WhatsAppService(1);

            $whatsappService->setTimeout(10);
            $response = $whatsappService->sendMessage($cleanPhone, $mensaje, true);

            if (is_array($response) && (isset($response['error']) || (isset($response['status']) && $response['status'] >= 400))) {
                $errorMsg = is_string($response['error'] ?? null)
                    ? $response['error']
                    : ($response['message'] ?? 'No se pudo enviar el mensaje a través de WhatsApp.');

                return back()->with('notification', [
                    'type' => 'error',
                    'message' => "Error al enviar WhatsApp ({$whatsappService->getInstanceName()}): {$errorMsg}",
                ]);
            }

            $sub->update([
                'last_reminder_sent_at' => now(),
                'reminder_sent_count' => ($sub->reminder_sent_count ?? 0) + 1,
            ]);

            return back()->with('notification', [
                'type' => 'success',
                'message' => "Recordatorio de vencimiento enviado exitosamente por WhatsApp a {$empresa->razon_social} ({$cleanPhone}).",
            ]);
        } catch (\Throwable $e) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => "Error al enviar WhatsApp: " . $e->getMessage(),
            ]);
        }
    }
}
