<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IdentityDataService
{
    protected string $apiKey;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.identity_data.api_key', env('IDENTITY_DATA_API_KEY', ''));
        $this->baseUrl = config('services.identity_data.base_url', env('IDENTITY_DATA_BASE_URL', 'https://api.identitydata.mx/v1'));
    }

    /**
     * Consulta y valida una CURP en vivo a través de Identity Data API (RENAPO)
     */
    public function consultarCurp(string $curp): array
    {
        $cleanCurp = strtoupper(trim($curp));

        // 1. Si no hay API key configurada, realizar validación sintáctica/algorítmica local como fallback
        if (empty($this->apiKey)) {
            return $this->fallbackValidacionLocal($cleanCurp);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->timeout(10)
            ->post("{$this->baseUrl}/curp/validar", [
                'curp' => $cleanCurp,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'fuente' => 'RENAPO (Identity Data API)',
                    'curp' => $cleanCurp,
                    'nombres' => $data['nombres'] ?? $data['datos']['nombres'] ?? null,
                    'primer_apellido' => $data['primer_apellido'] ?? $data['datos']['primer_apellido'] ?? null,
                    'segundo_apellido' => $data['segundo_apellido'] ?? $data['datos']['segundo_apellido'] ?? null,
                    'nombre_completo' => trim(($data['nombres'] ?? '') . ' ' . ($data['primer_apellido'] ?? '') . ' ' . ($data['segundo_apellido'] ?? '')),
                    'fecha_nacimiento' => $data['fecha_nacimiento'] ?? $data['datos']['fecha_nacimiento'] ?? null,
                    'genero' => $data['genero'] ?? $data['datos']['genero'] ?? null, // M o F
                    'estado_nacimiento' => $data['estado'] ?? $data['datos']['estado'] ?? null,
                    'estatus_curp' => $data['estatus'] ?? $data['datos']['estatus'] ?? 'CERTIFICADA',
                ];
            }

            Log::warning("IdentityDataService: Error HTTP {$response->status()} consultando CURP {$cleanCurp}: " . $response->body());
            
            return $this->fallbackValidacionLocal($cleanCurp, "Error en servicio RENAPO ({$response->status()}). Mostrando validación sintáctica.");
        } catch (\Exception $e) {
            Log::error("IdentityDataService Exception: " . $e->getMessage());
            return $this->fallbackValidacionLocal($cleanCurp, "No se pudo conectar con la API de RENAPO. Mostrando validación sintáctica.");
        }
    }

    /**
     * Fallback de validación local si la API externa no está configurada o falla temporalmente.
     */
    protected function fallbackValidacionLocal(string $curp, ?string $mensaje = null): array
    {
        $rule = new \App\Rules\ValidCurp();
        $errorMsg = null;
        
        $rule->validate('curp', $curp, function ($msg) use (&$errorMsg) {
            $errorMsg = $msg;
        });

        if ($errorMsg) {
            return [
                'success' => false,
                'fuente' => 'Validación Algorítmica Local',
                'error' => $errorMsg,
            ];
        }

        // Extraer datos decodificados de la CURP
        $yy = substr($curp, 4, 2);
        $mm = substr($curp, 6, 2);
        $dd = substr($curp, 8, 2);
        $sexoChar = $curp[10];
        $entidadCode = substr($curp, 11, 2);
        $homoclaveChar = $curp[16];

        $siglo = is_numeric($homoclaveChar) ? '19' : '20';
        $fechaNacimiento = "{$siglo}{$yy}-{$mm}-{$dd}";

        return [
            'success' => true,
            'fuente' => 'Algoritmo Módulo 10 RENAPO (Local)',
            'curp' => $curp,
            'genero' => $sexoChar === 'H' ? 'M' : 'F',
            'fecha_nacimiento' => $fechaNacimiento,
            'estado_codigo' => $entidadCode,
            'nota' => $mensaje ?? 'Configura IDENTITY_DATA_API_KEY en .env para autocompletar nombres completos desde RENAPO.',
        ];
    }
}
