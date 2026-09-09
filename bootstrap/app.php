<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RegionalConfiguration;
use App\Http\Middleware\SetLocale;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
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
        // Verificar tiempos de descanso de empleados y notificar si exceden límite
        $schedule->command('asistencia:verificar-descansos')
            ->everyMinute()
            ->withoutOverlapping()
            ->onOneServer()
            ->appendOutputTo(storage_path('logs/asistencia-descansos.log'));

        // Espejo de solo lectura de BioTime PRO (relojes, empleados, catálogos
        // y marcajes). Incremental: sólo trae lo nuevo desde la última corrida.
        $schedule->command('biotime:sync')
            ->everyFifteenMinutes()
            ->withoutOverlapping(10)
            ->onOneServer()
            ->runInBackground()
            ->appendOutputTo(storage_path('logs/biotime-sync.log'));
    })
    ->withMiddleware(function (Middleware $middleware): void {
        // La app corre detrás del Apache del host, que termina TLS y reenvía por HTTP
        // a este contenedor (ver /etc/apache2/sites-available/*-le-ssl.conf, que ya
        // envía X-Forwarded-Proto: https). Sin esto, Laravel genera URLs absolutas con
        // esquema http:// y el navegador bloquea las peticiones por Mixed Content.
        $middleware->trustProxies(at: '*');

        $middleware->web(prepend: [
            RegionalConfiguration::class,
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

            // Excepciones que el framework ya traduce a la respuesta correcta
            // (422 con bag de errores, 401, 403, redirects de CSRF, 404...).
            // No deben caer en el manejador genérico de 500.
            if ($e instanceof ValidationException
                || $e instanceof AuthenticationException
                || $e instanceof AuthorizationException
                || $e instanceof HttpResponseException
                || $e instanceof TokenMismatchException
                || $e instanceof ModelNotFoundException) {
                return null;
            }

            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();
                if (in_array($status, [500, 503, 404, 403, 419])) {
                    return inertia('Error', ['status' => $status])
                        ->toResponse($request)
                        ->setStatusCode($status);
                }

                return null;
            }

            // Incidencia 2: cualquier OTRA excepción no controlada en una
            // petición web/Inertia (p. ej. QueryException por un fallo de
            // escritura). En producción se rinde una página de error limpia con
            // HTTP 500 real, en vez del HTML crudo de Symfony que Inertia
            // mostraría como modal. El frontend recibe un estado semántico y
            // jamás un falso 2xx. En local se deja pasar para ver el trace.
            if (! config('app.debug')) {
                return inertia('Error', ['status' => 500])
                    ->toResponse($request)
                    ->setStatusCode(500);
            }

            return null;
        });
    })->create();
