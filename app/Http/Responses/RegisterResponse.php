<?php

namespace App\Http\Responses;

use App\Models\Empresa;
use App\Models\SubscriptionPlan;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function toResponse($request)
    {
        $user = $request->user();
        $checkoutPlanId = session()->pull('checkout_plan_id');
        $checkoutMethod = session()->pull('checkout_payment_method');

        // Si en el checkout seleccionó un plan de pago, iniciar el pago directo desde el checkout
        if ($user && $checkoutPlanId) {
            $plan = SubscriptionPlan::find($checkoutPlanId);
            $empresa = $user->empresa;

            if ($plan && $empresa && $checkoutMethod === 'stripe') {
                $masterEmpresa = Empresa::withoutGlobalScopes()->find(1) ?? $empresa;
                $secretKey = $masterEmpresa->stripe_secret_key;

                if (! empty($secretKey)) {
                    $cicloMeses = max(1, (int) ($plan->ciclo_meses ?: 1));
                    $monto = max(1.00, $plan->calcularPrecio($cicloMeses, 1));
                    $unitAmount = (int) round($monto * 100);

                    $response = Http::withBasicAuth($secretKey, '')
                        ->asForm()
                        ->post('https://api.stripe.com/v1/checkout/sessions', [
                            'payment_method_types[0]' => 'card',
                            'mode' => 'payment',
                            'success_url' => route('admin.subscription.stripe.success') . '?session_id={CHECKOUT_SESSION_ID}',
                            'cancel_url' => route('admin.subscription.index', ['plan_id' => $plan->id]),
                            'client_reference_id' => $empresa->id,
                            'customer_email' => $user->email,
                            'line_items[0][price_data][currency]' => 'mxn',
                            'line_items[0][price_data][product_data][name]' => "Suscripción FixSale - {$plan->nombre}",
                            'line_items[0][price_data][unit_amount]' => $unitAmount,
                            'line_items[0][quantity]' => 1,
                            'metadata[empresa_id]' => $empresa->id,
                            'metadata[plan_id]' => $plan->id,
                            'metadata[ciclo_meses]' => $cicloMeses,
                            'metadata[sucursales_contratadas]' => 1,
                        ]);

                    if ($response->successful() && ! empty($response->json()['url'])) {
                        return Inertia::location($response->json()['url']);
                    }
                }
            }

            return redirect()->route('admin.subscription.index', [
                'plan_id' => $checkoutPlanId,
                'method' => $checkoutMethod,
            ]);
        }

        if ($user && ! empty($user->telefono) && ! $user->whatsapp_verified_at) {
            return redirect()->route('verify-whatsapp.index');
        }

        // Evitar redirigir a endpoints JSON o de polling si quedaron guardados en la sesión
        $intended = session()->get('url.intended');
        if ($intended && (
            str_contains($intended, '/status') ||
            str_contains($intended, '/queue-stats') ||
            str_contains($intended, '/api/') ||
            str_contains($intended, '/diagnostic') ||
            str_contains($intended, '/ping') ||
            str_ends_with($intended, '.json')
        )) {
            session()->forget('url.intended');
        }

        return redirect()->intended(config('fortify.home'));
    }
}
