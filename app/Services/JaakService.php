<?php

namespace App\Services;

use App\Models\Empresa;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class JaakService
{
    private ?string $apiKey;

    private string $baseUrl;

    private int $companyId;

    public function __construct(Empresa $empresa)
    {
        $this->apiKey = $empresa->jaak_api_key;
        $this->baseUrl = $empresa->jaak_environment === 'production'
            ? rtrim(config('jaak.production_url'), '/')
            : rtrim(config('jaak.sandbox_url'), '/');
        $this->companyId = $empresa->id;
    }

    /**
     * Indica si hay una App Key guardada para intentar una conexión.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->apiKey);
    }

    /**
     * Cabeceras de autenticación esperadas por la API de JAAK.
     */
    private function getHeaders(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->apiKey,
            'Accept' => 'application/json',
        ];
    }

    /**
     * Prueba la conexión contra JAAK.
     *
     * JAAK no documenta un endpoint de "health check" dedicado. Como sondeo de
     * solo lectura sin efectos secundarios (no crea ninguna sesión KYC),
     * consultamos un id de sesión que casi con certeza no existe: según el
     * catálogo de errores documentado por JAAK, 401 = credenciales inválidas,
     * 404 = sesión no encontrada (es decir, la credencial SÍ fue aceptada). El
     * id se genera con forma de ObjectId de Mongo (24 hex), no UUID, para
     * coincidir con el formato de "session_id" del propio token JAAK.
     */
    public function testConnection(): array
    {
        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'message' => __('Please configure and save the App Key before testing the connection.'),
            ];
        }

        try {
            $probeId = bin2hex(random_bytes(12));

            $response = Http::timeout((int) config('jaak.timeout', 15))
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/api/v1/kyc/session/{$probeId}");

            if ($response->status() === 401) {
                return ['success' => false, 'message' => __('Connection rejected. Check the App Key.')];
            }

            if ($response->successful() || $response->status() === 404) {
                return ['success' => true, 'message' => __('Connection successful. JAAK responded correctly.')];
            }

            Log::warning('JAAK HTTP Error', [
                'company_id' => $this->companyId,
                'status' => $response->status(),
            ]);

            return [
                'success' => false,
                'message' => __('JAAK responded with an unexpected error.').' (HTTP '.$response->status().')',
            ];
        } catch (ConnectionException $e) {
            Log::error('JAAK Service Unavailable: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'url' => $this->baseUrl,
            ]);

            return [
                'success' => false,
                'message' => __('Unable to reach JAAK. Check your network connection or try again later.'),
            ];
        } catch (\Exception $e) {
            Log::error('JAAK Error: '.$e->getMessage(), ['company_id' => $this->companyId]);

            return ['success' => false, 'message' => __('An unexpected error occurred while contacting JAAK.')];
        }
    }
}
