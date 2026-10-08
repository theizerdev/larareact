<?php

namespace App\Services;

use App\Models\Empresa;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente de la API de Background Checks (antecedentes) de Truora.
 *
 * Configuración por empresa: API Key (header Truora-API-Key). Como los demás
 * servicios, ningún método lanza excepciones: todos devuelven
 *   ['ok' => bool, 'status' => int, 'data' => array, 'error' => ?string]
 */
class TruoraService
{
    /** Países que Truora cubre, por código ISO de 3 letras del documento. */
    public const PAISES = [
        'MEX' => 'MX', 'COL' => 'CO', 'PER' => 'PE', 'BRA' => 'BR', 'CHL' => 'CL', 'CRI' => 'CR',
    ];

    private ?string $apiKey;

    private string $baseUrl;

    private int $companyId;

    public function __construct(Empresa $empresa)
    {
        $this->apiKey = self::tokenDe($empresa);
        $this->baseUrl = rtrim((string) config('truora.base_url', 'https://api.checks.truora.com'), '/');
        $this->companyId = $empresa->id;
    }

    /** API Key descifrada; null (sin romper la petición) si no hay o es ilegible. */
    public static function tokenDe(Empresa $empresa): ?string
    {
        try {
            $token = $empresa->truora_api_key;
        } catch (DecryptException $e) {
            Log::warning('TRUORA: API Key ilegible para la empresa '.$empresa->id);

            return null;
        }

        $token = is_string($token) ? trim($token) : null;

        return $token !== '' ? $token : null;
    }

    /** Score mínimo (0 a 1) para aprobar: el de la empresa o el global. */
    public static function scoreMinimoDe(Empresa $empresa): float
    {
        $propio = $empresa->truora_score_minimo;

        return is_numeric($propio) ? (float) $propio : (float) config('truora.score_minimo', 0.8);
    }

    public function isConfigured(): bool
    {
        return ! empty($this->apiKey);
    }

    public function isGloballyEnabled(): bool
    {
        return (bool) config('truora.enabled', true);
    }

    /** Sonda de SOLO LECTURA: lista checks (no crea nada ni cobra). */
    public function testConnection(): array
    {
        if (! $this->isGloballyEnabled()) {
            return ['success' => false, 'message' => __('The TRUORA integration is globally disabled by configuration.')];
        }

        if (! $this->isConfigured()) {
            return ['success' => false, 'message' => __('Please configure and save the API Key before testing the connection.')];
        }

        $res = $this->request('get', '/v1/checks', ['limit' => 1]);

        if ($res['ok']) {
            return ['success' => true, 'message' => __('Connection successful. TRUORA responded correctly.')];
        }

        return [
            'success' => false,
            'message' => in_array($res['status'], [401, 403], true)
                ? __('TRUORA rejected the API Key. Check that it is correct and active.')
                : __('Could not connect to TRUORA: :error', ['error' => $res['error'] ?? 'desconocido']),
        ];
    }

    /**
     * Crea un check de antecedentes de una persona. En México `national_id` es la CURP.
     *
     * @param  string  $paisIso3  país del documento (MEX por defecto)
     */
    public function crearCheck(string $nationalId, ?string $paisIso3 = null, ?string $referencia = null): array
    {
        $pais = self::PAISES[strtoupper((string) $paisIso3)] ?? null;

        if ($paisIso3 && $pais === null) {
            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => 'País del documento no cubierto por TRUORA ('.$paisIso3.')'];
        }

        return $this->request('post', '/v1/checks', array_filter([
            'national_id' => $nationalId,
            'country' => $pais ?? 'MX',
            'type' => 'person',
            // Confirmación de que la persona autorizó la consulta (exigida por la API).
            'user_authorized' => 'true',
            'force_creation' => 'true',
            'custom_input' => $referencia ? mb_substr($referencia, 0, 128) : null,
        ], fn ($v) => $v !== null), true);
    }

    /**
     * Crea un check de antecedentes de una empresa (type=company) con su RFC
     * (tax_id) y razón social: situación del negocio, antecedentes legales,
     * penales, fiscales y menciones en medios. force_creation=false: si hay un
     * check reciente con los mismos datos, TRUORA devuelve ése en vez de cobrar otro.
     */
    public function crearCheckEmpresa(string $rfc, ?string $razonSocial = null, ?string $referencia = null): array
    {
        return $this->request('post', '/v1/checks', array_filter([
            'type' => 'company',
            'country' => 'MX',
            'tax_id' => $rfc,
            'company_name' => $razonSocial ? mb_substr($razonSocial, 0, 200) : null,
            'user_authorized' => 'true',
            'force_creation' => 'false',
            'custom_input' => $referencia ? mb_substr($referencia, 0, 128) : null,
        ], fn ($v) => $v !== null && $v !== ''), true);
    }

    public function getCheck(string $checkId): array
    {
        return $this->request('get', '/v1/checks/'.rawurlencode($checkId));
    }

    public function getDetalle(string $checkId): array
    {
        return $this->request('get', '/v1/checks/'.rawurlencode($checkId).'/details');
    }

    private function request(string $method, string $path, array $payload = [], bool $form = false): array
    {
        if (! $this->isGloballyEnabled()) {
            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => 'TRUORA deshabilitado por configuración'];
        }

        if (! $this->isConfigured()) {
            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => 'TRUORA API Key no configurada'];
        }

        $url = $this->baseUrl.'/'.ltrim($path, '/');

        try {
            $http = Http::timeout((int) config('truora.timeout', 20))
                ->connectTimeout((int) config('truora.connect_timeout', 5))
                ->withHeaders(['Truora-API-Key' => $this->apiKey, 'Accept' => 'application/json']);

            if ($form) {
                $http = $http->asForm();
            }

            $response = strtolower($method) === 'get' ? $http->get($url, $payload) : $http->post($url, $payload);

            $data = $response->json();
            $data = is_array($data) ? $data : [];

            if ($response->successful()) {
                return ['ok' => true, 'status' => $response->status(), 'data' => $data, 'error' => null];
            }

            Log::warning('TRUORA API error', ['company_id' => $this->companyId, 'path' => $path, 'status' => $response->status()]);

            return [
                'ok' => false,
                'status' => $response->status(),
                'data' => $data,
                'error' => $data['message'] ?? $data['error'] ?? ('HTTP '.$response->status()),
            ];
        } catch (ConnectionException $e) {
            Log::error('TRUORA ConnectionException: '.$e->getMessage(), ['company_id' => $this->companyId, 'path' => $path]);

            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => 'Connection timeout or network failure'];
        } catch (\Throwable $e) {
            Log::error('TRUORA Exception: '.$e->getMessage(), ['company_id' => $this->companyId, 'path' => $path]);

            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => $e->getMessage()];
        }
    }
}
