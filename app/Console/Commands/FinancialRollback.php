<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\Consulta;
use App\Models\Pago;
use App\Models\Serie;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FinancialRollback extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'financial:rollback {date : La fecha y hora de corte (Y-m-d H:i:s)} {--force : Forzar ejecución sin confirmación}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Elimina pagos y documentos financieros creados después de una fecha específica, restaurando el estado anterior sin dejar rastro.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dateInput = $this->argument('date');

        try {
            $cutoffDate = Carbon::parse($dateInput);
        } catch (\Exception $e) {
            $this->error('Formato de fecha inválido. Use Y-m-d H:i:s');

            return 1;
        }

        if (! $this->option('force') && ! $this->confirm("¡ADVERTENCIA! Esta acción ELIMINARÁ PERMANENTEMENTE todos los pagos y documentos creados después de {$cutoffDate}. Esta acción NO se puede deshacer y no dejará rastro en auditoría. ¿Desea continuar?")) {
            $this->info('Operación cancelada.');

            return 0;
        }

        $this->info("Iniciando reversión financiera hasta: {$cutoffDate}");

        DB::beginTransaction();

        try {
            // 1. Obtener pagos a eliminar (ordenados descendente para manejar dependencias)
            $pagos = Pago::where('created_at', '>', $cutoffDate)
                ->orderBy('id', 'desc')
                ->get();

            if ($pagos->isEmpty()) {
                $this->info('No se encontraron registros posteriores a la fecha indicada.');
                DB::rollBack();

                return 0;
            }

            $count = $pagos->count();
            $bar = $this->output->createProgressBar($count);
            $bar->start();

            // Agrupar pagos por serie para ajustar correlativos al final
            $seriesAffected = [];

            foreach ($pagos as $pago) {
                // Restaurar estado de consulta si aplica
                if ($pago->consulta_id) {
                    $consulta = Consulta::find($pago->consulta_id);
                    if ($consulta && $consulta->estado === 'pagada') {
                        // Verificar si hay otros pagos válidos anteriores a la fecha de corte
                        $otrosPagos = Pago::where('consulta_id', $consulta->id)
                            ->where('id', '!=', $pago->id)
                            ->where('created_at', '<=', $cutoffDate)
                            ->where('estado', 'aprobado')
                            ->exists();

                        if (! $otrosPagos) {
                            $consulta->estado = 'finalizada'; // O el estado previo que corresponda
                            $consulta->save();
                        }
                    }
                }

                // Registrar serie afectada para ajuste posterior
                if ($pago->serie_id) {
                    if (! isset($seriesAffected[$pago->serie_id])) {
                        $seriesAffected[$pago->serie_id] = [
                            'model' => Serie::find($pago->serie_id),
                            'min_deleted_numero' => $pago->numero,
                            'max_deleted_numero' => $pago->numero,
                            'count' => 0,
                        ];
                    } else {
                        $seriesAffected[$pago->serie_id]['min_deleted_numero'] = min($seriesAffected[$pago->serie_id]['min_deleted_numero'], $pago->numero);
                        $seriesAffected[$pago->serie_id]['max_deleted_numero'] = max($seriesAffected[$pago->serie_id]['max_deleted_numero'], $pago->numero);
                    }
                    $seriesAffected[$pago->serie_id]['count']++;
                }

                // Eliminar detalles (cascade suele encargarse, pero por seguridad)
                $pago->detalles()->delete(); // Hard delete si no usa SoftDeletes, o forceDelete

                // Eliminar logs de auditoría específicos de este pago
                // Asumiendo que AuditLog usa polymorphic relation o properties
                AuditLog::where('auditable_type', Pago::class)
                    ->where('auditable_id', $pago->id)
                    ->delete();

                // También eliminar logs de Spatie ActivityLog si se usan
                DB::table('activity_log')
                    ->where('subject_type', Pago::class)
                    ->where('subject_id', $pago->id)
                    ->delete();

                // Eliminar el pago físicamente
                $pago->forceDelete();

                $bar->advance();
            }

            // Ajustar correlativos de series
            // La lógica más segura es: establecer el correlativo actual al último número válido existente
            foreach ($seriesAffected as $serieId => $data) {
                $serie = $data['model'];
                if ($serie) {
                    // Buscar el último pago válido para esta serie
                    $ultimoPago = Pago::where('serie_id', $serieId)
                        ->orderBy('numero', 'desc')
                        ->first();

                    if ($ultimoPago) {
                        $serie->correlativo_actual = $ultimoPago->numero;
                        // Ajustar control fiscal si aplica
                        if ($serie->control_fiscal_actual) {
                            // Esto es aproximado, idealmente buscaríamos el último control fiscal usado
                            // Pero si asumimos sincronía:
                            $serie->control_fiscal_actual = $ultimoPago->numero_control_fiscal;
                        }
                    } else {
                        // Si no quedan pagos, resetear al valor inicial (o 0)
                        // Esto depende de si se quiere reutilizar desde el 1
                        // Si borramos TODOS los pagos de una serie, podríamos querer resetear a 0
                        // Pero hay que tener cuidado si la serie ya tenía historia antigua no borrada

                        // Si min_deleted_numero > 1, significa que quedaron registros antes (que tal vez no están en BD o son muy viejos)
                        // Mejor:
                        $serie->correlativo_actual = max(0, $data['min_deleted_numero'] - 1);

                        if ($serie->control_fiscal_actual) {
                            $serie->control_fiscal_actual = str_pad(
                                max(0, intval($data['min_deleted_numero']) - 1),
                                $serie->longitud_control_fiscal ?? 8,
                                '0',
                                STR_PAD_LEFT
                            );
                        }
                    }
                    $serie->save();
                }
            }

            $bar->finish();
            $this->newLine();

            DB::commit();
            $this->info("Reversión completada exitosamente. {$count} registros eliminados.");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Error durante la reversión: '.$e->getMessage());

            return 1;
        }
    }
}
