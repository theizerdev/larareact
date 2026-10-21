<?php

namespace App\Jobs;

use App\Models\Empleado;
use App\Services\BioTimeEmpleadoPusher;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

/**
 * Envía a BioTime un colaborador recién creado o editado en la web.
 *
 * En la cola para que guardar en Colaboradores no espere a BioTime Cloud. Si
 * BioTime no responde se reintenta; un rechazo (dato inválido, número
 * duplicado) queda en empleados.biotime_push_error y no se reintenta.
 */
class EnviarEmpleadoBioTime implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;

    public int $timeout = 90;

    public function __construct(public int $empleadoId)
    {
    }

    public function handle(BioTimeEmpleadoPusher $pusher): void
    {
        $empleado = Empleado::withoutTenant()->find($this->empleadoId);

        if ($empleado === null) {
            return;
        }

        $r = $pusher->enviar($empleado);

        if (! $r['ok'] && $r['reintentar'] && $this->attempts() < $this->tries) {
            $this->release(120);
        }
    }
}
