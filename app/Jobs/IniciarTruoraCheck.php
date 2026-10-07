<?php

namespace App\Jobs;

use App\Models\KycValidacion;
use App\Services\Validaciones\TruoraSincronizador;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/** Abre el check de antecedentes en TRUORA justo después de responder al usuario. Nunca afecta al registro. */
class IniciarTruoraCheck implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(public KycValidacion $validacion)
    {
    }

    public function handle(): void
    {
        try {
            $val = KycValidacion::withoutGlobalScopes()->find($this->validacion->id);

            if ($val && empty($val->truora_check_id)) {
                TruoraSincronizador::iniciar($val);
            }
        } catch (\Throwable $e) {
            Log::error('TRUORA: no se pudo iniciar el check: '.$e->getMessage(), ['kyc_validacion_id' => $this->validacion->id]);
        }
    }
}
