<?php

namespace App\Listeners;

use App\Jobs\SyncBioTimeEmployeesJob;
use App\Models\Empresa;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Cache;

/**
 * Dispara la sincronización de empleados de BioTime al iniciar sesión,
 * manteniendo un cooldown de 15 minutos para evitar saturar la API de BioTime.
 */
class SyncBioTimeEmployeesOnLogin
{
    public const COOLDOWN_MINUTES = 15;

    public function handle(Login $event): void
    {
        $user = $event->user;

        if (! $user || ! $user->empresa_id) {
            return;
        }

        $empresa = $user->empresa ?? Empresa::find($user->empresa_id);

        if (! $empresa || ! $empresa->biotime_active) {
            return;
        }

        $cacheKey = "biotime:auto_sync:empresa_{$empresa->id}";

        if (Cache::has($cacheKey)) {
            return;
        }

        Cache::put($cacheKey, now()->toIso8601String(), now()->addMinutes(self::COOLDOWN_MINUTES));

        dispatch(new SyncBioTimeEmployeesJob($empresa->id))->afterResponse();
    }
}

