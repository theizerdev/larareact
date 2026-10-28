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

        if ($request->user() && $request->user()->empresa_id) {
            $this->verificarSincronizacionBioTime($request->user());
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
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
                    'permissions' => $request->user()->getEffectivePermissions(),
                    'roles' => $request->user()->getAllRoleNames()->toArray(),
                    'groups' => $request->user()->groups()->where('status', true)->pluck('name')->toArray(),
                    'is_super_admin' => $request->user()->isSuperAdmin(),
                    ]) : null,
             
            ],
            'menuVisibility' => fn () => \App\Models\MenuVisibilitySetting::map(),
            // Módulos encendidos en esta instancia (config/modulos.php). Lo
            // apagado no se pinta en el menú y sus rutas responden 404.
            'modulos' => config('modulos'),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'locale' => $currentLocale,
            'regional_config' => fn () => \App\Services\RegionalConfigurationService::getCurrentConfiguration(),
            'translations' => file_exists($path = base_path('lang/'.$currentLocale.'.json'))
                ? json_decode(file_get_contents($path) ?: '{}', true)
                : [],
            'notification' => fn () => $request->session()->pull('notification'),
            'notifications' => $request->user()
                ? fn () => $request->user()->notifications()->latest()->limit(10)->get()->map(fn ($n) => [
                    'id' => $n->id,
                    'title' => __($n->data['title'] ?? '', $n->data['params'] ?? []),
                    'message' => __($n->data['message'] ?? '', $n->data['params'] ?? []),
                    'time' => $n->created_at->diffForHumans(),
                    'read' => ! is_null($n->read_at),
                    'url' => $this->resolveNotificationUrl($n),
                ])
                : [],
            'unreadNotificationsCount' => $request->user()
                ? fn () => $request->user()->unreadNotifications()->count()
                : 0,
        ];
    }

    /**
     * Resuelve la URL destino de una notificación para llevar al usuario a su origen.
     */
    private function resolveNotificationUrl($notification): ?string
    {
        if (! empty($notification->data['url'])) {
            return $notification->data['url'];
        }

        return match ($notification->type) {
            \App\Notifications\KycValidacionCompletadaNotification::class => '/admin/validaciones',
            \App\Notifications\DescansoExcedidoNotification::class => '/admin/asistencia/bitacora',
            \App\Notifications\VisitaAccesoRegistradaNotification::class => '/admin/visitas-accesos',
            \App\Notifications\VisitaAutorizacionSolicitadaNotification::class => '/admin/visitas-accesos',
            \App\Notifications\VisitaAutorizacionRespondidaNotification::class => '/admin/visitas-accesos',
            \App\Notifications\NuevoUsuarioNotification::class => '/admin/usuarios',
            \App\Notifications\WelcomeNotification::class => '/dashboard',
            default => null,
        };
    }

    /**
     * Sincroniza automáticamente empleados de BioTime al entrar al sistema,
     * respetando una ventana de cooldown de 15 minutos por empresa.
     */
    private function verificarSincronizacionBioTime($user): void
    {
        $cacheKey = "biotime:auto_sync:empresa_{$user->empresa_id}";

        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            return;
        }

        $empresa = $user->empresa;
        if (! $empresa || ! $empresa->biotime_active) {
            return;
        }

        \Illuminate\Support\Facades\Cache::put($cacheKey, now()->toIso8601String(), now()->addMinutes(15));
        dispatch(new \App\Jobs\SyncBioTimeEmployeesJob($empresa->id))->afterResponse();
    }
}
