<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use ZipArchive;

class DatabaseImportService
{
    /**
     * Importa un respaldo de base de datos a partir de un archivo subido o ruta física.
     *
     * @param UploadedFile|string $file Archivo subido o ruta en disco
     * @param array $options Opciones de importación (disable_fk, etc.)
     * @return array Resumen de la importación
     */
    public function import($file, array $options = []): array
    {
        $startTime = microtime(true);
        $disableFk = $options['disable_fk'] ?? true;

        // Determinar ruta original y nombre
        if ($file instanceof UploadedFile) {
            $filePath = $file->getRealPath();
            $originalName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
        } else {
            $filePath = $file;
            $originalName = basename($file);
            $fileSize = File::exists($filePath) ? File::size($filePath) : 0;
        }

        if (!File::exists($filePath) || $fileSize === 0) {
            throw new \RuntimeException('El archivo de respaldo está vacío o no existe en el servidor.');
        }

        // Directorio temporal para extracción si es un archivo comprimido ZIP
        $tempDir = storage_path('app/backups_temp');
        if (!File::isDirectory($tempDir)) {
            File::makeDirectory($tempDir, 0755, true);
        }

        $tempSqlFile = null;
        $isGzip = false;

        // Detectar tipo de archivo
        $lowerName = strtolower($originalName);

        // Verificar por extensión o magic bytes
        $handleCheck = @fopen($filePath, 'rb');
        $magicBytes = $handleCheck ? fread($handleCheck, 4) : '';
        if ($handleCheck) {
            fclose($handleCheck);
        }

        if (str_ends_with($lowerName, '.zip') || substr($magicBytes, 0, 2) === "PK") {
            // Es un archivo ZIP
            $tempSqlFile = $this->extractSqlFromZip($filePath, $tempDir);
            $fileToRead = $tempSqlFile;
        } elseif (str_ends_with($lowerName, '.gz') || substr($magicBytes, 0, 2) === "\x1f\x8b") {
            // Es un archivo comprimido GZIP
            $isGzip = true;
            $fileToRead = $filePath;
        } elseif (str_ends_with($lowerName, '.sql') || substr($magicBytes, 0, 2) === "--" || substr($magicBytes, 0, 2) === "/*") {
            // Es SQL plano
            $fileToRead = $filePath;
        } else {
            // Intentar detectar si descomprime como gzip o es texto
            if (substr($magicBytes, 0, 2) === "\x1f\x8b") {
                $isGzip = true;
                $fileToRead = $filePath;
            } else {
                $fileToRead = $filePath;
            }
        }

        $connection = config('database.default');
        $driver = config("database.connections.{$connection}.driver");

        // Desactivar restricciones de claves foráneas antes de ejecutar
        try {
            if ($driver === 'mysql') {
                DB::unprepared('SET NAMES utf8mb4;');
                if ($disableFk) {
                    DB::unprepared('SET FOREIGN_KEY_CHECKS = 0;');
                }
                DB::unprepared("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';");
            } elseif ($driver === 'sqlite') {
                if ($disableFk) {
                    DB::unprepared('PRAGMA foreign_keys = OFF;');
                }
            }
        } catch (\Throwable $e) {
            Log::warning('No se pudo preconfigurar flags de BD: ' . $e->getMessage());
        }

        $queriesCount = 0;
        $tablesAffected = [];

        try {
            // Ejecutar el volcado en modo streaming
            if ($isGzip) {
                $fileHandle = @gzopen($fileToRead, 'rb');
                if (!$fileHandle) {
                    throw new \RuntimeException('No se pudo abrir el archivo comprimido GZIP para lectura.');
                }
                $isGzHandle = true;
            } else {
                $fileHandle = @fopen($fileToRead, 'r');
                if (!$fileHandle) {
                    throw new \RuntimeException('No se pudo abrir el archivo SQL para lectura.');
                }
                $isGzHandle = false;
            }

            $currentQuery = '';
            $inMultiLineComment = false;

            while (!($isGzHandle ? gzeof($fileHandle) : feof($fileHandle))) {
                $line = $isGzHandle ? gzgets($fileHandle, 65536) : fgets($fileHandle, 65536);

                if ($line === false) {
                    break;
                }

                $trimmedLine = trim($line);

                // Omitir líneas vacías
                if ($trimmedLine === '') {
                    continue;
                }

                // Manejo de comentarios de una sola línea
                if (str_starts_with($trimmedLine, '--') || str_starts_with($trimmedLine, '#')) {
                    continue;
                }

                // Manejo de comentarios multilínea /* ... */
                if (!$inMultiLineComment && str_starts_with($trimmedLine, '/*') && !str_starts_with($trimmedLine, '/*!')) {
                    if (!str_contains($trimmedLine, '*/')) {
                        $inMultiLineComment = true;
                    }
                    continue;
                }

                if ($inMultiLineComment) {
                    if (str_contains($trimmedLine, '*/')) {
                        $inMultiLineComment = false;
                    }
                    continue;
                }

                $currentQuery .= $line;

                // Comprobar si la línea actual finaliza la instrucción con punto y coma
                if (str_ends_with($trimmedLine, ';')) {
                    $stmt = trim($currentQuery);
                    if ($stmt !== '') {
                        // Detectar tabla afectada
                        if (preg_match('/(?:create\s+table\s+(?:if\s+not\s+exists\s+)?|insert\s+into\s+|drop\s+table\s+(?:if\s+exists\s+)?)`?([a-zA-Z0-9_]+)`?/i', $stmt, $matches)) {
                            if (!empty($matches[1])) {
                                $tablesAffected[strtolower($matches[1])] = true;
                            }
                        }

                        try {
                            DB::unprepared($stmt);
                            $queriesCount++;
                        } catch (\Throwable $queryError) {
                            Log::error("Error ejecutando sentencia SQL durante importación: " . $queryError->getMessage(), [
                                'query_preview' => substr($stmt, 0, 200),
                            ]);
                            throw new \RuntimeException("Error en la sentencia #" . ($queriesCount + 1) . ": " . $queryError->getMessage());
                        }
                    }
                    $currentQuery = '';
                }
            }

            // Si queda alguna consulta sin punto y coma final
            $remaining = trim($currentQuery);
            if ($remaining !== '') {
                try {
                    DB::unprepared($remaining);
                    $queriesCount++;
                } catch (\Throwable $queryError) {
                    Log::warning("Error en sentencia remanente: " . $queryError->getMessage());
                }
            }

            if ($isGzHandle) {
                gzclose($fileHandle);
            } else {
                fclose($fileHandle);
            }
        } finally {
            // Siempre reactivar FOREIGN_KEY_CHECKS al terminar
            try {
                if ($driver === 'mysql') {
                    DB::unprepared('SET FOREIGN_KEY_CHECKS = 1;');
                } elseif ($driver === 'sqlite') {
                    DB::unprepared('PRAGMA foreign_keys = ON;');
                }
            } catch (\Throwable $e) {
                Log::warning('No se pudo restaurar FOREIGN_KEY_CHECKS: ' . $e->getMessage());
            }

            // Eliminar archivo temporal si se extrajo de un ZIP
            if ($tempSqlFile && File::exists($tempSqlFile)) {
                @unlink($tempSqlFile);
            }
        }

        $duration = round(microtime(true) - $startTime, 2);

        return [
            'success' => true,
            'filename' => $originalName,
            'file_size_bytes' => $fileSize,
            'queries_count' => $queriesCount,
            'tables_affected' => count($tablesAffected),
            'tables_list' => array_keys($tablesAffected),
            'duration_seconds' => $duration,
        ];
    }

    /**
     * Extrae el primer archivo .sql encontrado dentro de un archivo ZIP.
     */
    protected function extractSqlFromZip(string $zipPath, string $destDir): string
    {
        $zip = new ZipArchive();
        $res = $zip->open($zipPath);

        if ($res !== true) {
            throw new \RuntimeException('No se pudo abrir el archivo ZIP. Código de error: ' . $res);
        }

        $sqlEntryName = null;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            if ($stat && str_ends_with(strtolower($stat['name']), '.sql')) {
                $sqlEntryName = $stat['name'];
                break;
            }
        }

        if (!$sqlEntryName) {
            $zip->close();
            throw new \RuntimeException('El archivo ZIP no contiene ningún archivo con extensión .sql.');
        }

        $extractedPath = $destDir . DIRECTORY_SEPARATOR . 'extracted_' . uniqid() . '_' . basename($sqlEntryName);
        $stream = $zip->getStream($sqlEntryName);
        if (!$stream) {
            $zip->close();
            throw new \RuntimeException('No se pudo extraer el archivo SQL del ZIP.');
        }

        $outHandle = fopen($extractedPath, 'wb');
        while (!feof($stream)) {
            fwrite($outHandle, fread($stream, 65536));
        }
        fclose($outHandle);
        fclose($stream);
        $zip->close();

        return $extractedPath;
    }
}
