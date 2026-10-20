<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DatabaseExportService;
use App\Services\DatabaseImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class DbMonitoringController extends Controller
{
    /**
     * Muestra el panel principal de monitoreo de base de datos.
     */
    public function index(Request $request)
    {
        // Obtener estadísticas reales del motor de base de datos
        $dbConnection = config('database.default');
        $dbDriver = config("database.connections.{$dbConnection}.driver");
        $version = 'Desconocido';

        try {
            if ($dbDriver === 'mysql') {
                $versionRow = DB::select('SELECT VERSION() as version');
                $version = $versionRow[0]->version ?? 'MySQL';
            } elseif ($dbDriver === 'sqlite') {
                $versionRow = DB::select('select sqlite_version() as version');
                $version = $versionRow[0]->version ?? 'SQLite';
            }
        } catch (\Throwable $e) {
            Log::error('Error obteniendo versión de BD: ' . $e->getMessage());
        }

        $tablesData = $this->getTablesData();

        return inertia('admin/monitoring/database/index', [
            'dbInfo' => [
                'connection' => $dbConnection,
                'driver' => $dbDriver,
                'version' => $version,
                'total_tables' => count($tablesData['tables']),
                'total_size_mb' => $tablesData['total_size_mb'],
                'total_rows' => $tablesData['total_rows'],
                'tables' => $tablesData['tables'],
            ],
        ]);
    }

    /**
     * Retorna los datos de tablas en formato JSON para el modal o consumo asíncrono.
     */
    public function getTables()
    {
        return response()->json($this->getTablesData());
    }

    /**
     * Extrae información de tablas, tamaño y filas de forma universal (SHOW TABLE STATUS).
     */
    public function getTablesData(): array
    {
        $dbConnection = config('database.default');
        $dbDriver = config("database.connections.{$dbConnection}.driver");

        $tablesInfo = [];
        $totalSizeMb = 0;
        $totalRows = 0;

        try {
            if ($dbDriver === 'mysql') {
                // SHOW TABLE STATUS es soportado por todas las versiones de MySQL/MariaDB y no requiere privilegios especiales
                $status = DB::select('SHOW TABLE STATUS');

                foreach ($status as $row) {
                    $r = array_change_key_case((array) $row, CASE_LOWER);
                    $tableName = $r['name'] ?? null;
                    if (!$tableName) {
                        continue;
                    }
                    if (isset($r['comment']) && strtoupper((string) $r['comment']) === 'VIEW') {
                        continue;
                    }

                    $rows = (int) ($r['rows'] ?? 0);
                    $dataLen = (float) ($r['data_length'] ?? 0);
                    $idxLen = (float) ($r['index_length'] ?? 0);
                    $sizeMb = round(($dataLen + $idxLen) / 1024 / 1024, 2);

                    $tablesInfo[] = [
                        'name' => $tableName,
                        'rows' => $rows,
                        'size_mb' => $sizeMb,
                    ];
                    $totalSizeMb += $sizeMb;
                    $totalRows += $rows;
                }

                // Fallback de ultra contingencia
                if (empty($tablesInfo)) {
                    $rawTables = DB::select('SHOW TABLES');
                    foreach ($rawTables as $raw) {
                        $arr = (array) $raw;
                        $tName = reset($arr);
                        $tablesInfo[] = [
                            'name' => $tName,
                            'rows' => 0,
                            'size_mb' => 0.05,
                        ];
                    }
                }
            } elseif ($dbDriver === 'sqlite') {
                $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                foreach ($tables as $t) {
                    $countRow = DB::select("SELECT COUNT(*) as count FROM \"{$t->name}\"");
                    $rows = (int) ($countRow[0]->count ?? 0);
                    $sizeMb = round(($rows * 0.001), 3);

                    $tablesInfo[] = [
                        'name' => $t->name,
                        'rows' => $rows,
                        'size_mb' => $sizeMb,
                    ];
                    $totalRows += $rows;
                    $totalSizeMb += $sizeMb;
                }

                $dbPath = config("database.connections.{$dbConnection}.database");
                if (file_exists($dbPath)) {
                    $totalSizeMb = round(filesize($dbPath) / 1024 / 1024, 2);
                }
            }
        } catch (\Throwable $e) {
            Log::error('Error obteniendo tablas de base de datos: ' . $e->getMessage());
        }

        return [
            'tables' => $tablesInfo,
            'total_size_mb' => round($totalSizeMb, 2),
            'total_rows' => $totalRows,
        ];
    }

    /**
     * Retorna métricas aleatorias controladas simulando actividad en vivo para el ApexChart.
     */
    public function getMetrics()
    {
        // Simulando conexiones, consultas por segundo y porcentaje de aciertos de caché
        return response()->json([
            'timestamp' => now()->format('H:i:s'),
            'queries_per_second' => rand(15, 85),
            'active_connections' => rand(5, 22),
            'max_connections' => 150,
            'cache_hit_rate' => rand(88, 99),
            'query_types' => [
                'select' => rand(60, 75),
                'insert' => rand(10, 15),
                'update' => rand(5, 12),
                'delete' => rand(1, 4),
            ],
            'slow_queries' => [
                [
                    'query' => 'SELECT * FROM users JOIN roles ON users.role_id = roles.id WHERE users.status = 1 ORDER BY users.created_at DESC LIMIT 100;',
                    'duration' => rand(120, 480).'ms',
                    'time' => now()->subMinutes(rand(1, 5))->format('H:i:s'),
                ],
                [
                    'query' => 'SELECT COUNT(*), country_id FROM leads GROUP BY country_id HAVING COUNT(*) > 500;',
                    'duration' => rand(250, 950).'ms',
                    'time' => now()->subMinutes(rand(5, 15))->format('H:i:s'),
                ],
            ],
            'active_processes' => [
                ['id' => 1024, 'user' => 'root', 'host' => 'localhost', 'db' => 'larareact', 'command' => 'Query', 'time' => rand(1, 10), 'state' => 'Sending data', 'info' => 'SELECT * FROM empresas LIMIT 50'],
                ['id' => 1025, 'user' => 'larareact', 'host' => '127.0.0.1', 'db' => 'larareact', 'command' => 'Sleep', 'time' => rand(20, 100), 'state' => '', 'info' => ''],
                ['id' => 1026, 'user' => 'root', 'host' => 'localhost', 'db' => 'larareact', 'command' => 'Query', 'time' => 0, 'state' => 'Init', 'info' => 'show processlist'],
            ],
        ]);
    }

    /**
     * Verifica la contraseña del usuario autenticado para autorizar la exportación o importación.
     */
    public function verifyPassword(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string'],
        ], [
            'password.required' => 'Debe ingresar su contraseña para continuar.',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'valid' => false,
                'success' => false,
                'message' => __('La contraseña ingresada es incorrecta. Por favor intente nuevamente.'),
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'success' => true,
            'message' => __('Contraseña verificada exitosamente.'),
        ]);
    }

    /**
     * Ejecuta el volcado y descarga del archivo de respaldo de base de datos.
     */
    public function export(Request $request, DatabaseExportService $exportService)
    {
        $validated = $request->validate([
            'password' => ['required', 'string'],
            'tables' => ['nullable', 'array'],
            'tables.*' => ['string'],
            'mode' => ['nullable', 'string', 'in:full,structure,data'],
            'compress' => ['nullable', 'boolean'],
            'drop_tables' => ['nullable', 'boolean'],
            'disable_fk' => ['nullable', 'boolean'],
            'add_comments' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();

        // Validar contraseña nuevamente por estricta seguridad del endpoint
        if (!Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => __('No autorizado. La contraseña es incorrecta.'),
            ], 403);
        }

        try {
            $tables = $validated['tables'] ?? [];
            $mode = $validated['mode'] ?? 'full';
            $options = [
                'compress' => filter_var($validated['compress'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'drop_tables' => filter_var($validated['drop_tables'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'disable_fk' => filter_var($validated['disable_fk'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'add_comments' => filter_var($validated['add_comments'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ];

            $result = $exportService->export($tables, $mode, $options);

            // Registrar actividad
            if (function_exists('activity')) {
                try {
                    activity('database')
                        ->causedBy($user)
                        ->withProperties([
                            'filename' => $result['filename'],
                            'tables_count' => $result['tables_count'],
                            'mode' => $mode,
                            'compressed' => $options['compress'],
                            'size_bytes' => $result['size_bytes'],
                        ])
                        ->log("Exportó la base de datos: {$result['filename']} ({$result['tables_count']} tablas)");
                } catch (\Throwable $e) {
                    Log::warning('No se pudo registrar log de actividad en exportación DB: ' . $e->getMessage());
                }
            }

            return response()->download($result['path'], $result['filename'], [
                'Content-Type' => $options['compress'] ? 'application/gzip' : 'application/sql',
                'Access-Control-Expose-Headers' => 'Content-Disposition',
            ])->deleteFileAfterSend(true);

        } catch (\Throwable $e) {
            Log::error('Error exportando base de datos: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => __('Ocurrió un error al generar la exportación: :error', ['error' => $e->getMessage()]),
            ], 500);
        }
    }

    /**
     * Importa un archivo de respaldo (.sql, .sql.gz, .zip) en la base de datos previa autenticación.
     */
    public function import(Request $request, DatabaseImportService $importService)
    {
        $user = $request->user();

        // 1. Validar parámetros de entrada
        $request->validate([
            'password' => 'required|string',
            'file' => 'required|file|max:204800', // Máx 200MB
            'disable_fk' => 'nullable|boolean',
        ], [
            'password.required' => 'Debe ingresar su contraseña para confirmar la importación.',
            'file.required' => 'Debe adjuntar un archivo de respaldo para importar.',
            'file.max' => 'El archivo supera el límite permitido de 200MB.',
        ]);

        // 2. Verificar contraseña del usuario autenticado
        if (!Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Contraseña incorrecta. La importación fue cancelada por seguridad.',
            ], 422);
        }

        $uploadedFile = $request->file('file');
        $extension = strtolower($uploadedFile->getClientOriginalExtension());
        $originalName = $uploadedFile->getClientOriginalName();

        // Permitir .sql, .gz, .zip o nombres con .sql.gz
        if (!in_array($extension, ['sql', 'gz', 'zip']) && !str_ends_with(strtolower($originalName), '.sql.gz')) {
            return response()->json([
                'success' => false,
                'message' => 'Formato no soportado. El archivo debe tener extensión .sql, .sql.gz, .gz o .zip.',
            ], 422);
        }

        try {
            // Aumentar tiempo de ejecución para bases de datos pesadas
            set_time_limit(600);
            ini_set('memory_limit', '512M');

            $disableFk = $request->boolean('disable_fk', true);

            $result = $importService->import($uploadedFile, [
                'disable_fk' => $disableFk,
            ]);

            // Registrar en activity log
            if (function_exists('activity')) {
                try {
                    activity('database_monitoring')
                        ->causedBy($user)
                        ->withProperties([
                            'filename' => $result['filename'],
                            'file_size' => $result['file_size_bytes'],
                            'queries_count' => $result['queries_count'],
                            'tables_affected' => $result['tables_affected'],
                            'duration_seconds' => $result['duration_seconds'],
                        ])
                        ->log("Importó la base de datos desde respaldo: {$result['filename']}");
                } catch (\Throwable $e) {
                    Log::warning('No se pudo registrar log de actividad en importación DB: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Base de datos importada y restaurada exitosamente.',
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('Error en importación de base de datos: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error al importar la base de datos: ' . $e->getMessage(),
            ], 500);
        }
    }
}
