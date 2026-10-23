<?php

namespace App\Services;

use App\Models\Empresa;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StripeBalanceService
{
    /**
     * Obtiene el balance en vivo de Stripe y su equivalente en USD.
     */
    public function getBalance(bool $forceRefresh = false): array
    {
        $cacheKey = 'stripe_balance_summary_data';

        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, 60, function () {
            return $this->fetchStripeBalanceFromApi();
        });
    }

    /**
     * Consulta directa a la API de Stripe y cálculo de conversión USD.
     */
    protected function fetchStripeBalanceFromApi(): array
    {
        $empresa = Empresa::withoutGlobalScopes()->find(1)
            ?? Empresa::withoutGlobalScopes()->whereNotNull('stripe_secret_key')->first();

        $secretKey = $empresa?->stripe_secret_key;

        if (empty($secretKey)) {
            return [
                'connected' => false,
                'error' => 'No se ha configurado la clave secreta de Stripe en la empresa principal.',
                'available_mxn' => 0.0,
                'pending_mxn' => 0.0,
                'total_mxn' => 0.0,
                'available_usd' => 0.0,
                'pending_usd' => 0.0,
                'total_usd' => 0.0,
                'usd_rate' => $this->getUsdRate(),
                'currency' => 'MXN',
                'livemode' => false,
                'last_updated' => now()->toIso8601String(),
            ];
        }

        try {
            $response = Http::withToken($secretKey)
                ->timeout(8)
                ->get('https://api.stripe.com/v1/balance');

            if (! $response->successful()) {
                $err = $response->json()['error']['message'] ?? 'Error desconocido al contactar Stripe.';
                Log::warning('Stripe Balance API Error: ' . $err);

                return [
                    'connected' => false,
                    'error' => $err,
                    'available_mxn' => 0.0,
                    'pending_mxn' => 0.0,
                    'total_mxn' => 0.0,
                    'available_usd' => 0.0,
                    'pending_usd' => 0.0,
                    'total_usd' => 0.0,
                    'usd_rate' => $this->getUsdRate(),
                    'currency' => 'MXN',
                    'livemode' => false,
                    'last_updated' => now()->toIso8601String(),
                ];
            }

            $data = $response->json();

            // Sumar montos en centavos para MXN (o convertir si hay otras monedas)
            $availableCents = 0;
            if (!empty($data['available']) && is_array($data['available'])) {
                foreach ($data['available'] as $item) {
                    $availableCents += ($item['amount'] ?? 0);
                }
            }

            $pendingCents = 0;
            if (!empty($data['pending']) && is_array($data['pending'])) {
                foreach ($data['pending'] as $item) {
                    $pendingCents += ($item['amount'] ?? 0);
                }
            }

            $availableMxn = round($availableCents / 100, 2);
            $pendingMxn = round($pendingCents / 100, 2);
            $totalMxn = round($availableMxn + $pendingMxn, 2);

            $usdRate = $this->getUsdRate();

            $availableUsd = $usdRate > 0 ? round($availableMxn / $usdRate, 2) : 0.0;
            $pendingUsd = $usdRate > 0 ? round($pendingMxn / $usdRate, 2) : 0.0;
            $totalUsd = $usdRate > 0 ? round($totalMxn / $usdRate, 2) : 0.0;

            // Obtener desglose de cobro bruto y comisiones retenidas por Stripe
            $grossMxn = $totalMxn;
            $feeMxn = 0.0;
            try {
                $txResponse = Http::withToken($secretKey)
                    ->timeout(6)
                    ->get('https://api.stripe.com/v1/balance_transactions?limit=50');
                if ($txResponse->successful()) {
                    $txs = $txResponse->json()['data'] ?? [];
                    $grossCents = 0;
                    $feeCents = 0;
                    foreach ($txs as $tx) {
                        if (($tx['currency'] ?? '') === 'mxn') {
                            $grossCents += ($tx['amount'] ?? 0);
                            $feeCents += ($tx['fee'] ?? 0);
                        }
                    }
                    if ($grossCents > 0) {
                        $grossMxn = round($grossCents / 100, 2);
                        $feeMxn = round($feeCents / 100, 2);
                    }
                }
            } catch (\Throwable $te) {
                Log::warning('Error consultando balance_transactions de Stripe: ' . $te->getMessage());
            }

            $grossUsd = $usdRate > 0 ? round($grossMxn / $usdRate, 2) : 0.0;
            $feeUsd = $usdRate > 0 ? round($feeMxn / $usdRate, 2) : 0.0;

            return [
                'connected' => true,
                'livemode' => (bool) ($data['livemode'] ?? true),
                'currency' => 'MXN',
                'usd_rate' => $usdRate,
                'available_mxn' => $availableMxn,
                'pending_mxn' => $pendingMxn,
                'total_mxn' => $totalMxn,
                'available_usd' => $availableUsd,
                'pending_usd' => $pendingUsd,
                'total_usd' => $totalUsd,
                'gross_mxn' => $grossMxn,
                'fee_mxn' => $feeMxn,
                'gross_usd' => $grossUsd,
                'fee_usd' => $feeUsd,
                'last_updated' => now()->toIso8601String(),
            ];
        } catch (\Throwable $e) {
            Log::error('Error fetching Stripe balance: ' . $e->getMessage());

            return [
                'connected' => false,
                'error' => 'Error de conexión: ' . $e->getMessage(),
                'available_mxn' => 0.0,
                'pending_mxn' => 0.0,
                'total_mxn' => 0.0,
                'available_usd' => 0.0,
                'pending_usd' => 0.0,
                'total_usd' => 0.0,
                'usd_rate' => $this->getUsdRate(),
                'currency' => 'MXN',
                'livemode' => false,
                'last_updated' => now()->toIso8601String(),
            ];
        }
    }

    /**
     * Obtiene el tipo de cambio USD a MXN (1 USD = X MXN).
     * Cacheado por 2 horas.
     */
    public function getUsdRate(): float
    {
        return Cache::remember('usd_to_mxn_rate', 7200, function () {
            try {
                $response = Http::timeout(5)->get('https://open.er-api.com/v6/latest/USD');
                if ($response->successful()) {
                    $rate = $response->json()['rates']['MXN'] ?? null;
                    if ($rate && is_numeric($rate) && (float) $rate > 0) {
                        return round((float) $rate, 4);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Error consultando open.er-api para USD/MXN: ' . $e->getMessage());
            }

            // Fallback a valor_dolar de la empresa o 18.60 aproximado
            $empresa = Empresa::withoutGlobalScopes()->find(1);
            if ($empresa && !empty($empresa->valor_dolar) && (float) $empresa->valor_dolar > 0) {
                return (float) $empresa->valor_dolar;
            }

            return 18.60;
        });
    }
}
