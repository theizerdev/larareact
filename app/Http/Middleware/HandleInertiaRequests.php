<?php

namespace App\Http\Middleware;

use App\Models\Empresa;
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
     
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user() ? array_merge($request->user()->toArray(), [
                    // El superadmin no está atado a una sucursal: los formularios
                    // deben dejarle elegirla (bloquean el campo si viene llena).
                    ...($request->user()->isSuperAdmin() ? ['sucursal_id' => null] : []),
                    'empresa' => $request->user()->empresa ? [
                        'id' => $request->user()->empresa->id,
                        'razon_social' => $request->user()->empresa->nombre_comercial ?: $request->user()->empresa->razon_social,
                        // En la vista de todas las empresas el superadmin ve el logo de Hoshō.
                        'logo' => $this->vistaGlobal($request) ? null : $request->user()->empresa->logo,
                        'logo_mini' => $this->vistaGlobal($request) ? null : $request->user()->empresa->logo_mini,
                        'mapbox_api_key' => $request->user()->empresa->mapbox_api_key,
                        'mapbox_active' => (bool) $request->user()->empresa->mapbox_active,
                        'google_maps_api_key' => $request->user()->empresa->google_maps_api_key,
                        'google_maps_active' => (bool) $request->user()->empresa->google_maps_active,
                    ] : null,
                    // El monitoreo es de toda la plataforma (ver SoloSuperAdmin):
                    // fuera del superadmin no se ofrece en el menú.
                    'permissions' => $request->user()->getAllPermissions()->pluck('name')
                        ->when(! $request->user()->isSuperAdmin(), fn ($p) => $p->reject(fn ($n) => str_starts_with($n, 'monitoreo.')))
                        ->values()->toArray(),
                    'is_super_admin' => $request->user()->isSuperAdmin(),
                ]) : null,
            ],
            // Selector de empresa del Super Administrador (null para los demás).
            'tenant' => fn () => $request->user()?->isSuperAdmin() ? [
                'empresa_activa_id' => $request->user()->empresaActiva?->id,
                'empresas' => Empresa::withoutTenant()->orderBy('razon_social')
                    ->get(['id', 'razon_social', 'nombre_comercial', 'logo_mini', 'status'])
                    ->map(fn (Empresa $e) => [
                        'id' => $e->id,
                        'nombre' => $e->nombre_comercial ?: $e->razon_social,
                        'logo_mini' => $e->logo_mini,
                        'status' => (bool) $e->status,
                    ]),
            ] : null,
            // Logo de la pantalla de login: la empresa que el navegador recuerda
            // de su liga de acceso (/e/{slug}) o del último inicio de sesión.
            'branding' => fn () => $request->user() ? null : $this->brandingInvitado($request),
            'menuVisibility' => fn () => \App\Models\MenuVisibilitySetting::map(),
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

    private function vistaGlobal(Request $request): bool
    {
        return $request->user()->isSuperAdmin() && ! $request->user()->empresaActiva;
    }

    private function brandingInvitado(Request $request): ?array
    {
        $slug = $request->cookie(EmpresaActiva::COOKIE);
        $empresa = $slug ? Empresa::withoutTenant()->where('slug', $slug)->where('status', true)->first() : null;

        return $empresa ? [
            'nombre' => $empresa->nombre_comercial ?: $empresa->razon_social,
            'logo' => $empresa->logo ?: $empresa->logo_mini,
        ] : null;
    }
}
