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
     * Indica si hay suficientes credenciales guardadas para intentar una conexión.
     */
    public function isConfigured(): bool
    {
        return $this->baseUrl !== null && $this->appToken !== null && $this->userToken !== null;
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
     * Realiza un GET JSON contra el middleware con manejo uniforme de errores.
     *
     * @return array{success: bool, data: array|null, error: string|null}
     */
    private function get(string $path, array $query = []): array
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}{$path}", $query);

            if ($response->successful()) {
                return ['success' => true, 'data' => $response->json(), 'error' => null];
            }

            if (in_array($response->status(), [401, 403])) {
                return [
                    'success' => false,
                    'data' => null,
                    'error' => __('Connection rejected. Check the App Token and User Token.'),
                ];
            }

            Log::warning('Control Acceso HTTP Error', [
                'company_id' => $this->companyId,
                'path' => $path,
                'status' => $response->status(),
            ]);

            return [
                'success' => false,
                'data' => null,
                'error' => __('The middleware responded with an unexpected error.').' (HTTP '.$response->status().')',
            ];
        } catch (ConnectionException $e) {
            Log::error('Control Acceso Service Unavailable: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'url' => $this->baseUrl,
                'path' => $path,
            ]);

            return [
                'success' => false,
                'data' => null,
                'error' => __('Unable to reach the Access Control middleware. Check the Base URL.'),
            ];
        } catch (\Exception $e) {
            Log::error('Control Acceso Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'path' => $path,
            ]);

            return [
                'success' => false,
                'data' => null,
                'error' => __('An unexpected error occurred while contacting the Access Control middleware.'),
            ];
        }
    }

    /**
     * Descarga una imagen binaria del middleware (foto de evento).
     *
     * @return array{success: bool, body: string|null, content_type: string|null}
     */
    private function getBinary(string $path): array
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}{$path}");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'body' => $response->body(),
                    'content_type' => $response->header('Content-Type') ?: 'image/jpeg',
                ];
            }

            Log::warning('Control Acceso Photo HTTP Error', [
                'company_id' => $this->companyId,
                'path' => $path,
                'status' => $response->status(),
            ]);

            return ['success' => false, 'body' => null, 'content_type' => null];
        } catch (\Exception $e) {
            Log::error('Control Acceso Photo Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'path' => $path,
            ]);

            return ['success' => false, 'body' => null, 'content_type' => null];
        }
    }

    /**
     * Prueba la conexión contra el middleware llamando al endpoint de empleados.
     */
    public function testConnection(): array
    {
        $result = $this->get('/employees', ['limit' => 1]);

        if ($result['success']) {
            return [
                'success' => true,
                'message' => __('Connection successful. The Access Control middleware responded correctly.'),
            ];
        }

        return ['success' => false, 'message' => $result['error']];
    }

    /**
     * Lista empleados registrados en el ivms.
     */
    public function listEmployees(array $query = []): array
    {
        return $this->get('/employees', $query);
    }

    /**
     * Lista vehículos registrados manualmente en el ivms (alta administrativa).
     */
    public function listVehicles(array $query = []): array
    {
        return $this->get('/vehicles', $query);
    }

    /**
     * Directorio automático de vehículos detectados por las cámaras ANPR
     * (incluye tanto detecciones no registradas como vehículos registrados).
     */
    public function listVehicleDirectory(array $query = []): array
    {
        return $this->get('/vehicles/directory', $query);
    }

    /**
     * Lista tarjetas de acceso registradas en el ivms.
     */
    public function listAccessCards(array $query = []): array
    {
        return $this->get('/access-cards', $query);
    }

    /**
     * Lista eventos de acceso peatonal (bitácora de auditoría, solo lectura).
     */
    public function listAccessEvents(array $query = []): array
    {
        return $this->get('/access-events', $query);
    }

    /**
     * Lista eventos de lectura de placas vehiculares / ANPR (bitácora de auditoría, solo lectura).
     */
    public function listPlateEvents(array $query = []): array
    {
        return $this->get('/plate-events', $query);
    }

    /**
     * Obtiene la foto capturada de un evento de acceso peatonal.
     */
    public function getAccessEventPhoto(int $eventId): array
    {
        return $this->getBinary("/access-events/{$eventId}/photo");
    }

    /**
     * Obtiene una de las fotos capturadas de un evento de placa vehicular.
     */
    public function getPlateEventPhoto(int $eventId, int $index): array
    {
        return $this->getBinary("/plate-events/{$eventId}/photos/{$index}");
    }
}
