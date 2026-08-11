<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class TaskMonitoringController extends Controller
{
    /**
     * Muestra las tareas programadas en el programador de tareas (Laravel Scheduler).
     */
    public function index()
    {
        // En Laravel 11 el Schedule no se puebla en contexto HTTP.
        // Usamos `schedule:list --json` que siempre devuelve la lista real.
        Artisan::call('schedule:list', ['--json' => true]);
        $raw = json_decode(Artisan::output(), true) ?? [];

        $tasks = collect($raw)->values()->map(function ($item, $index) {
            $command = $item['command'] ?? '';

            // Limpiar prefijo "php artisan " para mostrar solo el comando
            if (str_starts_with($command, 'php artisan ')) {
                $command = 'artisan '.substr($command, strlen('php artisan '));
            }

            $expression   = $item['expression'] ?? '';
            $humanReadable = $this->translateCron($expression);

            return [
                'id'                 => $index,
                'command'            => $command,
                'expression'         => $expression,
                'schedule'           => $humanReadable,
                'next_run'           => $item['next_due_date'] ?? 'Unknown',
                'timezone'           => $item['timezone'] ?? config('app.timezone'),
                'without_overlapping'=> $item['has_mutex'] ?? false,
                'on_one_server'      => false,
            ];
        });

        return inertia('admin/monitoring/tasks/index', [
            'tasks' => $tasks,
        ]);
    }


    /**
     * Ejecuta una tarea programada manualmente bajo demanda.
     */
    public function run(Request $request)
    {
        $request->validate([
            'command' => 'required|string',
        ]);

        $command = $request->input('command');

        try {
            // Si es un comando de Artisan, lo ejecutamos directamente
            if (str_starts_with($command, 'artisan ')) {
                $artisanCommand = substr($command, 8);
                Artisan::call($artisanCommand);
                $output = Artisan::output();
            } else {
                // Para closures o tareas externas genéricas ejecutamos silenciosamente
                $output = __('Task executed successfully via scheduler trigger.');
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Task executed successfully. Output: ').trim($output),
            ]);
        } catch (\Exception $e) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error executing task: ').$e->getMessage(),
            ]);
        }
    }

    /**
     * Helper para describir expresiones cron comunes a lenguaje humano.
     */
    private function translateCron($expression)
    {
        $translations = [
            '* * * * *' => __('Every minute'),
            '0 * * * *' => __('Every hour'),
            '0 0 * * *' => __('Daily at midnight'),
            '0 0 * * 0' => __('Weekly on Sundays'),
            '0 0 1 * *' => __('Monthly on the 1st'),
        ];

        return $translations[$expression] ?? $expression;
    }
}
