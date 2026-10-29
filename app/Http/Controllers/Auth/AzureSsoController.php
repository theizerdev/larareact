<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureUserActive;
use App\Models\ConfiguracionSox;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AzureSsoController extends Controller
{
    private const MSG_NOT_LINKED = 'El inicio de sesión vía Microsoft Entra ID se encuentra en proceso de vinculación. Ingrese a la consola de Cumplimiento SOX para configurar el Tenant ID.';

    /** Inicio desde la app: state enviado a Microsoft → code_challenge de la app. */
    public const CACHE_STATE_MOVIL = 'azure_sso_movil_state:';

    /** Código de un solo uso que la app canjea por su token (Api\AuthController). */
    public const CACHE_CODIGO_MOVIL = 'azure_sso_movil_codigo:';

    /**
     * Redirect to Microsoft Entra ID OAuth2 / SAML authorization endpoint.
     */
    public function redirect(Request $request): RedirectResponse
    {
        $azure = $this->azure();

        if (! $azure) {
            return redirect()->route('login')->with('status', self::MSG_NOT_LINKED);
        }

        $state = Str::random(40);
        $request->session()->put('azure_sso_state', $state);

        return redirect($this->urlAutorizacion($azure, $state));
    }

    /**
     * Inicio de sesión desde la app móvil, en el navegador del teléfono. Usa el
     * mismo registro en Entra ID (mismo callback) que el web, pero al final no
     * abre sesión web: devuelve a la app un código de un solo uso que sólo
     * sirve junto con el verificador PKCE que la app guardó.
     */
    public function redirectMovil(Request $request): RedirectResponse|Response
    {
        // SHA-256 en base64url: 43 caracteres.
        $challenge = (string) $request->query('challenge', '');
        if (! preg_match('/^[A-Za-z0-9_-]{43}$/', $challenge)) {
            return $this->volverALaApp(['error' => 'Solicitud de inicio de sesión no válida. Actualice la app.']);
        }

        $azure = $this->azure();
        if (! $azure) {
            return $this->volverALaApp(['error' => self::MSG_NOT_LINKED]);
        }

        // En caché y no en la sesión: el navegador del teléfono no siempre
        // conserva la cookie entre la ida y la vuelta de Microsoft.
        $state = Str::random(40);
        Cache::put(self::CACHE_STATE_MOVIL.$state, $challenge, now()->addMinutes(10));

        // Los teléfonos del kiosko son compartidos: siempre se piden las
        // credenciales para no entrar con la cuenta de Microsoft del anterior.
        return redirect($this->urlAutorizacion($azure, $state, ['prompt' => 'login']));
    }

    /**
     * Handle OAuth2 callback from Microsoft Entra ID.
     */
    public function callback(Request $request): RedirectResponse|Response
    {
        $state = (string) $request->query('state', '');

        if ($state !== '' && ($challenge = Cache::pull(self::CACHE_STATE_MOVIL.$state))) {
            return $this->callbackMovil($request, $challenge);
        }

        // La ruta ya no lleva el middleware guest, porque la app puede volver
        // aquí con una sesión web abierta en el navegador; el web sigue igual.
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        $code = $request->query('code');
        $savedState = (string) $request->session()->pull('azure_sso_state', '');

        if (! $code) {
            return redirect()->route('login')->with('status', 'No se recibió autorización de Microsoft Entra ID.');
        }

        // Protección CSRF del flujo OAuth: el state debe ser el que emitimos.
        if ($state === '' || $savedState === '' || ! hash_equals($savedState, $state)) {
            return redirect()->route('login')->with('status', 'No se pudo validar la solicitud de inicio de sesión. Intente nuevamente.');
        }

        $user = $this->usuarioDeEntra($request, $code);
        if (is_string($user)) {
            return redirect()->route('login')->with('status', $user);
        }

        Auth::login($user);
        $request->session()->regenerate();

        self::registrarAcceso($request, $user, 'web');

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Vuelta de Microsoft de un inicio desde la app (el state ya se validó
     * contra la caché).
     */
    private function callbackMovil(Request $request, string $challenge): Response
    {
        $code = $request->query('code');
        if (! $code) {
            // Cancelado en la pantalla de Microsoft.
            return $this->volverALaApp(['error' => 'No se recibió autorización de Microsoft Entra ID.']);
        }

        $user = $this->usuarioDeEntra($request, $code);
        if (is_string($user)) {
            return $this->volverALaApp(['error' => $user]);
        }

        $codigo = Str::random(64);
        Cache::put(self::CACHE_CODIGO_MOVIL.$codigo, [
            'user_id' => $user->id,
            'challenge' => $challenge,
        ], now()->addMinutes(2));

        return $this->volverALaApp(['code' => $codigo]);
    }

    /**
     * Canjea el código de Microsoft y devuelve al usuario registrado y activo,
     * o el mensaje para quien inicia sesión.
     */
    private function usuarioDeEntra(Request $request, string $code): User|string
    {
        $azure = $this->azure();
        if (! $azure) {
            return self::MSG_NOT_LINKED;
        }

        try {
            // Exchange code for token with Microsoft
            $tokenResponse = Http::asForm()->post("https://login.microsoftonline.com/{$azure['tenant']}/oauth2/v2.0/token", [
                'client_id' => $azure['client_id'],
                'client_secret' => $azure['client_secret'],
                'code' => $code,
                'redirect_uri' => $azure['redirect_uri'],
                'grant_type' => 'authorization_code',
            ]);

            $accessToken = $tokenResponse->successful() ? ($tokenResponse->json()['access_token'] ?? null) : null;
            if (! $accessToken) {
                return 'Error al autenticar token con Microsoft Entra ID.';
            }

            // Get profile from Graph API
            $profileResponse = Http::withToken($accessToken)->get('https://graph.microsoft.com/v1.0/me');
            if ($profileResponse->failed()) {
                return 'Error al consultar perfil en Microsoft Graph.';
            }

            $profile = $profileResponse->json();
            $email = $profile['mail'] ?? $profile['userPrincipalName'] ?? null;
        } catch (\Throwable $e) {
            // El detalle va al log; al usuario no se le expone (puede incluir URLs/secretos).
            Log::error('Error en SSO Entra ID: '.$e->getMessage());

            return 'No fue posible completar el inicio de sesión corporativo. Intente nuevamente.';
        }

        if (! $email || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return 'El usuario no tiene correo corporativo asociado en Entra ID.';
        }

        // Solo entra quien ya fue dado de alta por un administrador (con su
        // empresa y rol). No se crean cuentas automáticamente: una cuenta
        // sin empresa quedaría sin aislamiento por tenant.
        $user = User::where('email', $email)->first();

        if (! $user || in_array($user->status, EnsureUserActive::BLOCKED_STATUSES, true)) {
            Log::warning('SSO Entra ID rechazado: usuario no registrado o desactivado.', ['ip' => $request->ip()]);

            return 'Su cuenta corporativa no tiene acceso a Hoshō. Contacte a su administrador.';
        }

        if ($user->isLocked()) {
            $mins = $user->lockoutRemainingMinutes();

            return "Esta cuenta está temporalmente bloqueada por política SOX. Intente en {$mins} minuto(s) o contacte al administrador.";
        }

        $user->update([
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);

        return $user;
    }

    /** Bitácora del acceso. Desde la app se registra al canjear el código. */
    public static function registrarAcceso(Request $request, User $user, string $canal): void
    {
        activity('auth')
            ->causedBy($user)
            ->performedOn($user)
            ->withProperties([
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'metodo' => 'microsoft_entra_id_sso',
                'canal' => $canal,
            ])
            ->event('sso_login')
            ->log("Inicio de sesión corporativo vía Microsoft Entra ID ({$user->name})".($canal === 'app_movil' ? ' desde la app móvil' : ''));
    }

    /**
     * Tenant, cliente, secreto y callback, o null si el SSO no está listo.
     * SSO solo funciona habilitado y con un tenant corporativo concreto: sin
     * tenant se usaría el endpoint "common" y cualquier cuenta Microsoft del
     * mundo podría autenticarse.
     *
     * @return array{tenant: string, client_id: string, client_secret: ?string, redirect_uri: string}|null
     */
    private function azure(): ?array
    {
        $config = ConfiguracionSox::current();

        $tenantId = $config->azure_tenant_id ?: config('services.azure.tenant');
        $clientId = $config->azure_client_id ?: config('services.azure.client_id');

        if (! $config->sso_azure_enabled || ! $tenantId || ! $clientId) {
            return null;
        }

        return [
            'tenant' => $tenantId,
            'client_id' => $clientId,
            'client_secret' => $config->azure_client_secret ?: config('services.azure.client_secret'),
            'redirect_uri' => $config->azure_redirect_uri ?: route('auth.azure.callback'),
        ];
    }

    private function urlAutorizacion(array $azure, string $state, array $extra = []): string
    {
        $params = http_build_query([
            'client_id' => $azure['client_id'],
            'response_type' => 'code',
            'redirect_uri' => $azure['redirect_uri'],
            'response_mode' => 'query',
            'scope' => 'openid profile email User.Read',
            'state' => $state,
            ...$extra,
        ]);

        return "https://login.microsoftonline.com/{$azure['tenant']}/oauth2/v2.0/authorize?{$params}";
    }

    /**
     * De vuelta a la app, con el esquema que ella registra. Página y no 302:
     * Chrome no abre la app desde una redirección sin un toque de la persona
     * (ver auth/volver-app).
     */
    private function volverALaApp(array $params): Response
    {
        return response()->view('auth.volver-app', [
            'url' => config('services.azure.app_callback').'?'.http_build_query($params),
            'error' => $params['error'] ?? null,
        ]);
    }
}
