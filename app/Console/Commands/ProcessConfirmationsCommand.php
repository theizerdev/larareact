<?php

namespace App\Console\Commands;

use App\Jobs\RetryFailedConfirmation;
use App\Models\CitaConfirmacion;
use App\Services\CitaConfirmationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessConfirmationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'confirmations:process 
                            {--type=all : Tipo de procesamiento (all, pending, expired, retry)}
                            {--limit=100 : Límite de confirmaciones a procesar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Procesa confirmaciones de citas pendientes, expiradas y reintentos';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $type = $this->option('type');
        $limit = (int) $this->option('limit');

        $this->info("Iniciando procesamiento de confirmaciones [tipo: {$type}, límite: {$limit}]");

        $procesadas = 0;
        $exitosas = 0;
        $fallidas = 0;

        switch ($type) {
            case 'pending':
                $procesadas = $this->processPending($limit, $exitosas, $fallidas);
                break;
            case 'expired':
                $procesadas = $this->processExpired($limit, $exitosas, $fallidas);
                break;
            case 'retry':
                $procesadas = $this->processRetries($limit, $exitosas, $fallidas);
                break;
            case 'all':
            default:
                $procesadas += $this->processExpired($limit, $exitosas, $fallidas);
                $procesadas += $this->processRetries($limit, $exitosas, $fallidas);
                break;
        }

        $this->info('Procesamiento completado:');
        $this->info("- Total procesadas: {$procesadas}");
        $this->info("- Exitosas: {$exitosas}");
        $this->info("- Fallidas: {$fallidas}");

        Log::info('Comando ProcessConfirmations ejecutado', [
            'type' => $type,
            'procesadas' => $procesadas,
            'exitosas' => $exitosas,
            'fallidas' => $fallidas,
        ]);

        return 0;
    }

    /**
     * Procesa confirmaciones expiradas
     */
    private function processExpired(int $limit, int &$exitosas, int &$fallidas): int
    {
        $this->info('Procesando confirmaciones expiradas...');

        $expiradas = CitaConfirmacion::expiradas()
            ->where('estado', CitaConfirmacion::ESTADO_PENDIENTE)
            ->limit($limit)
            ->get();

        $contador = 0;
        foreach ($expiradas as $confirmacion) {
            try {
                $confirmacion->marcarComoExpirada();
                $exitosas++;
                $contador++;

                $this->info("Confirmación {$confirmacion->id} marcada como expirada");
            } catch (\Exception $e) {
                Log::error("Error marcando confirmación como expirada: {$e->getMessage()}", [
                    'confirmacion_id' => $confirmacion->id,
                ]);
                $fallidas++;
            }
        }

        return $contador;
    }

    /**
     * Procesa reintentos de confirmaciones fallidas
     */
    private function processRetries(int $limit, int &$exitosas, int &$fallidas): int
    {
        $this->info('Procesando reintentos de confirmaciones...');

        $pendientes = CitaConfirmacion::pendientes()
            ->where('intentos', '<', 3)
            ->where('intentos', '>', 0) // Solo las que ya tienen al menos 1 intento
            ->limit($limit)
            ->get();

        $contador = 0;
        foreach ($pendientes as $confirmacion) {
            try {
                // Verificar si puede reintentar
                if (! $confirmacion->puedeReintentar()) {
                    continue;
                }

                // Despachar job de reintento
                RetryFailedConfirmation::dispatch($confirmacion->id);

                $exitosas++;
                $contador++;

                $this->info("Reintento programado para confirmación {$confirmacion->id}");
            } catch (\Exception $e) {
                Log::error("Error programando reintento: {$e->getMessage()}", [
                    'confirmacion_id' => $confirmacion->id,
                ]);
                $fallidas++;
            }
        }

        return $contador;
    }

    /**
     * Procesa confirmaciones pendientes (envío inicial)
     */
    private function processPending(int $limit, int &$exitosas, int &$fallidas): int
    {
        $this->info('Procesando confirmaciones pendientes...');

        // Este método normalmente se maneja mediante jobs cuando se crea la cita
        // pero podemos usarlo para verificar confirmaciones que no se enviaron
        $pendientes = CitaConfirmacion::pendientes()
            ->where('intentos', 0)
            ->whereNull('fecha_envio')
            ->limit($limit)
            ->get();

        $service = new CitaConfirmationService;
        $contador = 0;

        foreach ($pendientes as $confirmacion) {
            try {
                $resultado = $service->enviarConfirmacion($confirmacion);

                if ($resultado) {
                    $confirmacion->update([
                        'fecha_envio' => now(),
                        'intentos' => 1,
                    ]);
                    $exitosas++;
                    $this->info("Confirmación {$confirmacion->id} enviada exitosamente");
                } else {
                    $fallidas++;
                    $this->warn("Error enviando confirmación {$confirmacion->id}");
                }

                $contador++;

            } catch (\Exception $e) {
                Log::error("Error enviando confirmación pendiente: {$e->getMessage()}", [
                    'confirmacion_id' => $confirmacion->id,
                ]);
                $fallidas++;
            }
        }

        return $contador;
    }
}
