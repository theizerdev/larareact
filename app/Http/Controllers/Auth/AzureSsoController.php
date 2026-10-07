<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionSox;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AzureSsoController extends Controller
{
    /**
     * Redirect to Microsoft Entra ID OAuth2 / SAML authorization endpoint.
     */
    public function redirect(Request $request): RedirectResponse
    {
        $config = ConfiguracionSox::current();

        $tenantId = $config->azure_tenant_id ?: config('services.azure.tenant');
        $clientId = $config->azure_client_id ?: config('services.azure.client_id');
        $redirectUri = $config->azure_redirect_uri ?: route('auth.azure.callback');

        if (!$config->sso_azure_enabled && !$tenantId) {
            return redirect()->route('login')->with(
                'status',
                'El inicio de sesión vía Microsoft Entra ID se encuentra en proceso de vinculación. Ingrese a la consola de Cumplimiento SOX para configurar el Tenant ID.'
            );
        }

        $tenant = $tenantId ?: 'common';
        $state = Str::random(40);
        $request->session()->put('azure_sso_state', $state);

        $params = http_build_query([
            'client_id' => $clientId,
            'response_type' => 'code',
            'redirect_uri' => $redirectUri,
            'response_mode' => 'query',
            'scope' => 'openid profile email User.Read',
            'state' => $state,
        ]);

        return redirect("https://login.microsoftonline.com/{$tenant}/oauth2/v2.0/authorize?{$params}");
    }

    /**
     * Handle OAuth2 callback from Microsoft Entra ID.
     */
    public function callback(Request $request): RedirectResponse
    {
        $code = $request->query('code');
        $state = $request->query('state');
        $savedState = $request->session()->pull('azure_sso_state');

        if (!$code) {
            return redirect()->route('login')->with('status', 'No se recibió autorización de Microsoft Entra ID.');
        }

        $config = ConfiguracionSox::current();
        $tenantId = $config->azure_tenant_id ?: config('services.azure.tenant', 'common');
        $clientId = $config->azure_client_id ?: config('services.azure.client_id');
        $clientSecret = $config->azure_client_secret ?: config('services.azure.client_secret');
        $redirectUri = $config->azure_redirect_uri ?: route('auth.azure.callback');

        try {
            // Exchange code for token with Microsoft
            $tokenResponse = Http::asForm()->post("https://login.microsoftonline.com/{$tenantId}/oauth2/v2.0/token", [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'code' => $code,
                'redirect_uri' => $redirectUri,
                'grant_type' => 'authorization_code',
            ]);

            if ($tokenResponse->failed()) {
                return redirect()->route('login')->with('status', 'Error al autenticar token con Microsoft Entra ID.');
            }

            $tokenData = $tokenResponse->json();
            $accessToken = $tokenData['access_token'] ?? null;

            // Get profile from Graph API
            $profileResponse = Http::withToken($accessToken)->get('https://graph.microsoft.com/v1.0/me');
            if ($profileResponse->failed()) {
                return redirect()->route('login')->with('status', 'Error al consultar perfil en Microsoft Graph.');
            }

            $profile = $profileResponse->json();
            $email = $profile['mail'] ?? $profile['userPrincipalName'] ?? null;
            $name = $profile['displayName'] ?? 'Usuario Corporativo';

            if (!$email) {
                return redirect()->route('login')->with('status', 'El usuario no tiene correo corporativo asociado en Entra ID.');
            }

            // Find or associate user in Hosho
            $user = User::where('email', $email)->first();

            if (!$user) {
                // If user doesn't exist, create corporate user with SOX baseline
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Str::password(32),
                    'status' => 'activo',
                    'email_verified_at' => now(),
                    'password_changed_at' => now(),
                    'failed_login_attempts' => 0,
                ]);

                $user->recordPasswordHistory($user->password);
            }

            // Check if locked
            if ($user->isLocked()) {
                $mins = $user->lockoutRemainingMinutes();
                return redirect()->route('login')->with(
                    'status',
                    "Esta cuenta está temporalmente bloqueada por política SOX. Intente en {$mins} minuto(s) o contacte al administrador."
                );
            }

            // Successful SSO login
            $user->update([
                'failed_login_attempts' => 0,
                'locked_until' => null,
            ]);

            Auth::login($user);

            activity('auth')
                ->causedBy($user)
                ->performedOn($user)
                ->withProperties([
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'metodo' => 'microsoft_entra_id_sso',
                ])
                ->event('sso_login')
                ->log("Inicio de sesión corporativo vía Microsoft Entra ID ({$user->name})");

            return redirect()->intended(route('dashboard'));

        } catch (\Throwable $e) {
            return redirect()->route('login')->with('status', 'Excepción durante la autenticación SSO: ' . $e->getMessage());
        }
    }
}
