<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\Console\Input\StringInput;
use Symfony\Component\Console\Output\BufferedOutput;

class TerminalController extends Controller
{
    /**
     * Muestra la consola interactiva de comandos Artisan (Acceso exclusivo a Super Administrador dueño).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isSuperAdmin()) {
            abort(403, 'Acceso restringido únicamente al Super Administrador dueño del sistema.');
        }

        $empresas = Empresa::on('landlord')
            ->select('id', 'razon_social', 'nombre_comercial', 'whatsapp_instance', 'status')
            ->orderBy('id', 'asc')
            ->get();

        $systemInfo = [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'server_os' => PHP_OS_FAMILY . ' (' . php_uname('s') . ' ' . php_uname('r') . ')',
            'hostname' => gethostname(),
            'default_connection' => DB::getDefaultConnection(),
            'database_name' => DB::connection()->getDatabaseName(),
            'memory_usage' => round(memory_get_usage(true) / 1024 / 1024, 2) . ' MB',
            'server_time' => now()->format('Y-m-d H:i:s T'),
            'environment' => app()->environment(),
        ];

        $presets = [
            [
                'category' => 'WhatsApp & Microservicios',
                'color' => 'emerald',
                'commands' => [
                    [
                        'name' => 'Sincronizar Todas las Instancias',
                        'command' => 'whatsapp:create-instance',
                        'description' => 'Crea, conecta e inicializa las instancias de WhatsApp para todas las empresas activas.',
                        'requires_param' => false,
                    ],
                    [
                        'name' => 'Sincronizar Empresa Específica',
                        'command' => 'whatsapp:create-instance {empresa_id}',
                        'description' => 'Inicializa la instancia de WhatsApp para una empresa seleccionada.',
                        'requires_param' => true,
                        'param_type' => 'empresa_id',
                    ],
                    [
                        'name' => 'Forzar Regeneración de Empresa',
                        'command' => 'whatsapp:create-instance {empresa_id} --force',
                        'description' => 'Regenera token, URL local y reconecta la instancia de la empresa en el motor.',
                        'requires_param' => true,
                        'param_type' => 'empresa_id',
                    ],
                    [
                        'name' => 'Verificar Salud de WhatsApp',
                        'command' => 'whatsapp:check-health',
                        'description' => 'Ejecuta un diagnóstico de conexión contra el microservicio local de WhatsApp.',
                        'requires_param' => false,
                    ],
                ],
            ],
            [
                'category' => 'Caché & Optimización',
                'color' => 'indigo',
                'commands' => [
                    [
                        'name' => 'Limpiar Todo (optimize:clear)',
                        'command' => 'optimize:clear',
                        'description' => 'Borra configuración, rutas, vistas, eventos y archivos compilados en caché.',
                        'requires_param' => false,
                    ],
                    [
                        'name' => 'Optimizar Configuración (config:cache)',
                        'command' => 'config:cache',
                        'description' => 'Genera un archivo compilado de toda la configuración para máxima velocidad.',
                        'requires_param' => false,
                    ],
                    [
                        'name' => 'Optimizar Rutas (route:cache)',
                        'command' => 'route:cache',
                        'description' => 'Compila el árbol completo de rutas para acelerar las peticiones HTTP.',
                        'requires_param' => false,
                    ],
                    [
                        'name' => 'Precompilar Vistas (view:cache)',
                        'command' => 'view:cache',
                        'description' => 'Precompila todas las plantillas Blade para reducir la carga de renderizado.',
                        'requires_param' => false,
                    ],
                    [
                        'name' => 'Limpiar Caché de la Aplicación',
                        'command' => 'cache:clear',
                        'description' => 'Limpia los datos almacenados en el backend de caché de la base de datos.',
                        'requires_param' => false,
                    ],
                ],
            ],
            [
                'category' => 'Colas & Procesos en Segundo Plano',
                'color' => 'amber',
                'commands' => [
                    [
                        'name' => 'Reiniciar Workers (queue:restart)',
                        'command' => 'queue:restart',
                        'description' => 'Notifica a todos los procesos de colas para que se recarguen de forma limpia.',
                        'requires_param' => false,
                    ],
                    [
                        'name' => 'Listar Trabajos Fallidos (queue:failed)',
                        'command' => 'queue:failed',
                        'description' => 'Muestra los jobs que han fallado en la cola con su detalle de error.',
                        'requires_param' => false,
                    ],
                    [
                        'name' => 'Reintentar Todos los Trabajos (queue:retry all)',
                        'command' => 'queue:retry all',
                        'description' => 'Reencola todos los trabajos fallidos para procesarlos nuevamente.',
                        'requires_param' => false,
                    ],
                    [
                        'name' => 'Procesar Cola Pendiente (queue:work)',
                        'command' => 'queue:work --stop-when-empty',
                        'description' => 'Ejecuta inmediatamente los trabajos acumulados en la cola hasta vaciarla.',
                        'requires_param' => false,
                    ],
                ],
            ],
            [
                'category' => 'Base de Datos & Multi-Tenancy',
                'color' => 'cyan',
                'commands' => [
                    [
                        'name' => 'Migraciones Centrales (migrate --force)',
                        'command' => 'migrate --force',
                        'description' => 'Aplica migraciones pendientes en la base de datos central (Landlord).',
                        'requires_param' => false,
                    ],
                    [
                        'name' => 'Migraciones Inquilinos (tenants:migrate)',
                        'command' => 'tenants:migrate',
                        'description' => 'Ejecuta migraciones pendientes en todas las bases de datos de inquilinos.',
                        'requires_param' => false,
                    ],
                    [
                        'name' => 'Estadísticas Financieras y Cajas',
                        'command' => 'check:financial-stats',
                        'description' => 'Audita y verifica la integridad de totales de cajas y movimientos.',
                        'requires_param' => false,
                    ],
                ],
            ],
            [
                'category' => 'Diagnóstico & Mantenimiento',
                'color' => 'purple',
                'commands' => [
                    [
                        'name' => 'Diagnóstico del Sistema (about)',
                        'command' => 'about',
                        'description' => 'Muestra un informe completo sobre el estado de Laravel, PHP, base de datos y paquetes.',
                        'requires_param' => false,
                    ],
                    [
                        'name' => 'Verificar Vencimiento de Suscripciones',
                        'command' => 'subscriptions:check-expirations',
                        'description' => 'Evalúa las fechas de planes y actualiza estados de empresas vencidas.',
                        'requires_param' => false,
                    ],
                    [
                        'name' => 'Listar Todos los Comandos Artisan (list)',
                        'command' => 'list',
                        'description' => 'Muestra el catálogo general de comandos disponibles en la aplicación.',
                        'requires_param' => false,
                    ],
                ],
            ],
        ];

        return Inertia::render('admin/monitoring/terminal/index', [
            'system_info' => $systemInfo,
            'empresas' => $empresas,
            'presets' => $presets,
        ]);
    }

    /**
     * Ejecuta un comando Artisan de forma segura y devuelve la salida formateada.
     */
    public function execute(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'error' => 'Acceso no autorizado. Se requiere rol de Super Administrador.',
            ], 403);
        }

        $validated = $request->validate([
            'command' => 'required|string|max:1000',
        ]);

        $rawCommand = trim($validated['command']);
        // Eliminar prefijos comunes como 'php artisan' o 'artisan' si el usuario los escribió
        $cleanCommand = preg_replace('/^(php\s+artisan|artisan)\s+/i', '', $rawCommand);
        $cleanCommand = trim($cleanCommand);

        if (empty($cleanCommand)) {
            return response()->json([
                'success' => false,
                'error' => 'Debe ingresar un comando válido.',
            ], 422);
        }

        // Filtro de seguridad: Bloquear comandos destructivos a nivel de SO
        $dangerousTokens = [
            'rm ', 'rmdir', 'unlink', 'sudo', 'chmod', 'chown', 'kill', 'pkill',
            'systemctl', 'mkfs', 'dd ', 'format', 'shutdown', 'reboot', 'init ',
            'eval(', 'exec(', 'shell_exec', 'passthru', 'popen', 'proc_open',
            '> /dev/', '| sh', '| bash', 'curl http', 'wget http',
        ];

        foreach ($dangerousTokens as $token) {
            if (stripos($cleanCommand, $token) !== false) {
                return response()->json([
                    'success' => false,
                    'error' => "El comando contiene caracteres o palabras clave no permitidas por seguridad: '{$token}'",
                ], 422);
            }
        }

        $startTime = microtime(true);
        $outputBuffer = new BufferedOutput();

        try {
            // Configurar Input de consola
            $input = new StringInput($cleanCommand);
            $input->setInteractive(false);

            $exitCode = Artisan::handle($input, $outputBuffer);
            $output = $outputBuffer->fetch();
            $durationMs = round((microtime(true) - $startTime) * 1000, 2);

            // Registrar en bitácora / log de auditoría
            Log::info("SuperAdmin (User #{$user->id}: {$user->name}) ejecutó comando Artisan vía Terminal Web: '{$cleanCommand}' (Exit code: {$exitCode}, {$durationMs}ms)");

            return response()->json([
                'success' => ($exitCode === 0),
                'command' => $cleanCommand,
                'exit_code' => $exitCode,
                'output' => ! empty(trim($output)) ? $output : 'Comando ejecutado exitosamente sin salida en consola.',
                'duration_ms' => $durationMs,
                'executed_at' => now()->format('Y-m-d H:i:s'),
                'executed_by' => $user->name,
            ]);
        } catch (\Throwable $e) {
            $durationMs = round((microtime(true) - $startTime) * 1000, 2);
            $errorOutput = $outputBuffer->fetch();

            Log::error("Error al ejecutar comando Artisan '{$cleanCommand}': " . $e->getMessage());

            return response()->json([
                'success' => false,
                'command' => $cleanCommand,
                'exit_code' => 1,
                'output' => ! empty($errorOutput) ? ($errorOutput . "\n" . $e->getMessage()) : $e->getMessage(),
                'error' => $e->getMessage(),
                'duration_ms' => $durationMs,
                'executed_at' => now()->format('Y-m-d H:i:s'),
                'executed_by' => $user->name,
            ], 200);
        }
    }
}
