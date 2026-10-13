<?php

namespace App\Http\Middleware;

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
        $daysUntilExpired = null;
        if ($user) {
            $vigencia = \App\Models\ConfiguracionSox::current($user->empresa_id)->password_expires_days;
            $daysUntilExpired = $user->daysUntilPasswordExpires($vigencia);
        }
     
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'empresa' => $user->empresa ? [
                        'id' => $user->empresa->id,
                        'logo' => $user->empresa->logo,
                        'logo_mini' => $user->empresa->logo_mini,
                        'mapbox_api_key' => $user->empresa->mapbox_api_key,
                        'mapbox_active' => (bool) $user->empresa->mapbox_active,
                        'google_maps_api_key' => $user->empresa->google_maps_api_key,
                        'google_maps_active' => (bool) $user->empresa->google_maps_active,
                    ] : null,
                    'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                    'password_days_remaining' => $daysUntilExpired,
                ]) : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'locale' => $currentLocale,
            'regional_config' => fn () => \App\Services\RegionalConfigurationService::getCurrentConfiguration(),
            'translations' => file_exists($path = base_path('lang/'.$currentLocale.'.json'))
                ? json_decode(file_get_contents($path) ?: '{}', true)
                : [],
            'notification' => fn () => $request->session()->pull('notification'),
        ];
    }
}
