<?php

namespace App\Services;

use App\Models\Empresa;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ControlAccesoService
{
    private ?string $baseUrl;

    private ?string $appToken;

    private ?string $userToken;

    private int $companyId;

    public function __construct(Empresa $empresa)
    {
        $this->baseUrl = $empresa->control_acceso_base_url ? rtrim($empresa->control_acceso_base_url, '/') : null;
        $this->appToken = $empresa->control_acceso_app_token;
        $this->userToken = $empresa->control_acceso_user_token;
        $this->companyId = $empresa->id;
    }

    /**
     * Cabeceras de autenticación esperadas por el middleware de Control de Acceso.
     */
    private function getHeaders(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->appToken,
            'X-User-Token' => $this->userToken,
            'Accept' => 'application/json',
        ];
    }

    /**
     * Prueba la conexión contra el middleware llamando al endpoint de empleados.
     */
    public function testConnection(): array
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/employees");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => __('Connection successful. The Access Control middleware responded correctly.'),
                ];
            }

            if (in_array($response->status(), [401, 403])) {
                return [
                    'success' => false,
                    'message' => __('Connection rejected. Check the App Token and User Token.'),
                ];
            }

            Log::warning('Control Acceso Test Connection HTTP Error', [
                'company_id' => $this->companyId,
                'status' => $response->status(),
            ]);

            return [
                'success' => false,
                'message' => __('The middleware responded with an unexpected error.').' (HTTP '.$response->status().')',
            ];
        } catch (ConnectionException $e) {
            Log::error('Control Acceso Service Unavailable: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'url' => $this->baseUrl,
            ]);

            return [
                'success' => false,
                'message' => __('Unable to reach the Access Control middleware. Check the Base URL.'),
            ];
        } catch (\Exception $e) {
            Log::error('Control Acceso Test Connection Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
            ]);

            return [
                'success' => false,
                'message' => __('An unexpected error occurred while testing the connection.'),
            ];
        }
    }
}
