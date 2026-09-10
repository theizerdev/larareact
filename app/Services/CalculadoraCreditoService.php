<?php

namespace App\Services;

use App\Models\Credito;
use App\Models\PlanFinanciamiento;
use Carbon\Carbon;
use InvalidArgumentException;

class CalculadoraCreditoService
{
    /**
     * Calcula la proyección completa del crédito y genera la tabla de amortización preliminar.
     *
     * @param float $precioEquipo
     * @param float $montoInicial
     * @param PlanFinanciamiento $plan
     * @param Carbon|string|null $fechaInicio
     * @return array
     */
    public function simular(
        float $precioEquipo,
        float $montoInicial,
        PlanFinanciamiento $plan,
        Carbon|string|null $fechaInicio = null
    ): array {
        $fecha = $fechaInicio ? Carbon::parse($fechaInicio) : Carbon::today();

        $inicialMinima = round($precioEquipo * ($plan->porcentaje_inicial_minimo / 100), 2);
        if ($montoInicial < $inicialMinima) {
            throw new InvalidArgumentException(
                "El monto inicial mínimo requerido es de {$inicialMinima} ({$plan->porcentaje_inicial_minimo}%)."
            );
        }

        if ($montoInicial >= $precioEquipo) {
            throw new InvalidArgumentException("El monto inicial no puede ser mayor o igual al precio total del equipo.");
        }

        $montoFinanciado = round($precioEquipo - $montoInicial, 2);
        $interesTotal = round($montoFinanciado * ($plan->porcentaje_interes_total / 100), 2);
        $totalCredito = round($montoFinanciado + $interesTotal, 2);

        $numeroCuotas = (int) $plan->numero_cuotas;
        if ($numeroCuotas <= 0) {
            throw new InvalidArgumentException("El plan debe tener al menos 1 cuota.");
        }

        // Distribución equitativa y ajuste de céntimos en la última cuota
        $capitalBase = round($montoFinanciado / $numeroCuotas, 2);
        $interesBase = round($interesTotal / $numeroCuotas, 2);

        $cuotas = [];
        $acumCapital = 0.0;
        $acumInteres = 0.0;
        $acumCuota = 0.0;

        for ($i = 1; $i <= $numeroCuotas; $i++) {
            $fechaVencimiento = match ($plan->frecuencia) {
                'semanal' => $fecha->copy()->addWeeks($i),
                'quincenal' => $fecha->copy()->addDays($i * 15),
                'mensual' => $fecha->copy()->addMonthsNoOverflow($i),
                default => $fecha->copy()->addDays($i * 15),
            };

            // Para la última cuota, se ajusta el remanente por redondeo
            if ($i === $numeroCuotas) {
                $capitalCuota = round($montoFinanciado - $acumCapital, 2);
                $interesCuota = round($interesTotal - $acumInteres, 2);
                $montoCuota = round($totalCredito - $acumCuota, 2);
            } else {
                $capitalCuota = $capitalBase;
                $interesCuota = $interesBase;
                $montoCuota = round($capitalCuota + $interesCuota, 2);

                $acumCapital = round($acumCapital + $capitalCuota, 2);
                $acumInteres = round($acumInteres + $interesCuota, 2);
                $acumCuota = round($acumCuota + $montoCuota, 2);
            }

            $cuotas[] = [
                'numero_cuota' => $i,
                'fecha_vencimiento' => $fechaVencimiento->format('Y-m-d'),
                'monto_capital' => $capitalCuota,
                'monto_interes' => $interesCuota,
                'monto_cuota' => $montoCuota,
                'monto_mora' => 0.00,
                'monto_pagado' => 0.00,
                'saldo_cuota' => $montoCuota,
                'estado' => 'pendiente',
            ];
        }

        return [
            'precio_equipo' => $precioEquipo,
            'monto_inicial' => $montoInicial,
            'inicial_minima' => $inicialMinima,
            'monto_financiado' => $montoFinanciado,
            'porcentaje_interes' => (float) $plan->porcentaje_interes_total,
            'interes_total' => $interesTotal,
            'total_credito' => $totalCredito,
            'numero_cuotas' => $numeroCuotas,
            'frecuencia' => $plan->frecuencia,
            'fecha_inicio' => $fecha->format('Y-m-d'),
            'primer_vencimiento' => $cuotas[0]['fecha_vencimiento'] ?? null,
            'ultimo_vencimiento' => end($cuotas)['fecha_vencimiento'] ?? null,
            'cuotas' => $cuotas,
        ];
    }

    /**
     * Genera un código correlativo único para el crédito.
     */
    public static function generarCodigoCredito(int $empresaId): string
    {
        $year = date('Y');
        $count = Credito::where('empresa_id', $empresaId)
            ->whereYear('created_at', $year)
            ->count() + 1;

        return sprintf('CRD-%s-%05d', $year, $count);
    }
}

