<?php

namespace App\Console\Commands;

use App\Models\Caja;
use App\Models\User;
use Illuminate\Console\Command;

class CheckCajasData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cajas:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verificar datos de cajas y filtros';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== VERIFICACIÓN DE DATOS DE CAJAS ===');

        // Total de cajas
        $totalCajas = Caja::count();
        $this->info("Total de cajas en la base de datos: {$totalCajas}");

        if ($totalCajas === 0) {
            $this->warn('No hay cajas registradas en la base de datos');
            return;
        }

        // Obtener usuario actual
        $user = auth()->user() ?? User::first();
        if (!$user) {
            $this->error('No hay usuarios en la base de datos');
            return;
        }

        $this->info("Usuario: {$user->name}");
        $this->info("Empresa ID: " . ($user->empresa_id ?? 'null'));
        $this->info("Sucursal ID: " . ($user->sucursal_id ?? 'null'));

        // Verificar cajas por empresa y sucursal
        $cajasPorEmpresa = Caja::where('empresa_id', $user->empresa_id)->count();
        $cajasPorSucursal = Caja::where('sucursal_id', $user->sucursal_id)->count();

        $this->info("Cajas con empresa_id={$user->empresa_id}: {$cajasPorEmpresa}");
        $this->info("Cajas con sucursal_id={$user->sucursal_id}: {$cajasPorSucursal}");

        // Verificar cajas con ambos filtros (como usa el componente)
        $cajasFiltradas = Caja::where('empresa_id', $user->empresa_id)
            ->where('sucursal_id', $user->sucursal_id)
            ->count();
        $this->info("Cajas con empresa_id={$user->empresa_id} Y sucursal_id={$user->sucursal_id}: {$cajasFiltradas}");

        // Mostrar algunas cajas de ejemplo
        if ($cajasFiltradas > 0) {
            $this->info('\\n=== MUESTRA DE CAJAS FILTRADAS ===');
            $cajasMuestra = Caja::where('empresa_id', $user->empresa_id)
                ->where('sucursal_id', $user->sucursal_id)
                ->limit(3)
                ->get();

            foreach ($cajasMuestra as $caja) {
                $this->info("Caja ID: {$caja->id}, Fecha: {$caja->fecha}, Estado: {$caja->estado}, Usuario ID: {$caja->user_id}");
            }
        } else {
            $this->warn('\\nNo hay cajas que coincidan con los filtros de empresa y sucursal del usuario actual');

            // Mostrar cajas sin filtros
            $this->info('\\n=== MUESTRA DE TODAS LAS CAJAS ===');
            $cajasMuestra = Caja::limit(3)->get();
            foreach ($cajasMuestra as $caja) {
                $this->info("Caja ID: {$caja->id}, Empresa ID: {$caja->empresa_id}, Sucursal ID: {$caja->sucursal_id}, Fecha: {$caja->fecha}, Estado: {$caja->estado}, Usuario ID: {$caja->user_id}");
            }
        }

        $this->info('\\n=== VERIFICACIÓN COMPLETADA ===');
    }
}
