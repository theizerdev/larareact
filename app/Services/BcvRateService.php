<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BcvRateService
{
    /**
     * Get official USD rate from BCV (Banco Central de Venezuela).
     */
    public function getRate(): ?float
    {
        // Provider 1: ve.dolarapi.com
        try {
            $response = Http::timeout(6)->get('https://ve.dolarapi.com/v1/dolares/oficial');
            if ($response->successful()) {
                $data = $response->json();
                $rate = $data['promedio'] ?? $data['venta'] ?? $data['compra'] ?? null;
                if ($rate && is_numeric($rate) && (float)$rate > 0) {
                    return round((float)$rate, 4);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Error fetching rate from dolarapi: ' . $e->getMessage());
        }

        // Provider 2: pydolarve fallback
        try {
            $response = Http::timeout(6)->get('https://pydolarve.org/api/v1/dollar?page=bcv');
            if ($response->successful()) {
                $data = $response->json();
                $rate = $data['moneda']['usd']['promedio'] ?? $data['price'] ?? null;
                if ($rate && is_numeric($rate) && (float)$rate > 0) {
                    return round((float)$rate, 4);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Error fetching rate from pydolarve: ' . $e->getMessage());
        }

        // Provider 3: bcv-api fallback
        try {
            $response = Http::timeout(6)->get('https://bcv-api.uiconsulting.com.ve/api/v1/dolar');
            if ($response->successful()) {
                $data = $response->json();
                $rate = $data['rate'] ?? $data['monto'] ?? null;
                if ($rate && is_numeric($rate) && (float)$rate > 0) {
                    return round((float)$rate, 4);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Error fetching rate from bcv-api: ' . $e->getMessage());
        }

        return null;
    }
}
