<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Services\BioTimeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BioTimeServiceTest extends TestCase
{
    use RefreshDatabase;

    private function empresa(array $overrides = []): Empresa
    {
        return Empresa::create(array_merge([
            'razon_social' => 'ACME',
            'documento' => 'ACME-1',
            'biotime_base_url' => 'http://biotime.test:8081',
            'biotime_username' => 'Sistemas',
            'biotime_password' => 'secret',
            'biotime_active' => true,
        ], $overrides));
    }

    public function test_is_configured_requires_url_user_and_password(): void
    {
        $this->assertTrue((new BioTimeService($this->empresa()))->isConfigured());
        $this->assertFalse((new BioTimeService($this->empresa(['documento' => 'X', 'biotime_password' => null])))->isConfigured());
    }

    public function test_authenticate_returns_token(): void
    {
        Http::fake(['*/jwt-api-token-auth/' => Http::response(['token' => 'jwt-xyz'], 200)]);

        $token = (new BioTimeService($this->empresa()))->authenticate();

        $this->assertSame('jwt-xyz', $token);
        Http::assertSent(fn ($r) => str_contains($r->url(), '/jwt-api-token-auth/')
            && $r['username'] === 'Sistemas' && $r['password'] === 'secret');
    }

    public function test_authenticate_rejects_bad_credentials(): void
    {
        Http::fake(['*/jwt-api-token-auth/' => Http::response(['non_field_errors' => ['bad']], 400)]);

        $result = (new BioTimeService($this->empresa()))->testConnection();

        $this->assertFalse($result['success']);
    }

    public function test_get_paginated_follows_pages_and_dedupes(): void
    {
        Http::fake([
            '*/jwt-api-token-auth/' => Http::response(['token' => 't'], 200),
            '*/personnel/api/employees/*' => function ($request) {
                parse_str(parse_url($request->url(), PHP_URL_QUERY) ?? '', $q);
                $page = (int) ($q['page'] ?? 1);

                $pages = [
                    1 => ['next' => 'http://x/?page=2', 'data' => [['id' => 1], ['id' => 2]]],
                    2 => ['next' => 'http://x/?page=3', 'data' => [['id' => 3], ['id' => 4]]],
                    3 => ['next' => null, 'data' => [['id' => 5]]],
                ];
                $p = $pages[$page] ?? ['next' => null, 'data' => []];

                return Http::response(['count' => 5, 'next' => $p['next'], 'previous' => null, 'data' => $p['data']], 200);
            },
        ]);

        $res = (new BioTimeService($this->empresa()))->listEmployees();

        $this->assertTrue($res['success']);
        $this->assertCount(5, $res['data']);
        $this->assertSame([1, 2, 3, 4, 5], array_column($res['data'], 'id'));
    }

    public function test_get_paginated_stops_when_endpoint_ignores_page(): void
    {
        // BioTime 8.0 devuelve TODO el conjunto ignorando `page` en transactions:
        // getPaginated debe cortar y no duplicar.
        Http::fake([
            '*/jwt-api-token-auth/' => Http::response(['token' => 't'], 200),
            '*/iclock/api/transactions/*' => Http::response([
                'count' => 3, 'next' => null, 'previous' => null,
                'data' => [['id' => 9], ['id' => 10], ['id' => 11]],
            ], 200),
        ]);

        $res = (new BioTimeService($this->empresa()))->listTransactions(['start_time' => 'a', 'end_time' => 'b']);

        $this->assertCount(3, $res['data']);
    }

    public function test_get_retries_once_after_401(): void
    {
        $calls = 0;
        Http::fake([
            '*/jwt-api-token-auth/' => Http::response(['token' => 'fresh'], 200),
            '*/iclock/api/terminals/*' => function () use (&$calls) {
                $calls++;

                return $calls === 1
                    ? Http::response('expired', 401)
                    : Http::response(['count' => 0, 'next' => null, 'data' => []], 200);
            },
        ]);

        $res = (new BioTimeService($this->empresa()))->listTerminals();

        $this->assertTrue($res['success']);
        $this->assertGreaterThanOrEqual(2, $calls);
    }

    public function test_connection_error_is_handled_gracefully(): void
    {
        Http::fake([
            '*/jwt-api-token-auth/' => Http::response(['token' => 't'], 200),
            '*/personnel/api/employees/*' => fn () => throw new \Illuminate\Http\Client\ConnectionException('timeout'),
        ]);

        $result = (new BioTimeService($this->empresa()))->testConnection();

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('BioTime', $result['message']);
    }
}
