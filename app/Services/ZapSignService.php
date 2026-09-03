<?php

namespace App\Services;

use App\Models\Empresa;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente de la API de firma electrónica de ZapSign.
 *
 * Configuración por empresa: API Token + ambiente (sandbox/production). ZapSign
 * mantiene los dos ambientes completamente separados: cada uno emite su propio
 * token y usar el cruzado devuelve 403 "API token not found".
 *
 * Igual que JaakService, ningún método lanza excepciones: todos devuelven un
 * array uniforme para que el llamador degrade con elegancia y una caída de
 * ZapSign nunca tumbe una pantalla del panel.
 *
 *   ['ok' => bool, 'status' => int, 'data' => array, 'error' => ?string]
 */
class ZapSignService
{
    private ?string $apiToken;

    private string $baseUrl;

    private string $environment;

    private int $companyId;

    public function __construct(Empresa $empresa)
    {
        $this->apiToken = self::tokenDe($empresa);
        $this->environment = $empresa->zapsign_environment === 'sandbox' ? 'sandbox' : 'production';
        $this->baseUrl = $this->environment === 'sandbox'
            ? rtrim((string) config('zapsign.sandbox_url'), '/')
            : rtrim((string) config('zapsign.production_url'), '/');
        $this->companyId = $empresa->id;
    }

    /**
     * Lee el token descifrado sin poder tumbar la petición.
     *
     * El cast 'encrypted' lanza DecryptException si la columna trae texto plano
     * (p. ej. una fila escrita a mano en la BD) o si cambió APP_KEY. Como este
     * atributo se pinta en una pantalla del panel, cualquier excepción aquí
     * sería un 500; preferimos tratarlo como "sin token configurado".
     */
    public static function tokenDe(Empresa $empresa): ?string
    {
        try {
            $token = $empresa->zapsign_api_token;
        } catch (DecryptException $e) {
            Log::warning('ZapSign: token ilegible para la empresa '.$empresa->id.' ('.$e->getMessage().')');

            return null;
        }

        $token = is_string($token) ? trim($token) : null;

        return $token !== '' ? $token : null;
    }

    /**
     * Indica si hay un API Token guardado para intentar una conexión.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->apiToken);
    }

    /**
     * Kill-switch global de config/zapsign.php.
     */
    public function isGloballyEnabled(): bool
    {
        return (bool) config('zapsign.enabled', true);
    }

    /**
     * Ambiente activo de la empresa ('sandbox' | 'production').
     */
    public function environment(): string
    {
        return $this->environment;
    }

    /**
     * URL base del ambiente activo.
     */
    public function baseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * Raíz versionada de la API REST de ZapSign.
     */
    private function baseApiUrl(): string
    {
        return $this->baseUrl.'/api/v1';
    }

    /**
     * Cabeceras de autenticación: token estático con prefijo Bearer.
     */
    private function getHeaders(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->apiToken,
            'Accept' => 'application/json',
        ];
    }

    /**
     * Prueba la conexión contra ZapSign.
     *
     * Sonda de SOLO LECTURA: lista la primera página de documentos
     * (`GET /api/v1/docs/?page=1`), que ZapSign además cachea 60 s. No crea,
     * modifica ni borra nada en la cuenta. De la respuesta sólo se usa `count`,
     * para confirmar con un dato real que el token pertenece a esta cuenta.
     *
     * Catálogo de estados documentado por ZapSign:
     *   401 token inválido · 403 token de otro ambiente · 402 sin plan API
     *   activo · 429 límite de 500 req/min · 200 todo bien.
     */
    public function testConnection(): array
    {
        if (! $this->isGloballyEnabled()) {
            return [
                'success' => false,
                'message' => __('The ZapSign integration is globally disabled by configuration.'),
            ];
        }

        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'message' => __('Please configure and save the API Token before testing the connection.'),
            ];
        }

        $res = $this->listarDocumentos(1);

        if ($res['ok']) {
            $count = $res['data']['count'] ?? null;

            $message = __('Connection successful. ZapSign responded correctly.');

            if (is_numeric($count)) {
                $message .= ' '.__('Documents in the account: :count', ['count' => (int) $count]);
            }

            return ['success' => true, 'message' => $message];
        }

        return ['success' => false, 'message' => $this->mensajeDeError($res)];
    }

    /**
     * Traduce el resultado crudo de una llamada fallida a un mensaje accionable.
     */
    private function mensajeDeError(array $res): string
    {
        return match ($res['status']) {
            401 => __('Connection rejected. The ZapSign API Token is invalid.'),
            403 => __('Connection rejected. The API Token does not belong to the selected environment (:environment).', ['environment' => $this->environment]),
            402 => __('ZapSign rejected the request: the account has no active API plan.'),
            429 => __('ZapSign rate limit reached (:limit requests per minute). Wait a moment and try again.', ['limit' => (int) config('zapsign.rate_limit_per_minute', 500)]),
            0 => __('Unable to reach ZapSign. Check your network connection or try again later.'),
            default => __('ZapSign responded with an unexpected error.').' (HTTP '.$res['status'].')',
        };
    }

    // ---------------------------------------------------------------------
    // Endpoints
    // ---------------------------------------------------------------------

    /**
     * Lista documentos de la cuenta (solo lectura, paginado).
     *
     * @param  array<string, string|int|bool>  $filtros  status, folder_path, signer_email,
     *                                                   created_from, created_to, sort_order,
     *                                                   include_signers, deleted
     */
    public function listarDocumentos(int $page = 1, array $filtros = []): array
    {
        $query = array_merge(['page' => max(1, $page)], $filtros);

        return $this->request('get', '/docs/', $query);
    }

    /**
     * Detalle de un documento por su doc token (solo lectura).
     */
    public function detalleDocumento(string $docToken): array
    {
        if (trim($docToken) === '') {
            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => 'doc token vacío'];
        }

        return $this->request('get', '/docs/'.rawurlencode($docToken).'/');
    }

    // ---------------------------------------------------------------------

    /**
     * Ejecuta una llamada HTTP a ZapSign y normaliza el resultado. Nunca lanza.
     *
     * @param  array<string, mixed>  $payload  query string en GET, cuerpo JSON en POST
     */
    private function request(string $method, string $path, array $payload = []): array
    {
        if (! $this->isGloballyEnabled()) {
            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => 'zapsign deshabilitado por configuración'];
        }

        if (! $this->isConfigured()) {
            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => 'sin API token configurado'];
        }

        $url = $this->baseApiUrl().$path;

        try {
            $pending = Http::connectTimeout((int) config('zapsign.connect_timeout', 5))
                ->timeout((int) config('zapsign.timeout', 15))
                ->withHeaders($this->getHeaders())
                ->acceptJson();

            $response = $method === 'get'
                ? $pending->get($url, $payload)
                : $pending->asJson()->post($url, $payload);

            $data = [];
            try {
                $data = $response->json() ?? [];
            } catch (\Throwable $e) {
                $data = ['_raw' => mb_substr((string) $response->body(), 0, 500)];
            }

            if (! $response->successful()) {
                Log::warning('ZapSign HTTP '.$response->status().' en '.$path, [
                    'company_id' => $this->companyId,
                    'environment' => $this->environment,
                    // El cuerpo del error de ZapSign no incluye el token; aun así
                    // se recorta para no llenar el log en un 500 con HTML.
                    'error' => is_array($data) ? mb_substr(json_encode($data) ?: '', 0, 300) : null,
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
            Log::error('ZapSign inalcanzable en '.$path.': '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'environment' => $this->environment,
            ]);

            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => 'connection: '.$e->getMessage()];
        } catch (\Throwable $e) {
            Log::error('ZapSign error en '.$path.': '.$e->getMessage(), ['company_id' => $this->companyId]);

            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => $e->getMessage()];
        }
    }
}
