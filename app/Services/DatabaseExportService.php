<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use PDO;

class DatabaseExportService
{
    /**
     * Genera el volcado de base de datos según las opciones y tablas seleccionadas.
     *
     * @param array $tables Nombres de tablas a exportar.
     * @param string $mode 'full' | 'structure' | 'data'
     * @param array $options [
     *     'compress' => bool,
     *     'drop_tables' => bool,
     *     'disable_fk' => bool,
     *     'add_comments' => bool,
     * ]
     * @return array ['path' => string, 'filename' => string, 'size_bytes' => int, 'tables_count' => int]
     * @throws Exception
     */
    public function export(array $tables = [], string $mode = 'full', array $options = []): array
    {
        $compress = (bool) ($options['compress'] ?? true);
        $dropTables = (bool) ($options['drop_tables'] ?? true);
        $disableFk = (bool) ($options['disable_fk'] ?? true);
        $addComments = (bool) ($options['add_comments'] ?? true);

        $dbConnection = config('database.default');
        $driver = config("database.connections.{$dbConnection}.driver");
        $dbName = config("database.connections.{$dbConnection}.database");

        // Si no se pasaron tablas o el array está vacío, obtener todas las tablas del sistema
        if (empty($tables)) {
            $tables = $this->getAllTables($driver, $dbName);
        }

        // Crear directorio temporal si no existe
        $tempDir = storage_path('app/backups_temp');
        if (!File::exists($tempDir)) {
            File::makeDirectory($tempDir, 0755, true);
        }

        // Limpiar volcados temporales de más de 2 horas
        $this->cleanOldBackups($tempDir);

        $timestamp = now()->format('Y-m-d_His');
        $baseFilename = 'backup_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $dbName) . '_' . $timestamp;
        $extension = $compress ? 'sql.gz' : 'sql';
        $filename = "{$baseFilename}.{$extension}";
        $filePath = "{$tempDir}/{$filename}";

        $fileHandle = $compress ? @gzopen($filePath, 'wb9') : @fopen($filePath, 'wb');
        if (!$fileHandle) {
            throw new Exception("No se pudo crear el archivo de respaldo temporal en {$filePath}");
        }

        $write = function (string $text) use ($fileHandle, $compress) {
            if ($compress) {
                gzwrite($fileHandle, $text);
            } else {
                fwrite($fileHandle, $text);
            }
        };

        try {
            // 1. Cabecera SQL
            if ($addComments) {
                $now = now()->toDateTimeString();
                $appName = config('app.name', 'Smurfit Westrock');
                $write("-- -------------------------------------------------------------\n");
                $write("-- {$appName} - Respaldo de Base de Datos\n");
                $write("-- Fecha de Generación : {$now}\n");
                $write("-- Base de Datos       : {$dbName}\n");
                $write("-- Motor / Driver      : {$driver}\n");
                $write("-- Modo de Volcado     : " . strtoupper($mode) . "\n");
                $write("-- Total Tablas        : " . count($tables) . "\n");
                $write("-- -------------------------------------------------------------\n\n");
            }

            if ($driver === 'mysql') {
                $write("/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;\n");
                $write("/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;\n");
                $write("/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;\n");
                $write("/*!50503 SET NAMES utf8mb4 */;\n");
                $write("/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;\n");
                $write("/*!40103 SET TIME_ZONE='+00:00' */;\n");
                if ($disableFk) {
                    $write("/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;\n");
                    $write("/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;\n");
                }
                $write("/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;\n");
                $write("/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;\n\n");
            } elseif ($driver === 'sqlite') {
                if ($disableFk) {
                    $write("PRAGMA foreign_keys = OFF;\n\n");
                }
            }

            $pdo = DB::connection()->getPdo();

            // 2. Iterar sobre cada tabla
            foreach ($tables as $table) {
                $table = trim($table);
                if (empty($table)) {
                    continue;
                }

                if ($addComments) {
                    $write("\n-- -------------------------------------------------------------\n");
                    $write("-- Tabla: `{$table}`\n");
                    $write("-- -------------------------------------------------------------\n\n");
                }

                // DDL Estructura (Modo 'full' o 'structure')
                if ($mode === 'full' || $mode === 'structure') {
                    if ($dropTables) {
                        if ($driver === 'mysql') {
                            $write("DROP TABLE IF EXISTS `{$table}`;\n");
                        } else {
                            $write("DROP TABLE IF EXISTS \"{$table}\";\n");
                        }
                    }

                    if ($driver === 'mysql') {
                        $createRow = DB::select("SHOW CREATE TABLE `{$table}`");
                        if (!empty($createRow)) {
                            $createSql = $createRow[0]->{'Create Table'} ?? ($createRow[0]->{'Create View'} ?? null);
                            if ($createSql) {
                                $write("{$createSql};\n\n");
                            }
                        }
                    } elseif ($driver === 'sqlite') {
                        $createRow = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?", [$table]);
                        if (!empty($createRow) && !empty($createRow[0]->sql)) {
                            $write("{$createRow[0]->sql};\n\n");
                        }
                    }
                }

                // Datos (Modo 'full' o 'data')
                if ($mode === 'full' || $mode === 'data') {
                    if ($driver === 'mysql') {
                        $write("/*!40000 ALTER TABLE `{$table}` DISABLE KEYS */;\n");
                    }

                    $batchSize = 500;
                    $currentBatch = [];
                    $columnNames = null;

                    // Lectura optimizada por chunks
                    DB::table($table)->orderBy(DB::raw('1'))->chunk($batchSize, function ($rows) use (&$write, &$currentBatch, &$columnNames, $table, $driver, $pdo) {
                        if ($rows->isEmpty()) {
                            return;
                        }

                        if ($columnNames === null) {
                            $firstRow = (array) $rows->first();
                            $columnNames = array_keys($firstRow);
                        }

                        $quotedColumns = array_map(function ($col) use ($driver) {
                            return $driver === 'mysql' ? "`{$col}`" : "\"{$col}\"";
                        }, $columnNames);
                        $colListStr = implode(', ', $quotedColumns);

                        $valuesSqlList = [];
                        foreach ($rows as $row) {
                            $rowArray = (array) $row;
                            $valEscaped = [];
                            foreach ($columnNames as $col) {
                                $val = $rowArray[$col] ?? null;
                                if ($val === null) {
                                    $valEscaped[] = 'NULL';
                                } elseif (is_int($val) || is_float($val)) {
                                    $valEscaped[] = (string) $val;
                                } elseif (is_bool($val)) {
                                    $valEscaped[] = $val ? '1' : '0';
                                } else {
                                    $valEscaped[] = $pdo->quote((string) $val);
                                }
                            }
                            $valuesSqlList[] = '(' . implode(', ', $valEscaped) . ')';
                        }

                        if (!empty($valuesSqlList)) {
                            $insertPrefix = $driver === 'mysql' ? "INSERT INTO `{$table}`" : "INSERT INTO \"{$table}\"";
                            $write("{$insertPrefix} ({$colListStr}) VALUES\n  " . implode(",\n  ", $valuesSqlList) . ";\n");
                        }
                    });

                    if ($driver === 'mysql') {
                        $write("/*!40000 ALTER TABLE `{$table}` ENABLE KEYS */;\n\n");
                    }
                }
            }

            // 3. Pie de página SQL
            if ($driver === 'mysql') {
                $write("/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;\n");
                $write("/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;\n");
                if ($disableFk) {
                    $write("/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;\n");
                    $write("/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;\n");
                }
                $write("/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;\n");
                $write("/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;\n");
                $write("/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;\n");
                $write("/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;\n\n");
            } elseif ($driver === 'sqlite') {
                if ($disableFk) {
                    $write("PRAGMA foreign_keys = ON;\n\n");
                }
            }

            if ($addComments) {
                $write("-- Respaldo completado exitosamente.\n");
            }
        } finally {
            if ($compress) {
                gzclose($fileHandle);
            } else {
                fclose($fileHandle);
            }
        }

        $fileSize = File::exists($filePath) ? File::size($filePath) : 0;

        return [
            'path' => $filePath,
            'filename' => $filename,
            'size_bytes' => $fileSize,
            'tables_count' => count($tables),
        ];
    }

    /**
     * Retorna todas las tablas del esquema actual.
     */
    protected function getAllTables(string $driver, string $dbName): array
    {
        $tables = [];

        if ($driver === 'mysql') {
            try {
                $statusRows = DB::select('SHOW TABLE STATUS');
                foreach ($statusRows as $row) {
                    $r = array_change_key_case((array) $row, CASE_LOWER);
                    $tableName = $r['name'] ?? null;
                    if (!$tableName) {
                        continue;
                    }
                    if (isset($r['comment']) && strtoupper((string) $r['comment']) === 'VIEW') {
                        continue;
                    }
                    $tables[] = $tableName;
                }
            } catch (\Throwable $e) {
                // Fallback
            }

            if (empty($tables)) {
                $rawTables = DB::select('SHOW TABLES');
                foreach ($rawTables as $raw) {
                    $rawArray = (array) $raw;
                    $tables[] = reset($rawArray);
                }
            }
        } elseif ($driver === 'sqlite') {
            $rows = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC");
            foreach ($rows as $r) {
                $tables[] = $r->name;
            }
        }

        return $tables;
    }

    /**
     * Limpia volcados antiguos de más de 2 horas para no saturar disco.
     */
    protected function cleanOldBackups(string $dir): void
    {
        try {
            $files = File::files($dir);
            $twoHoursAgo = now()->subHours(2)->timestamp;
            foreach ($files as $file) {
                if ($file->getMTime() < $twoHoursAgo) {
                    @unlink($file->getRealPath());
                }
            }
        } catch (Exception $e) {
            Log::warning("Error limpiando backups antiguos: " . $e->getMessage());
        }
    }
}
