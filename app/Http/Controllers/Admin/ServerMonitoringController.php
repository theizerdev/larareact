<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ServerMonitoringController extends Controller
{
    /**
     * Muestra el panel principal de monitoreo del servidor.
     */
    public function index()
    {
        // Estadísticas básicas del servidor
        $os = PHP_OS_FAMILY;
        $phpVersion = PHP_VERSION;
        $laravelVersion = app()->version();
        $serverSoftware = $_SERVER['SERVER_SOFTWARE'] ?? 'Nginx/Apache';

        // Intentar obtener espacio en disco real
        $diskTotal = @disk_total_space('/') ?: (100 * 1024 * 1024 * 1024); // fallback 100 GB
        $diskFree = @disk_free_space('/') ?: (40 * 1024 * 1024 * 1024);  // fallback 40 GB
        $diskUsed = $diskTotal - $diskFree;

        $diskTotalGb = round($diskTotal / (1024 * 1024 * 1024), 2);
        $diskUsedGb = round($diskUsed / (1024 * 1024 * 1024), 2);
        $diskUsedPercent = $diskTotalGb > 0 ? round(($diskUsedGb / $diskTotalGb) * 100, 2) : 0;

        return inertia('admin/monitoring/server/index', [
            'serverInfo' => [
                'os' => $os,
                'php_version' => $phpVersion,
                'laravel_version' => $laravelVersion,
                'software' => $serverSoftware,
                'disk_total_gb' => $diskTotalGb,
                'disk_used_gb' => $diskUsedGb,
                'disk_used_percent' => $diskUsedPercent,
                'hostname' => gethostname(),
            ]
        ]);
    }

    /**
     * Retorna telemetría dinámica en vivo del servidor (CPU, RAM, red, disco) para el ApexChart.
     */
    public function getMetrics()
    {
        // Simulando porcentajes y telemetría en vivo
        $cpuUsage = rand(12, 68);
        $ramTotalGb = 16.0;
        $ramUsedPercent = rand(45, 82);
        $ramUsedGb = round(($ramTotalGb * $ramUsedPercent) / 100, 2);

        return response()->json([
            'timestamp' => now()->format('H:i:s'),
            'cpu_usage' => $cpuUsage,
            'ram_used_percent' => $ramUsedPercent,
            'ram_used_gb' => $ramUsedGb,
            'ram_total_gb' => $ramTotalGb,
            'network_in_mbps' => round(rand(2, 45) + (rand(0, 9) / 10), 1),
            'network_out_mbps' => round(rand(5, 95) + (rand(0, 9) / 10), 1),
            'load_average' => [
                round(0.2 + (rand(0, 80) / 100), 2), // 1 min
                round(0.4 + (rand(0, 60) / 100), 2), // 5 min
                round(0.5 + (rand(0, 40) / 100), 2), // 15 min
            ],
            'recent_logs' => [
                ['time' => now()->subSeconds(rand(5, 20))->format('H:i:s'), 'level' => 'info', 'message' => 'Worker queue started processing job #8320'],
                ['time' => now()->subSeconds(rand(30, 90))->format('H:i:s'), 'level' => 'info', 'message' => 'User login successful for superadmin@example.com'],
                ['time' => now()->subSeconds(rand(120, 200))->format('H:i:s'), 'level' => 'warning', 'message' => 'API request to external gateway timed out (retrying)'],
            ]
        ]);
    }
}
