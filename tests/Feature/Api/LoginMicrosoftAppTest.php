<?php

namespace Tests\Feature\Api;

use App\Models\ConfiguracionSox;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Inicio de sesión con Microsoft Entra ID desde la app: el navegador vuelve a
 * la app con un código de un solo uso que se canjea con el verificador PKCE.
 */
class LoginMicrosoftAppTest extends TestCase
{
    use RefreshDatabase;

    private const VERIFIER = 'verificador-de-prueba-con-mas-de-cuarenta-y-tres-caracteres-0123';

    private function challenge(string $verifier = self::VERIFIER): string
    {
        return rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');
    }

    private function configurarSso(): void
    {
        ConfiguracionSox::current(null)->update([
            'sso_azure_enabled' => true, 'azure_tenant_id' => 'tenant-guid',
            'azure_client_id' => 'client-id', 'azure_client_secret' => 'secreto',
        ]);
    }

    private function fakeEntra(string $mail): void
    {
        Http::fake([
            'login.microsoftonline.com/*' => Http::response(['access_token' => 'x'], 200),
            'graph.microsoft.com/*' => Http::response(['mail' => $mail], 200),
        ]);
    }

    /** Recorre el navegador y devuelve los parámetros con que vuelve a la app. */
    private function iniciarEnNavegador(): array
    {
        $ida = $this->get('/auth/sso/azure/movil?challenge='.$this->challenge());
        $microsoft = $ida->headers->get('Location');
        $this->assertStringStartsWith('https://login.microsoftonline.com/tenant-guid/', $microsoft);
        parse_str(parse_url($microsoft, PHP_URL_QUERY), $query);
        $this->assertSame('login', $query['prompt']);

        $vuelta = $this->get('/auth/sso/azure/callback?code=abc&state='.$query['state']);
        $app = $vuelta->headers->get('Location');
        $this->assertStringStartsWith('com.smurfit.app://sso?', $app);
        parse_str(parse_url($app, PHP_URL_QUERY), $params);

        return $params;
    }

    public function test_entra_con_microsoft_y_el_codigo_sirve_una_sola_vez(): void
    {
        $this->configurarSso();
        $user = User::factory()->create(['email' => 'operador@corp.com']);
        $this->fakeEntra('operador@corp.com');

        $params = $this->iniciarEnNavegador();
        $this->assertArrayHasKey('code', $params);
        $this->assertGuest();

        $this->postJson('/api/login-microsoft', ['code' => $params['code'], 'verifier' => self::VERIFIER])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['token']);

        $this->postJson('/api/login-microsoft', ['code' => $params['code'], 'verifier' => self::VERIFIER])
            ->assertStatus(401);
    }

    public function test_el_codigo_no_sirve_sin_el_verificador_de_quien_inicio(): void
    {
        $this->configurarSso();
        User::factory()->create(['email' => 'operador@corp.com']);
        $this->fakeEntra('operador@corp.com');

        $params = $this->iniciarEnNavegador();

        $this->postJson('/api/login-microsoft', [
            'code' => $params['code'],
            'verifier' => str_repeat('x', 64),
        ])->assertStatus(401)->assertJsonMissingPath('token');
    }

    public function test_cuenta_no_registrada_vuelve_a_la_app_con_el_error(): void
    {
        $this->configurarSso();
        $this->fakeEntra('desconocido@corp.com');

        $params = $this->iniciarEnNavegador();

        $this->assertArrayNotHasKey('code', $params);
        $this->assertStringContainsString('no tiene acceso', $params['error']);
        $this->assertDatabaseMissing('users', ['email' => 'desconocido@corp.com']);
    }

    public function test_sin_sso_configurado_vuelve_a_la_app_sin_ir_a_microsoft(): void
    {
        $respuesta = $this->get('/auth/sso/azure/movil?challenge='.$this->challenge());

        $this->assertStringStartsWith('com.smurfit.app://sso?error=', $respuesta->headers->get('Location'));
    }

    public function test_rechaza_un_challenge_que_no_es_pkce(): void
    {
        $this->configurarSso();

        $respuesta = $this->get('/auth/sso/azure/movil?challenge=corto');

        $this->assertStringStartsWith('com.smurfit.app://sso?error=', $respuesta->headers->get('Location'));
    }

    public function test_vuelve_a_la_app_aunque_el_navegador_tenga_sesion_web(): void
    {
        $this->configurarSso();
        $user = User::factory()->create(['email' => 'operador@corp.com']);
        $this->fakeEntra('operador@corp.com');
        $this->actingAs($user);

        $this->assertArrayHasKey('code', $this->iniciarEnNavegador());
    }

    public function test_el_callback_del_web_con_sesion_abierta_sigue_yendo_al_dashboard(): void
    {
        $this->configurarSso();
        $user = User::factory()->create(['email' => 'operador@corp.com']);
        Http::fake();

        $this->actingAs($user)
            ->withSession(['azure_sso_state' => 'OK'])
            ->get('/auth/sso/azure/callback?code=abc&state=OK')
            ->assertRedirect(route('dashboard'));

        Http::assertNothingSent();
    }

    public function test_trabajador_sin_permiso_de_app_no_recibe_token(): void
    {
        $this->configurarSso();
        $empresa = Empresa::create(['razon_social' => 'Smurfit', 'documento' => 'SMF']);
        $user = User::factory()->create(['email' => 'trabajador@corp.com', 'empresa_id' => $empresa->id]);
        Empleado::create([
            'nombres' => 'Ana', 'apellidos' => 'Pérez', 'documento_identidad' => '900',
            'empresa_id' => $empresa->id, 'user_id' => $user->id,
            'status' => true, 'permite_app_movil' => false,
        ]);
        $this->fakeEntra('trabajador@corp.com');

        $params = $this->iniciarEnNavegador();

        $this->postJson('/api/login-microsoft', ['code' => $params['code'], 'verifier' => self::VERIFIER])
            ->assertForbidden()
            ->assertJsonMissingPath('token');
    }
}
