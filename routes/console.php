<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::starting(function ($artisan) {
    $artisan->resolveCommands([
        \App\Console\Commands\ConsolidateTenantsToCentralCommand::class,
        \App\Console\Commands\PruneExpiredTenantsCommand::class,
    ]);
});

/*
|--------------------------------------------------------------------------
| Tareas Programadas (Scheduled Tasks)
|--------------------------------------------------------------------------
| Todas las tareas registradas aquí aparecerán automáticamente en el panel
| de monitoreo de tareas (/admin/monitoring/tasks) y se podrán ejecutar manualmente.
*/

// Limpieza semanal automática de productos e inventario para la empresa activa
Schedule::command('empresa:clean-products --force')
    ->weeklyOn(0, '03:00')
    ->description('Limpieza de productos e inventario (Empresa en sesión)');

// Recordatorio diario automático de vencimiento de suscripciones (a 5 días)
Schedule::command('subscriptions:send-reminders')
    ->dailyAt('09:00')
    ->timezone('America/Caracas')
    ->description('Envío de recordatorios de vencimiento de suscripción por WhatsApp');

// Purga automática diaria de empresas con pruebas o suscripciones vencidas (al menos 10 días de gracia)
Schedule::command('tenants:prune-expired --days=10')
    ->dailyAt('03:00')
    ->description('Respaldo y eliminación definitiva de empresas con más de 10 días vencidas (prueba o suscripción)');



