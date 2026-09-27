<?php

namespace App\Services;

use App\Models\Empresa;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP de SOLO LECTURA contra la API REST de BioTime PRO
 * (ZKTeco BioTime 8.0).
 *
 * - Autenticación: POST /jwt-api-token-auth/ {username,password} -> {token}
 *   y luego header `Authorization: JWT <token>` en cada petición.
 * - Todos los listados devuelven el sobre {count,next,previous,msg,code,data:[...]}
 *   y aceptan ?page=&limit=.
 * - Este servicio NO implementa ningún método de escritura (create/update/
 *   delete/command). Solo GET + el POST de login.
 *
 * Modelado sobre App\Services\ControlAccesoService.
 */
class BioTimeService
{
    private ?string $baseUrl;

    private ?string $username;

    private ?string $password;

    private int $companyId;

    private ?string $token = null;

    public function __construct(Empresa $empresa)
    {
        $this->baseUrl = $empresa->biotime_base_url ? rtrim($empresa->biotime_base_url, '/') : null;
        $this->username = $empresa->biotime_username;
        // Cast 'encrypted' en el modelo: aquí ya llega en claro.
        $this->password = $empresa->biotime_password;
        $this->companyId = $empresa->id;
    }

    /**
     * ¿Hay suficientes datos guardados para intentar una conexión?
     */
    public function isConfigured(): bool
    {
        return ! empty($this->baseUrl) && ! empty($this->username) && ! empty($this->password);
    }

    /* ------------------------------------------------------------------ */
    /*  Autenticación                                                      */
    /* ------------------------------------------------------------------ */

    /**
     * Obtiene (y cachea en memoria) un JWT contra BioTime.
     *
     * @throws \RuntimeException si las credenciales son rechazadas o el
     *                           endpoint no responde.
     */
    public function authenticate(bool $force = false): string
    {
        if ($this->token && ! $force) {
            return $this->token;
        }

        try {
            $response = $this->baseClient()
                ->asJson()
                ->post("{$this->baseUrl}/jwt-api-token-auth/", [
                    'username' => $this->username,
                    'password' => $this->password,
                ]);
        } catch (ConnectionException $e) {
            Log::channel('biotime')->error('BioTime login inalcanzable: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'url' => $this->baseUrl,
            ]);
            throw new \RuntimeException('No se pudo contactar a BioTime para autenticar.', 0, $e);
        }

        if ($response->status() === 400 || $response->status() === 401) {
            throw new \RuntimeException('BioTime rechazó las credenciales (usuario o contraseña incorrectos).');
        }

        $token = $response->json('token');

        if (! $response->successful() || ! is_string($token) || $token === '') {
            Log::channel('biotime')->warning('BioTime login respuesta inesperada', [
                'company_id' => $this->companyId,
                'status' => $response->status(),
            ]);
            throw new \RuntimeException('BioTime respondió de forma inesperada al autenticar (HTTP '.$response->status().').');
        }

        return $this->token = $token;
    }

    /* ------------------------------------------------------------------ */
    /*  GET genérico + paginación                                          */
    /* ------------------------------------------------------------------ */

    /**
     * GET JSON contra la API con manejo uniforme de errores y un único
     * reintento si el token expiró (401).
     *
     * @return array{success: bool, data: mixed, error: string|null, status: int|null}
     */
    public function get(string $path, array $query = [], bool $retriedAfterAuth = false): array
    {
        try {
            $token = $this->authenticate();

            $response = $this->baseClient()
                ->withHeaders([
                    'Authorization' => 'JWT '.$token,
                    'Accept' => 'application/json',
                ])
                ->get($this->url($path), $query);

            if ($response->status() === 401 && ! $retriedAfterAuth) {
                // Token expirado a mitad de un recorrido: renueva una vez.
                $this->authenticate(force: true);

                return $this->get($path, $query, retriedAfterAuth: true);
            }

            if ($response->successful()) {
                return ['success' => true, 'data' => $response->json(), 'error' => null, 'status' => $response->status()];
            }

            if (in_array($response->status(), [401, 403], true)) {
                return ['success' => false, 'data' => null, 'error' => 'BioTime rechazó la petición. Revisa el usuario y la contraseña.', 'status' => $response->status()];
            }

            Log::channel('biotime')->warning('BioTime HTTP error', [
                'company_id' => $this->companyId,
                'path' => $path,
                'status' => $response->status(),
            ]);

            return ['success' => false, 'data' => null, 'error' => 'BioTime respondió con un error inesperado (HTTP '.$response->status().').', 'status' => $response->status()];
        } catch (ConnectionException $e) {
            Log::channel('biotime')->error('BioTime inalcanzable: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'url' => $this->baseUrl,
                'path' => $path,
            ]);

            return ['success' => false, 'data' => null, 'error' => 'No se pudo contactar a BioTime. Revisa la URL o la red.', 'status' => null];
        } catch (\RuntimeException $e) {
            return ['success' => false, 'data' => null, 'error' => $e->getMessage(), 'status' => null];
        } catch (\Throwable $e) {
            Log::channel('biotime')->error('BioTime error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'path' => $path,
            ]);

            return ['success' => false, 'data' => null, 'error' => 'Ocurrió un error inesperado al contactar a BioTime.', 'status' => null];
        }
    }

    /**
     * Recorre un endpoint paginado de BioTime acumulando `data`.
     *
     * Ojo con las particularidades de BioTime 8.0:
     *  - El tamaño de página es fijo (~10) y el parámetro `limit` se ignora.
     *  - Algunos endpoints (p.ej. /iclock/api/transactions/) ignoran también
     *    `page` y devuelven todo el conjunto filtrado de una vez. Por eso se
     *    deduplica por `id` y se corta si una página repite la anterior.
     *
     * @return array{success: bool, data: array<int,array>, error: string|null, count: int|null}
     */
    public function getPaginated(string $path, array $query = []): array
    {
        $perPage = (int) config('biotime.page_size', 100);
        $maxPages = (int) config('biotime.max_pages', 2000);

        $all = [];
        $seen = [];
        $count = null;
        $page = 1;
        $lastPageSignature = null;

        do {
            $result = $this->get($path, array_merge($query, ['page' => $page, 'limit' => $perPage]));

            if (! $result['success']) {
                return ['success' => false, 'data' => array_values($all), 'error' => $result['error'], 'count' => $count];
            }

            $body = is_array($result['data']) ? $result['data'] : [];
            $count = $body['count'] ?? $count;
            $rows = $body['data'] ?? $body['results'] ?? [];

            if (! is_array($rows) || $rows === []) {
                break;
            }

            // Si esta página es idéntica a la anterior, el endpoint está
            // ignorando `page`: ya tenemos todo, salimos.
            $signature = md5(json_encode(array_map(static fn ($r) => $r['id'] ?? null, $rows)));
            if ($signature === $lastPageSignature) {
                break;
            }
            $lastPageSignature = $signature;

            $newInThisPage = 0;
            foreach ($rows as $row) {
                $id = $row['id'] ?? null;
                $key = $id !== null ? (string) $id : 'idx_'.count($all);
                if (isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;
                $all[$key] = $row;
                $newInThisPage++;
            }

            $hasNext = ! empty($body['next']);
            $page++;

            if (! $hasNext || $newInThisPage === 0) {
                break;
            }
        } while ($page <= $maxPages);

        if ($page > $maxPages) {
            Log::channel('biotime')->warning('BioTime getPaginated alcanzó max_pages', [
                'company_id' => $this->companyId,
                'path' => $path,
                'max_pages' => $maxPages,
            ]);
        }

        return ['success' => true, 'data' => array_values($all), 'error' => null, 'count' => $count];
    }

    /* ------------------------------------------------------------------ */
    /*  Endpoints tipados (solo lectura)                                   */
    /* ------------------------------------------------------------------ */

    /**
     * Prueba de conexión: pide 1 empleado. 200 = credenciales válidas.
     *
     * @return array{success: bool, message: string}
     */
    public function testConnection(): array
    {
        if (! $this->isConfigured()) {
            return ['success' => false, 'message' => 'Configura y guarda la URL, el usuario y la contraseña antes de probar la conexión.'];
        }

        $result = $this->get('/personnel/api/employees/', ['page' => 1, 'limit' => 1]);

        if ($result['success']) {
            return ['success' => true, 'message' => 'Conexión exitosa. BioTime respondió correctamente.'];
        }

        return ['success' => false, 'message' => $result['error'] ?? 'No se pudo conectar con BioTime.'];
    }

    /** @return array{success: bool, data: array<int,array>, error: string|null, count: int|null} */
    public function listTerminals(array $query = []): array
    {
        return $this->getPaginated('/iclock/api/terminals/', $query);
    }

    /** @return array{success: bool, data: array<int,array>, error: string|null, count: int|null} */
    public function listDepartments(array $query = []): array
    {
        return $this->getPaginated('/personnel/api/departments/', $query);
    }

    /** @return array{success: bool, data: array<int,array>, error: string|null, count: int|null} */
    public function listAreas(array $query = []): array
    {
        return $this->getPaginated('/personnel/api/areas/', $query);
    }

    /** @return array{success: bool, data: array<int,array>, error: string|null, count: int|null} */
    public function listPositions(array $query = []): array
    {
        return $this->getPaginated('/personnel/api/positions/', $query);
    }

    /** @return array{success: bool, data: array<int,array>, error: string|null, count: int|null} */
    public function listEmployees(array $query = []): array
    {
        return $this->getPaginated('/personnel/api/employees/', $query);
    }

    /**
     * Marcajes. Filtros soportados por BioTime: emp_code, terminal_sn,
     * start_time, end_time (formato "Y-m-d H:i:s").
     *
     * @return array{success: bool, data: array<int,array>, error: string|null, count: int|null}
     */
    public function listTransactions(array $filters = []): array
    {
        return $this->getPaginated('/iclock/api/transactions/', $filters);
    }

    /**
     * Foto del empleado. BioTime 8.0 no la documenta en el manual público;
     * se intentan los patrones conocidos. Devuelve binario + content-type.
     *
     * @return array{success: bool, body: string|null, content_type: string|null}
     */
    public function getEmployeePhoto(string $empCode): array
    {
        // 1) Campo con URL/base64 dentro del detalle del empleado.
        $detail = $this->get('/personnel/api/employees/', ['emp_code' => $empCode, 'limit' => 1]);
        if ($detail['success']) {
            $row = $detail['data']['data'][0] ?? $detail['data']['results'][0] ?? null;
            $photoField = $row['photo'] ?? $row['photograph'] ?? $row['emp_pic'] ?? null;

            if (is_string($photoField) && str_starts_with($photoField, 'data:image')) {
                [$meta, $b64] = array_pad(explode(',', $photoField, 2), 2, '');
                $ct = str_contains($meta, 'png') ? 'image/png' : 'image/jpeg';

                return ['success' => true, 'body' => base64_decode($b64) ?: null, 'content_type' => $ct];
            }

            if (is_string($photoField) && $photoField !== '') {
                $bin = $this->getBinary(str_starts_with($photoField, 'http') ? $photoField : $this->url('/'.ltrim($photoField, '/')));
                if ($bin['success']) {
                    return $bin;
                }
            }
        }

        // 2) Rutas de media habituales en instalaciones BioTime 8.0.
        foreach (["/media/employee/{$empCode}.jpg", "/files/employee/{$empCode}.jpg"] as $mediaPath) {
            $bin = $this->getBinary($this->url($mediaPath));
            if ($bin['success']) {
                return $bin;
            }
        }

        return ['success' => false, 'body' => null, 'content_type' => null];
    }

    /* ------------------------------------------------------------------ */
    /*  Internos                                                           */
    /* ------------------------------------------------------------------ */

    /**
     * Descarga binaria autenticada (fotos).
     *
     * @return array{success: bool, body: string|null, content_type: string|null}
     */
    private function getBinary(string $absoluteUrl): array
    {
        try {
            $token = $this->authenticate();

            $response = $this->baseClient()
                ->withHeaders(['Authorization' => 'JWT '.$token])
                ->get($absoluteUrl);

            if ($response->successful() && $response->body() !== '' && str_starts_with((string) $response->header('Content-Type'), 'image/')) {
                return [
                    'success' => true,
                    'body' => $response->body(),
                    'content_type' => $response->header('Content-Type') ?: 'image/jpeg',
                ];
            }

            return ['success' => false, 'body' => null, 'content_type' => null];
        } catch (\Throwable $e) {
            Log::channel('biotime')->warning('BioTime foto error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'url' => $absoluteUrl,
            ]);

            return ['success' => false, 'body' => null, 'content_type' => null];
        }
    }

    private function baseClient(): PendingRequest
    {
        $client = Http::timeout((int) config('biotime.timeout', 20))
            ->connectTimeout(10);

        if (! config('biotime.verify_ssl', false)) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    private function url(string $path): string
    {
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return $this->baseUrl.'/'.ltrim($path, '/');
    }
}
