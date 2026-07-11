<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Pago;
use App\Models\Student;
use Carbon\Carbon;

class AddTestData extends Command
{
    protected $signature = 'test:data';
    protected $description = 'Agregar datos de prueba para ver el cambio porcentual';

    public function handle()
    {
        $this->info('Agregando datos de prueba...');

        // Buscar una matrícula activa
        $matricula = \App\Models\Matricula::where('estado', 'activo')->first();

        if (!$matricula) {
            $this->error('No hay matrículas activas');
            return;
        }

        // Buscar un usuario administrativo
        $user = \App\Models\User::where('email', 'like', '%admin%')->first();
        if (!$user) {
            $user = \App\Models\User::first();
        }

        // Buscar un concepto de pago
        $concepto = \App\Models\ConceptoPago::first();
        if (!$concepto) {
            $this->error('No hay conceptos de pago');
            return;
        }

        // Crear pago en el período anterior (hace 45 días)
        $pagoAnterior = new Pago();
        $pagoAnterior->matricula_id = $matricula->id;
        $pagoAnterior->concepto_pago_id = $concepto->id;
        $pagoAnterior->user_id = $user->id;
        $pagoAnterior->monto = 200;
        $pagoAnterior->monto_pagado = 200;
        $pagoAnterior->fecha_pago = Carbon::now()->subDays(45);
        $pagoAnterior->metodo_pago = 'efectivo';
        $pagoAnterior->estado = 'completado';
        $pagoAnterior->empresa_id = 1;
        $pagoAnterior->sucursal_id = 1;
        $pagoAnterior->save();

        $this->info('✅ Pago creado en período anterior: $200 hace 45 días');

        // Crear pago adicional en el período actual
        $pagoActual = new Pago();
        $pagoActual->matricula_id = $matricula->id;
        $pagoActual->concepto_pago_id = $concepto->id;
        $pagoActual->user_id = $user->id;
        $pagoActual->monto = 300;
        $pagoActual->monto_pagado = 300;
        $pagoActual->fecha_pago = Carbon::now()->subDays(15);
        $pagoActual->metodo_pago = 'efectivo';
        $pagoActual->estado = 'completado';
        $pagoActual->empresa_id = 1;
        $pagoActual->sucursal_id = 1;
        $pagoActual->save();

        $this->info('✅ Pago creado en período actual: $300 hace 15 días');

        $this->info('');
        $this->info('Datos de prueba creados exitosamente!');
        $this->info('Ahora el cambio debería mostrar: +100% (de $200 a $500)');
    }
}
