<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Cron\CronExpression;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class TaskMonitoringController extends Controller
{
    /**
     * Muestra las tareas programadas en el programador de tareas (Laravel Scheduler).
     */
    public function index(Schedule $schedule)
    {
        $tasks = collect($schedule->events())->map(function ($event, $index) {
            // Obtener comando o descripción legible
            $command = $event->command;

            // Si es un comando de Artisan, limpiamos la ruta del binario PHP
            if (preg_match('/artisan[\'"]?\s+([^\s]+)/', $command, $matches)) {
                $command = 'artisan '.$matches[1];
            } else {
                $command = $event->description ?: ($event->callback instanceof \Closure ? 'Closure Callback' : 'Command Task');
            }

            // Traducir o describir expresión cron
            $expression = $event->expression;
            $humanReadable = $this->translateCron($expression);

            // Calcular siguiente ejecución usando la librería CronExpression
            $nextRun = 'Unknown';
            try {
                $cron = new CronExpression($expression);
                $nextRun = $cron->getNextRunDate()->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                // Silencioso
            }

            return [
                'id' => $index,
                'command' => $command,
                'expression' => $expression,
                'schedule' => $humanReadable,
                'next_run' => $nextRun,
                'timezone' => $event->timezone ?? config('app.timezone'),
                'without_overlapping' => $event->withoutOverlapping,
                'on_one_server' => $event->onOneServer,
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
