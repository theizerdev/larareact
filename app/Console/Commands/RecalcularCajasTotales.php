<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Caja;

class RecalcularCajasTotales extends Command
{
    protected $signature = 'cajas:recalcular-totales';
    protected $description = 'Recalcula los totales de todas las cajas existentes';

    public function handle()
    {
        $this->info('Recalculando totales de cajas...');

        $cajas = Caja::all();
        $total = $cajas->count();
        $contador = 0;

        if ($total > 0) {
            $this->output->progressStart($total);
        }

        foreach ($cajas as $caja) {
            $caja->calcularTotales();
            $contador++;
            if ($total > 0) {
                $this->output->progressAdvance();
            }
        }

        if ($total > 0) {
            $this->output->progressFinish();
        }

        $this->info("Se han recalculado {$contador} cajas exitosamente.");

        return Command::SUCCESS;
    }
}
