<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
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
        $dbDriver = config("database.connections.{$dbConnection}.driver") ?? $dbConnection;

        $tablesInfo = [];
        $totalSizeMb = 0;
        $totalRows = 0;
        $version = 'Desconocido';

        try {
            if (in_array($dbDriver, ['mysql', 'mariadb'])) {
                $dbName = DB::connection()->getDatabaseName();

                // Versión de MySQL / MariaDB
                $versionRow = DB::select('SELECT VERSION() as version');
                $version = $versionRow[0]->version ?? 'MySQL/MariaDB';

                // Información de Tablas (nombre, filas, tamaño)
                $tables = DB::select('
                    SELECT 
                        TABLE_NAME AS `name`, 
                        COALESCE(TABLE_ROWS, 0) AS `rows`, 
                        ROUND((COALESCE(DATA_LENGTH, 0) + COALESCE(INDEX_LENGTH, 0)) / 1024 / 1024, 4) AS `size_mb` 
                    FROM information_schema.TABLES 
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = \'BASE TABLE\'
                    ORDER BY (COALESCE(DATA_LENGTH, 0) + COALESCE(INDEX_LENGTH, 0)) DESC
                ');

                foreach ($tables as $t) {
                    $sizeMb = (float) ($t->size_mb ?? 0);
                    $rows = (int) ($t->rows ?? 0);

                    // Si rows es 0 o aproximado (InnoDB), hacer COUNT real rápido
                    try {
                        $countRes = DB::select("SELECT COUNT(*) as cnt FROM `{$t->name}`");
                        $rows = (int) ($countRes[0]->cnt ?? $rows);
                    } catch (\Throwable $e) {
                        // Keep table_rows if direct count fails
                    }

                    $tablesInfo[] = [
                        'name' => $t->name,
                        'rows' => $rows,
                        'size_mb' => $sizeMb,
                    ];
                    $totalSizeMb += $sizeMb;
                    $totalRows += $rows;
                }
            } elseif ($dbDriver === 'sqlite') {
                $versionRow = DB::select('select sqlite_version() as version');
                $version = $versionRow[0]->version ?? 'SQLite';

                $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                foreach ($tables as $t) {
                    $countRow = DB::select("SELECT COUNT(*) as count FROM \"{$t->name}\"");
                    $rows = (int) ($countRow[0]->count ?? 0);

                    $tablesInfo[] = [
                        'name' => $t->name,
                        'rows' => $rows,
                        'size_mb' => round(($rows * 0.001), 3),
                    ];
                    $totalRows += $rows;
                }

                $dbPath = config("database.connections.{$dbConnection}.database");
                if (file_exists($dbPath)) {
                    $totalSizeMb = round(filesize($dbPath) / 1024 / 1024, 2);
                }
            }
        } catch (\Exception $e) {
            Log::error('Error obteniendo métricas de base de datos: '.$e->getMessage());
        }

        return inertia('admin/monitoring/database/index', [
            'dbInfo' => [
                'connection' => $dbConnection,
                'driver' => $dbDriver,
                'version' => $version,
                'total_tables' => count($tablesInfo),
                'total_size_mb' => round($totalSizeMb, 2),
                'total_rows' => $totalRows,
                'tables' => $tablesInfo,
            ],
        ]);
    }

    /**
     * Retorna métricas reales en vivo para el monitoreo de la base de datos.
     */
    public function getMetrics()
    {
        $dbConnection = config('database.default');
        $dbDriver = config("database.connections.{$dbConnection}.driver") ?? $dbConnection;

        $activeConnections = 0;
        $maxConnections = 150;
        $qps = 0;
        $cacheHitRate = 100.0;
        $queryTypes = [
            'select' => 0,
            'insert' => 0,
            'update' => 0,
            'delete' => 0,
        ];
        $slowQueries = [];
        $activeProcesses = [];

        if (in_array($dbDriver, ['mysql', 'mariadb'])) {
            try {
                // 1. Conexiones Activas y Máximas reales
                $threadsRow = DB::select("SHOW STATUS LIKE 'Threads_connected'");
                if (!empty($threadsRow)) {
                    $activeConnections = (int) ($threadsRow[0]->Value ?? $threadsRow[0]->value ?? 0);
                }
                $maxConnRow = DB::select("SHOW VARIABLES LIKE 'max_connections'");
                if (!empty($maxConnRow)) {
                    $maxConnections = (int) ($maxConnRow[0]->Value ?? $maxConnRow[0]->value ?? 150);
                }

                // 2. Cálculo real de QPS por diferencia de tiempo entre polls
                $statusRows = DB::select("SHOW GLOBAL STATUS WHERE Variable_name IN ('Queries', 'Uptime')");
                $statusMap = [];
                foreach ($statusRows as $row) {
                    $key = $row->Variable_name ?? $row->variable_name ?? '';
                    $val = $row->Value ?? $row->value ?? 0;
                    $statusMap[$key] = (int) $val;
                }

                $queries = $statusMap['Queries'] ?? 0;
                $uptime = $statusMap['Uptime'] ?? 1;

                $now = microtime(true);
                $prev = Cache::get('db_monitoring_qps_data');

                if ($prev && isset($prev['time'], $prev['queries']) && ($now - $prev['time']) > 0) {
                    $timeDiff = $now - $prev['time'];
                    $queryDiff = $queries - $prev['queries'];
                    if ($queryDiff >= 0 && $timeDiff > 0) {
                        $qps = round($queryDiff / $timeDiff, 1);
                    } else {
                        $qps = $uptime > 0 ? round($queries / $uptime, 1) : 0;
                    }
                } else {
                    $qps = $uptime > 0 ? round($queries / $uptime, 1) : 0;
                }

                Cache::put('db_monitoring_qps_data', [
                    'time' => $now,
                    'queries' => $queries,
                ], 60);

                // 3. Porcentaje real de aciertos de caché (InnoDB Buffer Pool)
                $innodbRows = DB::select("SHOW GLOBAL STATUS WHERE Variable_name IN ('Innodb_buffer_pool_read_requests', 'Innodb_buffer_pool_reads')");
                $innodbMap = [];
                foreach ($innodbRows as $row) {
                    $key = $row->Variable_name ?? $row->variable_name ?? '';
                    $val = $row->Value ?? $row->value ?? 0;
                    $innodbMap[$key] = (int) $val;
                }

                $readRequests = $innodbMap['Innodb_buffer_pool_read_requests'] ?? 0;
                $reads = $innodbMap['Innodb_buffer_pool_reads'] ?? 0;

                if ($readRequests > 0) {
                    $cacheHitRate = round((1 - ($reads / $readRequests)) * 100, 1);
                    $cacheHitRate = max(0, min(100, $cacheHitRate));
                }

                // 4. Distribución real de tipos de consulta
                $comRows = DB::select("SHOW GLOBAL STATUS WHERE Variable_name IN ('Com_select', 'Com_insert', 'Com_update', 'Com_delete')");
                foreach ($comRows as $row) {
                    $key = strtolower($row->Variable_name ?? $row->variable_name ?? '');
                    $val = (int) ($row->Value ?? $row->value ?? 0);
                    if ($key === 'com_select') $queryTypes['select'] = $val;
                    if ($key === 'com_insert') $queryTypes['insert'] = $val;
                    if ($key === 'com_update') $queryTypes['update'] = $val;
                    if ($key === 'com_delete') $queryTypes['delete'] = $val;
                }

                // 5. Procesos Activos reales
                $processList = DB::select('
                    SELECT 
                        ID as id, 
                        USER as user, 
                        HOST as host, 
                        DB as db, 
                        COMMAND as command, 
                        TIME as time, 
                        STATE as state, 
                        INFO as info 
                    FROM information_schema.PROCESSLIST 
                    ORDER BY TIME DESC 
                    LIMIT 30
                ');

                foreach ($processList as $p) {
                    $activeProcesses[] = [
                        'id' => (int) ($p->id ?? 0),
                        'user' => (string) ($p->user ?? 'system'),
                        'host' => (string) ($p->host ?? ''),
                        'db' => (string) ($p->db ?? ''),
                        'command' => (string) ($p->command ?? 'Sleep'),
                        'time' => (int) ($p->time ?? 0),
                        'state' => (string) ($p->state ?? ''),
                        'info' => (string) ($p->info ?? ''),
                    ];
                }

                // 6. Consultas lentas reales
                $dbName = DB::connection()->getDatabaseName();
                try {
                    $perfQueries = DB::select('
                        SELECT 
                            DIGEST_TEXT as query,
                            ROUND(MAX_TIMER_WAIT / 1000000000, 2) as duration_ms,
                            LAST_SEEN as time
                        FROM performance_schema.events_statements_summary_by_digest
                        WHERE SCHEMA_NAME = ? AND DIGEST_TEXT IS NOT NULL AND MAX_TIMER_WAIT > 100000000000
                        ORDER BY MAX_TIMER_WAIT DESC
                        LIMIT 10
                    ', [$dbName]);

                    foreach ($perfQueries as $q) {
                        $slowQueries[] = [
                            'query' => (string) ($q->query ?? ''),
                            'duration' => ($q->duration_ms ?? 0) . ' ms',
                            'time' => !empty($q->time) ? date('H:i:s', strtotime($q->time)) : now()->format('H:i:s'),
                        ];
                    }
                } catch (\Exception $ePerf) {
                    try {
                        $slowLog = DB::select('
                            SELECT 
                                sql_text as query,
                                query_time as duration,
                                start_time as time
                            FROM mysql.slow_log
                            ORDER BY start_time DESC
                            LIMIT 10
                        ');
                        foreach ($slowLog as $q) {
                            $slowQueries[] = [
                                'query' => (string) ($q->query ?? ''),
                                'duration' => (string) ($q->duration ?? '0s'),
                                'time' => !empty($q->time) ? date('H:i:s', strtotime($q->time)) : now()->format('H:i:s'),
                            ];
                        }
                    } catch (\Exception $eSlow) {
                        $slowQueries = [];
                    }
                }

            } catch (\Exception $e) {
                Log::error('Error fetching real DB metrics: '.$e->getMessage());
            }
        } elseif ($dbDriver === 'sqlite') {
            $activeConnections = 1;
            $maxConnections = 1;
            $qps = 0;
            $cacheHitRate = 100.0;
        }

        return response()->json([
            'timestamp' => now()->format('H:i:s'),
            'queries_per_second' => $qps,
            'active_connections' => $activeConnections,
            'max_connections' => $maxConnections,
            'cache_hit_rate' => $cacheHitRate,
            'query_types' => $queryTypes,
            'slow_queries' => $slowQueries,
            'active_processes' => $activeProcesses,
        ]);
    }

    /**
     * Lista de tablas excluidas del sistema central (pertenecientes al dueño SaaS/Framework).
     */
    protected function getExcludedSystemTables(): array
    {
        return [
            'migrations',
            'failed_jobs',
            'password_reset_tokens',
            'personal_access_tokens',
            'sessions',
            'cache',
            'cache_locks',
            'jobs',
            'job_batches',
            'activity_log',
            'roles',
            'permissions',
            'model_has_roles',
            'model_has_permissions',
            'role_has_permissions',
            'telescope_entries',
            'telescope_entries_tags',
            'telescope_monitoring',
        ];
    }

    /**
     * Paso 2: Generar vista previa de datos para la exportación de la empresa del usuario.
     */
    public function exportPreview(Request $request)
    {
        $user = $request->user();
        $empresaId = $user->empresa_id;
        $isSuperAdmin = $user->hasRole('Super Administrador') || $user->hasRole('super-admin');
        $excludedTables = $this->getExcludedSystemTables();

        $allTables = DB::select('
            SELECT TABLE_NAME AS `name` 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = \'BASE TABLE\'
        ');

        $previewData = [];
        $totalExportRows = 0;

        foreach ($allTables as $t) {
            $tableName = $t->name;

            // Si no es SuperAdmin, omitir tablas del sistema central del SaaS
            if (! $isSuperAdmin && in_array($tableName, $excludedTables)) {
                continue;
            }

            $hasEmpresaId = \Illuminate\Support\Facades\Schema::hasColumn($tableName, 'empresa_id');
            $query = DB::table($tableName);

            if (! $isSuperAdmin && $empresaId) {
                if ($tableName === 'empresas') {
                    $query->where('id', $empresaId);
                } elseif ($hasEmpresaId) {
                    $query->where('empresa_id', $empresaId);
                }
            }

            $count = (clone $query)->count();
            $samples = (clone $query)->limit(3)->get();

            $previewData[] = [
                'table' => $tableName,
                'is_tenant_filtered' => (! $isSuperAdmin && $empresaId && ($hasEmpresaId || $tableName === 'empresas')),
                'rows_count' => $count,
                'sample_records' => $samples,
            ];

            $totalExportRows += $count;
        }

        return response()->json([
            'tables' => $previewData,
            'total_tables' => count($previewData),
            'total_rows' => $totalExportRows,
            'empresa_id' => $empresaId,
        ]);
    }

    /**
     * Paso 3: Confirmación de contraseña del usuario.
     */
    public function confirmPassword(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! \Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            return response()->json(['valid' => false, 'message' => __('La contraseña ingresada es incorrecta.')], 422);
        }

        return response()->json(['valid' => true, 'message' => __('Contraseña verificada correctamente.')]);
    }

    /**
     * Paso 4: Descarga/Generación de archivo SQL o JSON de exportación.
     */
    public function downloadExport(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string'],
            'include_structure' => ['boolean'],
            'include_data' => ['boolean'],
            'add_drop_table' => ['boolean'],
            'if_not_exists' => ['boolean'],
        ]);

        $user = $request->user();

        if (! \Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            return response()->json(['message' => __('Verificación de seguridad fallida.')], 403);
        }

        $empresaId = $user->empresa_id;
        $isSuperAdmin = $user->hasRole('Super Administrador') || $user->hasRole('super-admin');
        $excludedTables = $this->getExcludedSystemTables();

        $includeStructure = $request->boolean('include_structure', true);
        $includeData = $request->boolean('include_data', true);
        $addDropTable = $request->boolean('add_drop_table', true);
        $ifNotExists = $request->boolean('if_not_exists', true);

        $allTables = DB::select('
            SELECT TABLE_NAME AS `name` 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = \'BASE TABLE\'
        ');

        $tables = array_filter($allTables, function ($t) use ($isSuperAdmin, $excludedTables) {
            return $isSuperAdmin || ! in_array($t->name, $excludedTables);
        });

        $filename = 'export_empresa_'.($empresaId ?? 'global').'_'.now()->format('Y_m_d_His').'.sql';

        $headers = [
            'Content-Type' => 'text/plain; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($tables, $empresaId, $isSuperAdmin, $includeStructure, $includeData, $addDropTable, $ifNotExists) {
            $out = fopen('php://output', 'w');

            fwrite($out, "-- ============================================================\n");
            fwrite($out, "-- SERVITEC POS BACKUP EXPORT\n");
            fwrite($out, '-- Empresa ID: '.($empresaId ?? 'Global (SuperAdmin)')."\n");
            fwrite($out, '-- Fecha: '.now()->toDateTimeString()."\n");
            fwrite($out, "-- ============================================================\n\n");
            fwrite($out, "SET FOREIGN_KEY_CHECKS=0;\n\n");

            foreach ($tables as $t) {
                $tableName = $t->name;
                $hasEmpresaId = \Illuminate\Support\Facades\Schema::hasColumn($tableName, 'empresa_id');

                if ($includeStructure) {
                    if ($addDropTable) {
                        fwrite($out, "DROP TABLE IF EXISTS `{$tableName}`;\n");
                    }

                    $createTableRes = DB::select("SHOW CREATE TABLE `{$tableName}`");
                    if (! empty($createTableRes)) {
                        $createSql = $createTableRes[0]->{'Create Table'} ?? $createTableRes[0]->{'create table'} ?? '';
                        if ($ifNotExists) {
                            $createSql = preg_replace('/CREATE TABLE/', 'CREATE TABLE IF NOT EXISTS', $createSql, 1);
                        }
                        fwrite($out, $createSql.";\n\n");
                    }
                }

                if ($includeData) {
                    $query = DB::table($tableName);
                    if (! $isSuperAdmin && $empresaId) {
                        if ($tableName === 'empresas') {
                            $query->where('id', $empresaId);
                        } elseif ($hasEmpresaId) {
                            $query->where('empresa_id', $empresaId);
                        }
                    }

                    // Determinar columna clave para ordenar el chunk
                    $primaryKey = \Illuminate\Support\Facades\Schema::hasColumn($tableName, 'id') ? 'id' : null;
                    if (! $primaryKey) {
                        $columnNames = \Illuminate\Support\Facades\Schema::getColumnListing($tableName);
                        $primaryKey = $columnNames[0] ?? null;
                    }

                    if ($primaryKey) {
                        $query->orderBy($primaryKey);
                    }

                    $query->chunk(100, function ($rows) use ($out, $tableName) {
                        foreach ($rows as $row) {
                            $rowArray = (array) $row;
                            $columns = array_map(fn ($c) => "`{$c}`", array_keys($rowArray));
                            $values = array_map(function ($val) {
                                if (is_null($val)) {
                                    return 'NULL';
                                }
                                if (is_bool($val)) {
                                    return $val ? '1' : '0';
                                }
                                $escaped = addslashes((string) $val);

                                return "'{$escaped}'";
                            }, array_values($rowArray));

                            $sql = 'INSERT INTO `'.$tableName.'` ('.implode(', ', $columns).') VALUES ('.implode(', ', $values).");\n";
                            fwrite($out, $sql);
                        }
                    });
                    fwrite($out, "\n");
                }
            }

            fwrite($out, "SET FOREIGN_KEY_CHECKS=1;\n");
            fclose($out);
        };

        return response()->stream($callback, 200, $headers);
    }
}

