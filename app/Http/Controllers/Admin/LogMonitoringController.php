<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;

class LogMonitoringController extends Controller
{
    /**
     * Muestra la vista principal del lector de logs del sistema.
     */
    public function index(Request $request)
    {
        $logFile = storage_path('logs/laravel.log');
        $logs = [];

        if (File::exists($logFile)) {
            // Leer de forma segura las últimas 200 líneas del archivo
            $fileContent = $this->readLastLines($logFile, 200);
            $logs = $this->parseLogs($fileContent);
        }

        return inertia('admin/monitoring/logs/index', [
            'logs' => array_reverse($logs), // Mostrar los más nuevos primero
            'logSizeMb' => File::exists($logFile) ? round(File::size($logFile) / 1024 / 1024, 2) : 0,
        ]);
    }

    /**
     * Limpia el archivo de logs de Laravel.
     */
    public function clear()
    {
        $logFile = storage_path('logs/laravel.log');

        if (File::exists($logFile)) {
            File::put($logFile, '');
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('System logs cleared successfully.'),
        ]);
    }

    /**
     * Descarga el archivo de logs de Laravel.
     */
    public function download()
    {
        $logFile = storage_path('logs/laravel.log');

        if (File::exists($logFile)) {
            return Response::download($logFile);
        }

        return back()->with('notification', [
            'type' => 'error',
            'message' => __('Log file does not exist.'),
        ]);
    }

    /**
     * Lee de forma eficiente las últimas N líneas de un archivo.
     */
    private function readLastLines($filepath, $lines = 100)
    {
        $handle = fopen($filepath, 'r');
        $linecounter = $lines;
        $pos = -2;
        $beginning = false;
        $text = [];

        while ($linecounter > 0) {
            $t = ' ';
            while ($t != "\n") {
                if (fseek($handle, $pos, SEEK_END) == -1) {
                    $beginning = true;
                    break;
                }
                $t = fgetc($handle);
                $pos--;
            }
            $linecounter--;
            if ($beginning) {
                rewind($handle);
            }
            $text[] = fgets($handle);
            if ($beginning) {
                break;
            }
        }
        fclose($handle);

        return implode('', array_reverse($text));
    }

    /**
     * Parsea el contenido raw de laravel.log a una estructura legible.
     */
    private function parseLogs($rawContent)
    {
        $pattern = '/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+): (.*)/';
        $parts = preg_split($pattern, $rawContent, -1, PREG_SPLIT_DELIM_CAPTURE);

        $logs = [];
        $count = count($parts);

        // La división por expresión regular genera bloques:
        // [0] => texto antes del primer match (suele estar vacío)
        // [1] => timestamp
        // [2] => environment (e.g. local)
        // [3] => level (e.g. ERROR, INFO)
        // [4] => message + stack trace
        for ($i = 1; $i < $count; $i += 5) {
            if (isset($parts[$i])) {
                $rawMessage = $parts[$i + 3] ?? '';

                // Separar el mensaje principal de la traza de errores (Stack Trace)
                $messageLines = explode("\n", $rawMessage);
                $title = $messageLines[0];
                $stackTrace = count($messageLines) > 1 ? implode("\n", array_slice($messageLines, 1)) : null;

                $logs[] = [
                    'timestamp' => $parts[$i],
                    'environment' => $parts[$i + 1] ?? 'production',
                    'level' => strtolower($parts[$i + 2] ?? 'info'),
                    'message' => trim($title),
                    'stack_trace' => $stackTrace ? trim($stackTrace) : null,
                ];
            }
        }

        return $logs;
    }
}
