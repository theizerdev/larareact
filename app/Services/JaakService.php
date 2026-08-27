<?php

namespace App\Services;

use App\Models\Empresa;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente de la API KYC de JAAK (verificar-identidad vía API).
 *
 * Configuración por empresa: App Key (JWT) + ambiente (sandbox/production).
 * La orquestación del flujo completo (crear sesión -> verificar -> OCR -> listas
 * -> biometría -> finalizar) vive en App\Jobs\ProcesarKycValidacion; aquí sólo
 * está cada llamada individual.
 *
 * Todos los métodos KYC devuelven un array uniforme y NUNCA lanzan:
 *   ['ok' => bool, 'status' => int, 'data' => array, 'error' => ?string]
 * para que el Job pueda degradar con elegancia si un paso falla.
 */
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
     * Raíz de la API REST de JAAK para el ambiente activo.
     */
    private function baseApiUrl(): string
    {
        return $this->baseUrl.'/api';
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

            $response = Http::timeout((int) config('jaak.timeout', 20))
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseApiUrl()}/v1/kyc/session/{$probeId}");

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

    // ---------------------------------------------------------------------
    // Flujo KYC vía API
    // ---------------------------------------------------------------------

    /**
     * Paso 1 — Crea la sesión KYC. Auth: App Key de la empresa.
     * Devuelve data => ['short_key' => string, 'session_url' => string].
     */
    public function crearSesionKyc(string $nombre, ?string $countryDocument = null, ?string $flow = null): array
    {
        $country = $countryDocument ?: config('jaak.default_country', 'MEX');

        $res = $this->request('post', '/v1/kyc/flow', [
            'name' => $nombre !== '' ? $nombre : 'Pre-registro',
            'flow' => $flow ?: 'preregistro-'.$this->companyId,
            'countryDocument' => $country,
            'flowType' => 'KYC',
        ], $this->getHeaders());

        if ($res['ok']) {
            $sessionUrl = (string) ($res['data']['sessionUrl'] ?? '');
            $shortKey = $sessionUrl !== '' ? substr(rtrim($sessionUrl, '/'), -7) : null;

            if (! $shortKey) {
                return ['ok' => false, 'status' => $res['status'], 'data' => $res['data'], 'error' => 'sessionUrl ausente en la respuesta de JAAK'];
            }

            $res['data'] = ['short_key' => $shortKey, 'session_url' => $sessionUrl];
        }

        return $res;
    }

    /**
     * Paso 2 — Intercambia el ShortKey por un Access Token de sesión.
     * Devuelve data => ['access_token' => string, 'session_id' => ?string].
     */
    public function obtenerAccessToken(string $shortKey): array
    {
        $res = $this->request('post', '/v1/kyc/session', (object) [], array_merge($this->getHeaders(), [
            'Short-Key' => $shortKey,
            'Origin-Device' => 'API',
        ]));

        if ($res['ok']) {
            $token = (string) ($res['data']['accessToken'] ?? '');

            if ($token === '') {
                return ['ok' => false, 'status' => $res['status'], 'data' => $res['data'], 'error' => 'accessToken ausente en la respuesta de JAAK'];
            }

            $res['data'] = [
                'access_token' => $token,
                'session_id' => $res['data']['sessionId'] ?? null,
            ];
        }

        return $res;
    }

    /**
     * Paso 4 — Verificación del documento (INE). Imágenes en Base64 "pelón".
     */
    public function verificarDocumento(string $accessToken, string $imageFront, ?string $imageBack = null): array
    {
        $body = ['imageFront' => $imageFront, 'dataVerification' => true];

        if (! empty($imageBack)) {
            $body['imageBack'] = $imageBack;
        }

        return $this->request('post', '/v3/document/verify', $body, $this->bearer($accessToken));
    }

    /**
     * Paso 5 — OCR / extracción de datos del documento.
     */
    public function extraerOcr(string $accessToken, string $imageFront, ?string $imageBack = null, ?string $country = null): array
    {
        $body = [
            'imageFront' => $imageFront,
            'documentSessionSelected' => ['country' => $country ?: config('jaak.default_country', 'MEX')],
        ];

        if (! empty($imageBack)) {
            $body['imageBack'] = $imageBack;
        }

        return $this->request('post', '/v4/document/extract', $body, $this->bearer($accessToken));
    }

    /**
     * Paso 6 — Consulta de listas oficiales y negras (RENAPO, INE, OFAC, ...).
     *
     * @param  array  $services  Toggles booleanos: ['renapo' => ['curp' => true], 'ine' => bool, ...]
     * @param  array  $payload   ['identifications' => [...], 'person' => [...], 'address' => [...]]
     */
    public function investigarListas(string $accessToken, array $services, array $payload): array
    {
        return $this->request('post', '/v2/blacklist/investigate', [
            'services' => $services,
            'payload' => $payload,
        ], $this->bearer($accessToken));
    }

    /**
     * Paso 8 — Comparación facial 1:1 (rostro de la INE vs. selfie).
     */
    public function compararRostros(string $accessToken, string $image1, string $image2): array
    {
        return $this->request('post', '/v2/oto/verify', [
            'image1' => $image1,
            'image2' => $image2,
        ], $this->bearer($accessToken));
    }

    /**
     * Paso 9 — Finaliza la sesión KYC. Best-effort: no lanza ni devuelve error útil.
     */
    public function finalizarSesion(string $accessToken): void
    {
        try {
            $this->request('post', '/v1/kyc/session/finish', (object) [], $this->bearer($accessToken));
        } catch (\Throwable $e) {
            Log::warning('JAAK finish session falló: '.$e->getMessage(), ['company_id' => $this->companyId]);
        }
    }

    // ---------------------------------------------------------------------

    private function bearer(string $accessToken): array
    {
        return [
            'Authorization' => 'Bearer '.$accessToken,
            'Accept' => 'application/json',
        ];
    }

    /**
     * Ejecuta una llamada HTTP a JAAK y normaliza el resultado. Nunca lanza.
     *
     * @param  array|object  $body
     */
    private function request(string $method, string $path, $body, array $headers): array
    {
        $url = $this->baseApiUrl().$path;

        // Normaliza el cuerpo: objeto/array vacío -> "{}" literal (varios endpoints
        // de JAAK lo exigen); resto -> JSON.
        $arrayBody = is_object($body) ? (array) $body : (is_array($body) ? $body : []);

        try {
            $pending = Http::timeout((int) config('jaak.timeout', 15))
                ->withHeaders($headers)
                ->acceptJson();

            if ($method === 'get') {
                $response = $pending->get($url);
            } elseif (empty($arrayBody)) {
                $response = $pending->withBody('{}', 'application/json')->post($url);
            } else {
                $response = $pending->asJson()->post($url, $arrayBody);
            }

            $data = [];
            try {
                $data = $response->json() ?? [];
            } catch (\Throwable $e) {
                $data = ['_raw' => mb_substr((string) $response->body(), 0, 500)];
            }

            if (! $response->successful()) {
                Log::warning('JAAK KYC HTTP '.$response->status().' en '.$path, [
                    'company_id' => $this->companyId,
                    'error' => is_array($data) ? ($data['message'] ?? $data['error'] ?? null) : null,
                ]);

                return [
                    'ok' => false,
                    'status' => $response->status(),
                    'data' => is_array($data) ? $data : [],
                    'error' => 'HTTP '.$response->status(),
                ];
            }

            return ['ok' => true, 'status' => $response->status(), 'data' => is_array($data) ? $data : [], 'error' => null];
        } catch (ConnectionException $e) {
            Log::error('JAAK KYC inalcanzable en '.$path.': '.$e->getMessage(), ['company_id' => $this->companyId]);

            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => 'connection: '.$e->getMessage()];
        } catch (\Throwable $e) {
            Log::error('JAAK KYC error en '.$path.': '.$e->getMessage(), ['company_id' => $this->companyId]);

            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => $e->getMessage()];
        }
    }
}
