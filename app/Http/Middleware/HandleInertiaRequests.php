<?php

namespace App\Http\Middleware;

use App\Models\Producto;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $currentLocale = app()->getLocale();
       

        $user = $request->user();
        $empresa = $user?->empresa;
        if (!$empresa && $user?->empresa_id) {
            $empresa = \App\Models\Empresa::find($user->empresa_id);
        }
        $pais = $empresa?->pais ?? ($empresa?->pais_id ? \App\Models\Pais::find($empresa->pais_id) : null);
        $currencySymbol = $pais?->simbolo_moneda ?? '$';
        $currencyCode = $pais?->moneda_principal ?? 'MXN';
        $countryCode = strtoupper($pais?->codigo_iso2 ?? 'MX');
        $isVenezuela = $countryCode === 'VE' || ($pais && str_contains(strtolower($pais->nombre), 'venezuela'));

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'currencySymbol' => $currencySymbol,
            'currencyCode' => $currencyCode,
            'countryCode' => $countryCode,
            'isVenezuela' => $isVenezuela,
            'auth' => [
                'user' => $request->user() ? array_merge($request->user()->toArray(), [
                    'empresa' => $request->user()->empresa ? [
                        'id' => $request->user()->empresa->id,
                        'logo' => $request->user()->empresa->logo,
                        'logo_mini' => $request->user()->empresa->logo_mini,
                        'mapbox_api_key' => $request->user()->empresa->mapbox_api_key,
                        'mapbox_active' => (bool) $request->user()->empresa->mapbox_active,
                        'google_maps_api_key' => $request->user()->empresa->google_maps_api_key,
                        'google_maps_active' => (bool) $request->user()->empresa->google_maps_active,
                    ] : null,
                    'permissions' => $request->user()->getAllPermissions()->pluck('name')->toArray(),
                ]) : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'locale' => $currentLocale,
            'translations' => file_exists($path = base_path('lang/'.$currentLocale.'.json'))
                ? json_decode(file_get_contents($path) ?: '{}', true)
                : [],
            'notification' => fn () => $request->session()->pull('notification'),
            'low_stock_count' => fn () => $request->user()
                ? Producto::where('empresa_id', $request->user()->empresa_id)
                    ->where('sucursal_id', $request->user()->sucursal_id)
                    ->where('usa_inventario', true)
                    ->where('estado', true)
                    ->where('stock_minimo', '>', 0)
                    ->whereColumn('stock', '<=', 'stock_minimo')
                    ->count()
                : 0,
            'cash_register_alert' => fn () => $this->getCashRegisterAlert($request),
            'subscription' => fn () => $empresa ? [
                'is_exempt' => $empresa->isExemptFromSubscription(),
                'status' => $empresa->subscription_status,
                'status_label' => $empresa->estado_suscripcion_legible,
                'days_left' => $empresa->dias_restantes_suscripcion,
                'on_trial' => $empresa->isOnTrial(),
                'is_expired' => $empresa->isSubscriptionExpired(),
                'trial_ends_at' => $empresa->trial_ends_at?->format('Y-m-d H:i:s'),
                'expires_at' => $empresa->subscription_expires_at?->format('Y-m-d H:i:s'),
                'max_sucursales' => $empresa->max_sucursales ?? 1,
            ] : null,
        ];
    }

    protected function getCashRegisterAlert(Request $request): ?array
    {
        $user = $request->user();
        if (! $user) {
            return null;
        }

        $isAdmin = $user->hasRole('Administrador') || $user->hasRole('Super Administrador');
        if (! $isAdmin) {
            return null;
        }

        $hasOpenRegister = \App\Models\CashRegister::where('empresa_id', $user->empresa_id)
            ->where('status', 'open')
            ->exists();

        if (! $hasOpenRegister) {
            return [
                'show' => true,
                'message' => __('No hay ninguna caja aperturada para el día de hoy en su empresa.'),
            ];
        }

        return null;
    }
}
