<?php

namespace App\Services;

use App\Models\Empresa;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente de la API de verificación de identidad y biometría de DIDIT (didit.me).
 *
 * Configuración por empresa: API Key (enviada en header x-api-key) + Workflow ID.
 * Al igual que JaakService y ZapSignService, ningún método lanza excepciones no
 * controladas: todos devuelven un array uniforme:
 *   ['ok' => bool, 'status' => int, 'data' => array, 'error' => ?string]
 */
class DiditService
{
    private ?string $apiKey;

    private ?string $workflowId;

    private string $baseUrl;

    private int $companyId;

    public function __construct(Empresa $empresa)
    {
        $this->apiKey = self::tokenDe($empresa);
        $this->workflowId = $empresa->didit_workflow_id ?: config('didit.default_workflow_id');
        $this->baseUrl = rtrim((string) config('didit.base_url', 'https://verification.didit.me'), '/');
        $this->companyId = $empresa->id;
    }

    /**
     * Lee la API Key descifrada de forma segura sin romper la petición si hay DecryptException.
     */
    public static function tokenDe(Empresa $empresa): ?string
    {
        try {
            $token = $empresa->didit_api_key;
        } catch (DecryptException $e) {
            Log::warning('DIDIT: API Key ilegible para la empresa '.$empresa->id.' ('.$e->getMessage().')');

            return null;
        }

        $token = is_string($token) ? trim($token) : null;

        return $token !== '' ? $token : null;
    }

    /**
     * Indica si hay una API Key guardada para intentar una conexión.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->apiKey);
    }

    /**
     * Kill-switch global de config/didit.php.
     */
    public function isGloballyEnabled(): bool
    {
        return (bool) config('didit.enabled', true);
    }

    /**
     * URL base del servicio de verificación.
     */
    public function baseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * Cabeceras de autenticación requeridas por DIDIT (x-api-key).
     */
    private function getHeaders(): array
    {
        return [
            'x-api-key' => $this->apiKey,
            'Accept' => 'application/json',
        ];
    }

    /**
     * Prueba la conexión contra DIDIT consultando los flujos activos.
     *
     * Sonda de SOLO LECTURA: llama a `GET /v3/workflows/`.
     * No crea sesiones ni tiene efectos secundarios en la cuenta.
     */
    public function testConnection(): array
    {
        if (! $this->isGloballyEnabled()) {
            return [
                'success' => false,
                'message' => __('The DIDIT integration is globally disabled by configuration.'),
            ];
        }

        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'message' => __('Please configure and save the API Key before testing the connection.'),
            ];
        }

        $res = $this->getWorkflows();

        if ($res['ok']) {
            $count = $res['data']['count'] ?? (is_array($res['data']) ? count($res['data']) : null);
            $message = __('Connection successful. DIDIT responded correctly.');

            if (is_numeric($count)) {
                $message .= ' '.__('Workflows available: :count', ['count' => (int) $count]);
            }

            return ['success' => true, 'message' => $message];
        }

        return ['success' => false, 'message' => $this->mensajeDeError($res)];
    }

    /**
     * Traduce el código HTTP o error a un mensaje legible.
     */
    private function mensajeDeError(array $res): string
    {
        return match ($res['status']) {
            401 => __('Connection rejected. The DIDIT API Key is invalid or expired.'),
            403 => __('Connection rejected. Access forbidden for this API Key.'),
            404 => __('DIDIT endpoint not found. Verify the base URL configuration.'),
            429 => __('DIDIT rate limit exceeded. Please wait a moment and try again.'),
            0 => __('Unable to reach DIDIT. Check your network connection or try again later.'),
            default => __('DIDIT responded with an unexpected error.').' (HTTP '.$res['status'].')',
        };
    }

    // ---------------------------------------------------------------------
    // Endpoints DIDIT
    // ---------------------------------------------------------------------

    /**
     * Lista los flujos de verificación (workflows) configurados en la cuenta.
     */
    public function getWorkflows(): array
    {
        return $this->request('get', '/v3/workflows/');
    }

    /**
     * Crea una sesión de verificación en DIDIT (página hospedada).
     *
     * Devuelve session_id y url: la persona captura su documento (INE, pasaporte
     * o identificación de cualquier país que admita el workflow) y su prueba de
     * vida en esa página; el resultado llega por webhook.
     *
     * @param  string  $vendorData  Identificador interno estable (p. ej. "kyc:123")
     * @param  array{callback?: string, language?: string, metadata?: array, expected_details?: array, workflow_id?: string}  $opciones
     */
    public function createSession(string $vendorData, array $opciones = []): array
    {
        $targetWorkflow = ($opciones['workflow_id'] ?? null) ?: $this->workflowId;

        if (empty($targetWorkflow)) {
            return [
                'ok' => false,
                'status' => 0,
                'data' => [],
                'error' => 'No workflow_id configured for DIDIT session.',
            ];
        }

        $payload = array_filter([
            'workflow_id' => $targetWorkflow,
            'vendor_data' => $vendorData,
            'callback' => $opciones['callback'] ?? null,
            'language' => $opciones['language'] ?? null,
            'metadata' => $opciones['metadata'] ?? null,
            'expected_details' => array_filter($opciones['expected_details'] ?? []) ?: null,
        ], fn ($v) => $v !== null && $v !== '');

        return $this->request('post', '/v3/session/', $payload);
    }

    /**
     * Obtiene el veredicto o decisión final de una sesión de verificación.
     */
    public function getSessionDecision(string $sessionId): array
    {
        if (trim($sessionId) === '') {
            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => 'Session ID is empty.'];
        }

        return $this->request('get', '/v3/session/'.rawurlencode($sessionId).'/decision/');
    }

    /**
     * Lista las sesiones creadas (solo lectura, paginado).
     */
    public function listSessions(int $page = 1): array
    {
        return $this->request('get', '/v3/sessions/', ['page' => max(1, $page)]);
    }

    /**
     * Verifica la firma X-Signature-V2 de un webhook de DIDIT: HMAC-SHA256 en
     * hex del JSON canónico (llaves ordenadas de forma recursiva, separadores
     * compactos, Unicode sin escapar y flotantes enteros como enteros), con
     * X-Timestamp a no más de 5 minutos.
     */
    public static function firmaWebhookValida(string $cuerpoCrudo, ?string $firma, ?string $timestamp, string $secreto): bool
    {
        if (empty($firma) || empty($timestamp) || $secreto === '' || ! ctype_digit((string) $timestamp)) {
            return false;
        }

        if (abs(time() - (int) $timestamp) > 300) {
            return false;
        }

        // Se decodifica a objetos (no arreglos) para que un {} vacío siga siendo {}.
        $datos = json_decode($cuerpoCrudo, false);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return false;
        }

        $canonico = json_encode(self::canonicalizar($datos), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return $canonico !== false
            && hash_equals(hash_hmac('sha256', $canonico, $secreto), strtolower(trim($firma)));
    }

    private static function canonicalizar(mixed $valor): mixed
    {
        if (is_float($valor) && floor($valor) === $valor && abs($valor) < PHP_INT_MAX) {
            return (int) $valor;
        }

        if (is_array($valor)) {
            return array_map([self::class, 'canonicalizar'], $valor);
        }

        if ($valor instanceof \stdClass) {
            $propiedades = get_object_vars($valor);
            ksort($propiedades, SORT_STRING);

            return (object) array_map([self::class, 'canonicalizar'], $propiedades);
        }

        return $valor;
    }

    // ---------------------------------------------------------------------

    /**
     * Ejecuta una llamada HTTP a DIDIT y normaliza el resultado. Nunca lanza excepciones no controladas.
     *
     * @param  array<string, mixed>  $payload  Query string en GET, JSON en POST/PATCH
     */
    private function request(string $method, string $path, array $payload = []): array
    {
        if (! $this->isGloballyEnabled()) {
            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => 'DIDIT deshabilitado por configuración'];
        }

        if (! $this->isConfigured()) {
            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => 'DIDIT API Key no configurada'];
        }

        $url = $this->baseUrl.'/'.ltrim($path, '/');
        $timeout = (int) config('didit.timeout', 15);
        $connectTimeout = (int) config('didit.connect_timeout', 5);

        try {
            $http = Http::timeout($timeout)
                ->connectTimeout($connectTimeout)
                ->withHeaders($this->getHeaders());

            $response = match (strtolower($method)) {
                'get' => $http->get($url, $payload),
                'post' => $http->post($url, $payload),
                'patch' => $http->patch($url, $payload),
                'delete' => $http->delete($url, $payload),
                default => throw new \InvalidArgumentException("Método HTTP {$method} no soportado"),
            };

            $data = $response->json();
            $data = is_array($data) ? $data : [];

            if ($response->successful()) {
                return ['ok' => true, 'status' => $response->status(), 'data' => $data, 'error' => null];
            }

            Log::warning('DIDIT API error', [
                'company_id' => $this->companyId,
                'path' => $path,
                'status' => $response->status(),
            ]);

            return [
                'ok' => false,
                'status' => $response->status(),
                'data' => $data,
                'error' => $data['message'] ?? $data['detail'] ?? ('HTTP '.$response->status()),
            ];
        } catch (ConnectionException $e) {
            Log::error('DIDIT ConnectionException: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'path' => $path,
            ]);

            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => 'Connection timeout or network failure'];
        } catch (\Throwable $e) {
            Log::error('DIDIT Exception: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'path' => $path,
            ]);

            return ['ok' => false, 'status' => 0, 'data' => [], 'error' => $e->getMessage()];
        }
    }
}
