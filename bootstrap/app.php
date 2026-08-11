<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetLocale;
use App\Models\WhatsAppMessage;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware(['web', 'auth'])
                ->prefix('admin')
                ->name('admin.')
                ->group(base_path('routes/admin.php'));
        },
    )
    ->withSchedule(function (Schedule $schedule): void {
        // Notificaciones automáticas
        $schedule->command('notifications:send-automatic')->dailyAt('08:00');

        // Tasas de cambio BCV dos veces al día
        $schedule->command('exchange:fetch')
            ->dailyAt('10:00')
            ->timezone('America/Caracas');

        $schedule->command('exchange:fetch')
            ->dailyAt('14:00')
            ->timezone('America/Caracas');

        // Mensajes WhatsApp programados cada minuto
        $schedule->command('whatsapp:process-scheduled')
            ->everyMinute()
            ->timezone('America/Caracas')
            ->withoutOverlapping()
            ->onOneServer();

        // Reenvío automático de mensajes fallidos cada hora
        $schedule->command('whatsapp:schedule-retry')
            ->hourly()
            ->timezone('America/Caracas')
            ->withoutOverlapping()
            ->onOneServer()
            ->when(fn () => WhatsAppMessage::where('direction', 'outbound')->retryable()->exists());

        // Recordatorios de citas cada 15 minutos
        $schedule->command('citas:procesar-recordatorios')
            ->everyFifteenMinutes()
            ->timezone('America/Caracas')
            ->withoutOverlapping()
            ->onOneServer();

        // Procesar confirmaciones cada hora
        $schedule->command('confirmations:process --type=all')
            ->hourly()
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/confirmations.log'));

        // Actualizar estados de citas cada 5 minutos
        $schedule->command('citas:update-estados')
            ->everyFiveMinutes()
            ->withoutOverlapping()
            ->onOneServer();

        // Procesar dilataciones de consultas cada minuto
        $schedule->command('consultas:procesar-dilataciones')
            ->everyMinute()
            ->withoutOverlapping()
            ->onOneServer();

        // Verificar tiempos de descanso de empleados y notificar si exceden límite
        $schedule->command('asistencia:verificar-descansos')
            ->everyMinute()
            ->withoutOverlapping()
            ->onOneServer()
            ->appendOutputTo(storage_path('logs/asistencia-descansos.log'));
    })
    ->withMiddleware(function (Middleware $middleware): void {
        // La app corre detrás del Apache del host, que termina TLS y reenvía por HTTP
        // a este contenedor (ver /etc/apache2/sites-available/*-le-ssl.conf, que ya
        // envía X-Forwarded-Proto: https). Sin esto, Laravel genera URLs absolutas con
        // esquema http:// y el navegador bloquea las peticiones por Mixed Content.
        $middleware->trustProxies(at: '*');

        $middleware->web(prepend: [
            \App\Http\Middleware\RegionalConfiguration::class,
        ]);

        $middleware->web(append: [
            SetLocale::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'preregistro/*',
            'preregistro-productor/*',
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->wantsJson(),
        );

        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->wantsJson()) {
                return null;
            }

            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();
                if (in_array($status, [500, 503, 404, 403, 419])) {
                    return inertia('Error', ['status' => $status])
                        ->toResponse($request)
                        ->setStatusCode($status);
                }
            }

            return null;
        });
    })->create();
