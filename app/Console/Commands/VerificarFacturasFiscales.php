<?php

namespace App\Console\Commands;

use App\Models\Pago;
use Illuminate\Console\Command;

class VerificarFacturasFiscales extends Command
{
    protected $signature = 'facturas:verificar';

    protected $description = 'Verifica y actualiza facturas fiscales en el sistema';

    public function handle()
    {
        $this->info('=== VERIFICACIÓN DE FACTURAS FISCALES ===');
        $this->newLine();

        // Verificar pagos
        $totalPagos = Pago::where('estado', 'aprobado')->count();
        $pagosFiscales = Pago::where('estado', 'aprobado')->where('es_factura_fiscal', true)->count();
        $pagosNoFiscales = Pago::where('estado', 'aprobado')->where('es_factura_fiscal', false)->count();

        $this->table(
            ['Concepto', 'Cantidad'],
            [
                ['Total pagos aprobados', $totalPagos],
                ['Pagos con factura fiscal', $pagosFiscales],
                ['Pagos sin factura fiscal', $pagosNoFiscales],
            ]
        );

        if ($pagosNoFiscales > 0) {
            $this->warn("Hay {$pagosNoFiscales} pago(s) sin factura fiscal configurada");
            $this->newLine();

            if ($this->confirm('¿Deseas actualizar estos pagos para que aparezcan en el Libro de Ventas?')) {
                $pagos = Pago::where('estado', 'aprobado')
                    ->where('es_factura_fiscal', false)
                    ->with(['consulta.paciente', 'clienteFiscal'])
                    ->get();

                $bar = $this->output->createProgressBar($pagos->count());
                $bar->start();

                foreach ($pagos as $pago) {
                    try {
                        // Generar número de control fiscal si no tiene
                        if (! $pago->numero_control_fiscal) {
                            $anio = $pago->fecha->format('Y');
                            $mes = $pago->fecha->format('m');
                            $consecutivo = str_pad($pago->id, 8, '0', STR_PAD_LEFT);
                            $pago->numero_control_fiscal = "{$anio}{$mes}-{$consecutivo}";
                        }

                        // Marcar como factura fiscal
                        $pago->es_factura_fiscal = true;

                        // Recalcular totales fiscales
                        $pago->calcularTotales();

                        $bar->advance();
                    } catch (\Exception $e) {
                        $this->error("Error en pago #{$pago->id}: {$e->getMessage()}");
                    }
                }

                $bar->finish();
                $this->newLine(2);
                $this->info("✓ Actualización completada: {$pagos->count()} pago(s) actualizado(s)");
                $this->info('Ahora los pagos deberían aparecer en el Libro de Ventas.');
            } else {
                $this->info('Operación cancelada.');
            }
        } else {
            $this->info('✓ Todos los pagos tienen factura fiscal configurada.');
        }

        return Command::SUCCESS;
    }
}
