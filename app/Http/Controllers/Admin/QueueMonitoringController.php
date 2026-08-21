<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class QueueMonitoringController extends Controller
{
    /**
     * Muestra las estadísticas y listado de trabajos en cola.
     */
    public function index()
    {
        $queueConnection = config('queue.default');

        // Trabajos Pendientes en la tabla de base de datos
        $pendingJobs = DB::table('jobs')
            ->select('id', 'queue', 'attempts', 'reserved_at', 'available_at', 'created_at')
            ->get()
            ->map(function ($job) {
                // El payload suele tener el nombre de la clase serializada, pero simplificamos la visualización
                return [
                    'id' => $job->id,
                    'queue' => $job->queue,
                    'attempts' => $job->attempts,
                    'status' => $job->reserved_at ? 'running' : 'pending',
                    'created_at' => date('Y-m-d H:i:s', $job->created_at),
                ];
            });

        // Trabajos Fallidos
        $failedJobs = DB::table('failed_jobs')
            ->select('id', 'connection', 'queue', 'failed_at', 'exception')
            ->orderBy('failed_at', 'desc')
            ->get()
            ->map(function ($job) {
                // Extraer un fragmento legible de la excepción
                $exceptionLines = explode("\n", $job->exception);
                $shortException = count($exceptionLines) > 0 ? $exceptionLines[0] : 'Excepción Desconocida';

                return [
                    'id' => $job->id,
                    'connection' => $job->connection,
                    'queue' => $job->queue,
                    'failed_at' => $job->failed_at,
                    'exception' => $shortException,
                    'full_exception' => $job->exception,
                ];
            });

        return inertia('admin/monitoring/queues/index', [
            'stats' => [
                'connection' => $queueConnection,
                'pending' => $pendingJobs->where('status', 'pending')->count(),
                'running' => $pendingJobs->where('status', 'running')->count(),
                'failed' => $failedJobs->count(),
            ],
            'pendingJobs' => $pendingJobs,
            'failedJobs' => $failedJobs,
        ]);
    }

    /**
     * Reintenta un trabajo fallido específico.
     */
    public function retry($id)
    {
        Artisan::call('queue:retry', ['id' => $id]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Job retried successfully.'),
        ]);
    }

    /**
     * Reintenta todos los trabajos fallidos.
     */
    public function retryAll()
    {
        Artisan::call('queue:retry', ['id' => ['all']]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('All failed jobs have been queued for retry.'),
        ]);
    }

    /**
     * Elimina un trabajo fallido de la base de datos.
     */
    public function destroy($id)
    {
        DB::table('failed_jobs')->where('id', $id)->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Failed job deleted successfully.'),
        ]);
    }

    /**
     * Elimina todos los trabajos fallidos de la base de datos.
     */
    public function destroyAll()
    {
        DB::table('failed_jobs')->truncate();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('All failed jobs cleared successfully.'),
        ]);
    }
}
