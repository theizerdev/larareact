<?php

namespace App\Console\Commands;

use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Models\Payment;
use Illuminate\Console\Command;

class SyncPaymentsToCashRegister extends Command
{
    protected $signature = 'caja:sync-pagos
                            {--register= : ID específico de la caja (por defecto: todas las abiertas)}
                            {--dry-run : Solo muestra qué se sincronizaría sin hacer cambios}';

    protected $description = 'Sincroniza pagos completados que no tienen movimiento de caja con la caja abierta correspondiente';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $specificRegisterId = $this->option('register');

        if ($dryRun) {
            $this->warn('*** MODO DRY-RUN: No se harán cambios reales ***');
        }

        // Get open cash registers
        $query = CashRegister::where('estado', 'abierta');
        if ($specificRegisterId) {
            $query->where('id', $specificRegisterId);
        }
        $registers = $query->get();

        if ($registers->isEmpty()) {
            $this->error('No se encontraron cajas abiertas.');

            return self::FAILURE;
        }

        $this->info("Encontradas {$registers->count()} caja(s) abierta(s).");
        $this->newLine();

        $totalSynced = 0;

        foreach ($registers as $register) {
            $this->info("═══ Caja #{$register->id} (Usuario: {$register->user?->name}, Abierta: {$register->fecha_apertura?->format('d/m/Y H:i')}) ═══");

            // Find completed payments during this register's open period
            // that don't have a CashMovement linked to THIS register
            $linkedPaymentIds = CashMovement::where('cash_register_id', $register->id)
                ->whereNotNull('payment_id')
                ->pluck('payment_id')
                ->toArray();

            $orphanPayments = Payment::where('estado', 'completado')
                ->where('user_id', $register->user_id)
                ->where('fecha_pago', '>=', $register->fecha_apertura)
                ->when(! empty($linkedPaymentIds), fn ($q) => $q->whereNotIn('id', $linkedPaymentIds))
                ->with('order')
                ->get();

            if ($orphanPayments->isEmpty()) {
                $this->line('  ✓ Todos los pagos están sincronizados.');
                $this->newLine();

                continue;
            }

            $this->line("  Encontrados {$orphanPayments->count()} pago(s) sin movimiento de caja:");
            $this->newLine();

            // Table header
            $rows = [];
            foreach ($orphanPayments as $payment) {
                $orderNum = $payment->order?->numero ?? 'N/A';
                $rows[] = [
                    $payment->id,
                    $orderNum,
                    $payment->metodo_pago_label,
                    '$'.number_format($payment->amount, 2),
                    $payment->fecha_pago?->format('d/m/Y H:i') ?? '-',
                ];

                if (! $dryRun) {
                    CashMovement::create([
                        'cash_register_id' => $register->id,
                        'tipo' => 'ingreso',
                        'monto' => $payment->amount,
                        'descripcion' => "Pago pedido #{$orderNum} — {$payment->metodo_pago_label} (sincronizado)",
                        'payment_id' => $payment->id,
                        'user_id' => $register->user_id,
                    ]);
                }

                $totalSynced++;
            }

            $this->table(
                ['ID Pago', 'Orden', 'Método', 'Monto', 'Fecha'],
                $rows
            );

            $this->newLine();
        }

        // Summary
        $this->newLine();
        if ($dryRun) {
            $this->warn("DRY-RUN: Se sincronizarían {$totalSynced} pago(s).");
        } else {
            $this->info("✓ Se sincronizaron {$totalSynced} pago(s) con su caja correspondiente.");
        }

        return self::SUCCESS;
    }
}
