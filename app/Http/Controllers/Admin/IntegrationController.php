<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Pais;
use App\Services\BioTimeService;
use App\Services\ControlAccesoService;
use App\Models\ValidacionRegla;
use App\Services\DiditService;
use App\Services\Validaciones\FirmaService;
use App\Services\JaakService;
use App\Services\WhatsAppService;
use App\Services\ZapSignService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Artisan;

class IntegrationController extends Controller
{
    /**
     * Muestra el panel de integraciones para la empresa del usuario.
     */
    public function index(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return redirect()->route('dashboard')->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        // Obtener el estado actual de WhatsApp
        $whatsappService = new WhatsAppService($empresa);
        $status = $whatsappService->getStatus();
        $whatsappConnected = false;
        if ($status && isset($status['isConnected'])) {
            $whatsappConnected = (bool) $status['isConnected'];
        }

        return inertia('admin/integrations/index', [
            'mapbox_api_key' => $empresa->mapbox_api_key,
            'mapbox_active' => (bool) $empresa->mapbox_active,
            'google_maps_api_key' => $empresa->google_maps_api_key,
            'google_maps_active' => (bool) $empresa->google_maps_active,
            'whatsapp_active' => (bool) $empresa->whatsapp_active,
            'whatsapp_connected' => $whatsappConnected,
            'control_acceso_base_url' => $empresa->control_acceso_base_url,
            'control_acceso_app_token' => $empresa->control_acceso_app_token,
            'control_acceso_user_token' => $empresa->control_acceso_user_token,
            'control_acceso_active' => (bool) $empresa->control_acceso_active,
            'biotime_base_url' => $empresa->biotime_base_url,
            'biotime_username' => $empresa->biotime_username,
            // La contraseña nunca viaja al frontend: sólo si hay una guardada.
            'biotime_password_set' => ! empty($empresa->biotime_password),
            'biotime_active' => (bool) $empresa->biotime_active,
            'biotime_last_sync_at' => $empresa->biotime_last_sync_at?->toIso8601String(),
        ]);
    }

    /**
     * Muestra la página de navegación Mapbox.
     */
    public function mapboxMap(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return redirect()->route('dashboard')->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        return inertia('admin/integrations/map', [
            'mapbox_api_key' => $empresa->mapbox_api_key,
            'mapbox_active' => (bool) $empresa->mapbox_active,
            'google_maps_api_key' => $empresa->google_maps_api_key,
            'google_maps_active' => (bool) $empresa->google_maps_active,
        ]);
    }

    /**
     * Muestra la pantalla de navegación en tiempo real.
     */
    public function mapboxNavigation(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return redirect()->route('dashboard')->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        return inertia('admin/integrations/navigation', [
            'mapbox_api_key' => $empresa->mapbox_api_key,
            'mapbox_active' => (bool) $empresa->mapbox_active,
            'google_maps_api_key' => $empresa->google_maps_api_key,
            'google_maps_active' => (bool) $empresa->google_maps_active,
        ]);
    }

    /**
     * Actualiza la configuración de Mapbox de la empresa del usuario.
     */
    public function updateMapbox(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            // El mapa corre en el navegador: Mapbox GL solo acepta tokens PÚBLICOS (pk.).
            'mapbox_api_key' => ['nullable', 'string', 'max:255', 'regex:/^pk\./'],
            'mapbox_active' => 'required|boolean',
        ], [
            'mapbox_api_key.regex' => __('The Mapbox token must be a public token (starts with pk.), not a secret one (sk.).'),
        ]);

        $empresa->update([
            'mapbox_api_key' => $validated['mapbox_api_key'] !== null ? trim($validated['mapbox_api_key']) : null,
            'mapbox_active' => $validated['mapbox_active'],
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Mapbox integration settings updated successfully.'),
        ]);
    }

    /**
     * Actualiza la configuración de Google Maps de la empresa del usuario.
     */
    public function updateGoogleMaps(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'google_maps_api_key' => 'nullable|string|max:255',
            'google_maps_active' => 'required|boolean',
        ]);

        $empresa->update([
            'google_maps_api_key' => $validated['google_maps_api_key'],
            'google_maps_active' => $validated['google_maps_active'],
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Google Maps integration settings updated successfully.'),
        ]);
    }

    /**
     * Actualiza la configuración del middleware de Control de Acceso de la empresa del usuario.
     */
    public function updateControlAcceso(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'control_acceso_base_url' => 'nullable|url|max:255',
            'control_acceso_app_token' => 'nullable|string|max:255',
            'control_acceso_user_token' => 'nullable|string|max:255',
            'control_acceso_active' => 'required|boolean',
        ]);

        $empresa->update([
            'control_acceso_base_url' => $validated['control_acceso_base_url'] ? rtrim($validated['control_acceso_base_url'], '/') : null,
            'control_acceso_app_token' => $validated['control_acceso_app_token'],
            'control_acceso_user_token' => $validated['control_acceso_user_token'],
            'control_acceso_active' => $validated['control_acceso_active'],
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Access Control middleware settings updated successfully.'),
        ]);
    }

    /**
     * Prueba la conexión con el middleware de Control de Acceso usando las credenciales guardadas.
     */
    public function controlAccesoTest(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        if (empty($empresa->control_acceso_base_url) || empty($empresa->control_acceso_app_token) || empty($empresa->control_acceso_user_token)) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Please configure and save the Base URL and both tokens before testing the connection.'),
            ]);
        }

        $result = (new ControlAccesoService($empresa))->testConnection();

        return back()->with('notification', [
            'type' => $result['success'] ? 'success' : 'error',
            'message' => $result['message'],
        ]);
    }

    /**
     * Actualiza la configuración de BioTime PRO (ZKTeco) de la empresa del usuario.
     *
     * La contraseña sólo se reescribe si el formulario envía una nueva; enviar
     * el campo vacío conserva la que ya estaba guardada.
     */
    public function updateBioTime(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'biotime_base_url' => 'nullable|url|max:255',
            'biotime_username' => 'nullable|string|max:150',
            'biotime_password' => 'nullable|string|max:255',
            'biotime_active' => 'required|boolean',
        ]);

        $payload = [
            'biotime_base_url' => $validated['biotime_base_url'] ? rtrim($validated['biotime_base_url'], '/') : null,
            'biotime_username' => $validated['biotime_username'] ?? null,
            'biotime_active' => $validated['biotime_active'],
        ];

        if (! empty($validated['biotime_password'])) {
            $payload['biotime_password'] = $validated['biotime_password'];
        }

        $empresa->update($payload);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('BioTime integration settings updated successfully.'),
        ]);
    }

    /**
     * Prueba la conexión con BioTime PRO usando las credenciales guardadas.
     */
    public function bioTimeTest(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        if (empty($empresa->biotime_base_url) || empty($empresa->biotime_username) || empty($empresa->biotime_password)) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Please configure and save the URL, username and password before testing the connection.'),
            ]);
        }

        $result = (new BioTimeService($empresa))->testConnection();

        return back()->with('notification', [
            'type' => $result['success'] ? 'success' : 'error',
            'message' => $result['message'],
        ]);
    }

    /**
     * Muestra la interfaz de configuración y estado de WhatsApp.
     */
    public function whatsappIndex(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return redirect()->route('dashboard')->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $whatsappService = new WhatsAppService($empresa);
        $status = $whatsappService->getStatus();

        // Sincronizar estado local en DB con estado en vivo
        $this->syncLocalWhatsAppStatus($empresa, $status);

        $currentLocale = app()->getLocale();
        $translations = file_exists($path = base_path('lang/'.$currentLocale.'.json'))
            ? json_decode(file_get_contents($path) ?: '{}', true)
            : [];

        // Obtener lista de países activos para el selector de teléfono
        $paises = Pais::where('activo', true)
            ->orderBy('nombre', 'asc')
            ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico']);

        return inertia('admin/integrations/whatsapp', [
            'paises' => $paises,
            'empresa_id' => $empresa->id,
            'empresa_nombre' => $empresa->razon_social ?? $empresa->name ?? 'Empresa',
            'whatsapp_api_key' => $empresa->whatsapp_api_key,
            'whatsapp_api_url' => $empresa->whatsapp_api_url ?? config('whatsapp.api_url', 'http://82.165.213.124:8092'),
            'whatsapp_instance' => $empresa->whatsapp_instance ?? ('empresa_'.$empresa->id),
            'whatsapp_rate_limit' => $empresa->whatsapp_rate_limit ?? 60,
            'whatsapp_active' => (bool) $empresa->whatsapp_active,
            'whatsapp_phone' => $empresa->whatsapp_phone,
            'whatsapp_status' => $empresa->whatsapp_status,
            'live_status' => $status,
            'locale' => $currentLocale,
            'translations' => $translations,
        ]);
    }

    /**
     * Devuelve el estado en tiempo real (JSON) para polling del QR y conexión.
     */
    public function whatsappStatus(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return response()->json(['success' => false, 'error' => 'No active company found.'], 404);
        }

        $whatsappService = new WhatsAppService($empresa);
        $status = $whatsappService->getStatus();

        // Sincronizar estado local en DB con estado en vivo
        $this->syncLocalWhatsAppStatus($empresa, $status);

        return response()->json([
            'success' => true,
            'status' => $status,
            'whatsapp_status' => $empresa->whatsapp_status,
            'whatsapp_phone' => $empresa->whatsapp_phone,
        ]);
    }

    /**
     * Actualiza la configuración local de la empresa para WhatsApp.
     */
    public function whatsappUpdate(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'whatsapp_api_url' => 'nullable|url|max:255',
            'whatsapp_instance' => 'nullable|string|max:100',
            'whatsapp_api_key' => 'nullable|string|max:255',
            'whatsapp_active' => 'required|boolean',
            'whatsapp_rate_limit' => 'required|integer|min:1|max:1000',
        ]);

        $empresa->update([
            'whatsapp_api_url' => $validated['whatsapp_api_url'],
            'whatsapp_instance' => $validated['whatsapp_instance'],
            'whatsapp_api_key' => $validated['whatsapp_api_key'],
            'whatsapp_active' => $validated['whatsapp_active'],
            'whatsapp_rate_limit' => $validated['whatsapp_rate_limit'],
        ]);

        // Si la integración está activa, conectamos la instancia para crearla en el servidor y obtener su token UUID
        if ($validated['whatsapp_active']) {
            $whatsappService = new WhatsAppService($empresa);
            $result = $whatsappService->connect();
            if ($result) {
                $token = $result['instance']['token'] ?? $result['token'] ?? null;
                if ($token) {
                    $empresa->update(['whatsapp_api_key' => $token]);
                }
            }
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('WhatsApp settings updated and instance synced successfully.'),
        ]);
    }

    /**
     * Genera un nuevo token/API Key de WhatsApp para la empresa del usuario.
     */
    public function whatsappGenerateToken(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $randomPart = bin2hex(random_bytes(16));
        $token = 'whatsapp-'.$empresa->id.'-'.substr($randomPart, 0, 16);

        $empresa->update([
            'whatsapp_api_key' => $token,
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('New WhatsApp API Key generated successfully.'),
        ]);
    }

    /**
     * Sincroniza la empresa con la API de WhatsApp usando el comando Artisan.
     */
    public function whatsappSync(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        if (empty($empresa->whatsapp_api_key)) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Please generate an API Key before syncing.'),
            ]);
        }

        try {
            Artisan::call('whatsapp:sync-company', [
                'empresa' => $empresa->id,
            ]);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Company synced with WhatsApp server successfully.'),
            ]);
        } catch (\Exception $e) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Failed to sync company: ').$e->getMessage(),
            ]);
        }
    }

    /**
     * Inicia conexión en la API de WhatsApp.
     */
    public function whatsappConnect(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $whatsappService = new WhatsAppService($empresa);
        $result = $whatsappService->connect();

        if ($result && (isset($result['instance']) || isset($result['message']) || (isset($result['success']) && $result['success']))) {
            $token = $result['instance']['token'] ?? $result['token'] ?? null;
            if ($token) {
                $empresa->update([
                    'whatsapp_api_key' => $token,
                ]);
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Connection process started. Token assigned: ').($token ? substr($token, 0, 8).'...' : 'ok'),
            ]);
        }

        return back()->with('notification', [
            'type' => 'error',
            'message' => __('Failed to initiate connection.'),
        ]);
    }

    /**
     * Desconecta de la API de WhatsApp.
     */
    public function whatsappDisconnect(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $whatsappService = new WhatsAppService($empresa);
        $whatsappService->disconnect();

        // Limpiar estado en la base de datos de empresa local
        $empresa->update([
            'whatsapp_status' => 'disconnected',
            'whatsapp_phone' => null,
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Disconnected from WhatsApp.'),
        ]);
    }

    /**
     * Fuerza reconexión de WhatsApp.
     */
    public function whatsappReconnect(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $whatsappService = new WhatsAppService($empresa);
        $whatsappService->reconnect();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Reconnection forced successfully.'),
        ]);
    }

    /**
     * Envía un mensaje de prueba.
     */
    public function whatsappSendMessage(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'to' => 'required|string|min:8|max:20',
            'message' => 'required|string|max:1000',
        ]);

        $whatsappService = new WhatsAppService($empresa);

        // Ejecutar envío saltándose opt-in por ser prueba (isWelcome = true)
        $result = $whatsappService->sendMessage($validated['to'], $validated['message'], true);

        if ($result && (isset($result['success']) && $result['success'] || isset($result['messageId']))) {
            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Test message sent successfully!'),
            ]);
        }

        $error = $result['error'] ?? __('Failed to send message. Check WhatsApp server logs.');

        return back()->with('notification', [
            'type' => 'error',
            'message' => __('Error: ').$error,
        ]);
    }

    /**
     * Muestra el panel de Validaciones (identidad/KYC) para la empresa del usuario.
     */
    public function validacionesIndex(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return redirect()->route('dashboard')->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        return inertia('admin/integrations/validaciones', [
            'jaak_api_key' => $empresa->jaak_api_key,
            'jaak_environment' => $empresa->jaak_environment ?? 'sandbox',
            'jaak_active' => (bool) $empresa->jaak_active,
            // tokenDe() en vez del atributo directo: si el valor guardado no se
            // puede descifrar devuelve null en lugar de reventar la pantalla.
            'zapsign_api_token' => ZapSignService::tokenDe($empresa),
            'zapsign_environment' => $empresa->zapsign_environment ?? 'production',
            'zapsign_active' => (bool) $empresa->zapsign_active,
            'didit_api_key' => DiditService::tokenDe($empresa),
            'didit_workflow_id' => $empresa->didit_workflow_id ?? config('didit.default_workflow_id'),
            'didit_active' => (bool) $empresa->didit_active,
            // El secreto nunca viaja al frontend: sólo si hay uno guardado.
            'didit_webhook_secret_set' => $this->diditSecretoGuardado($empresa),
            'didit_webhook_url' => route('webhooks.didit'),
            'reglas' => $this->reglasValidacion($empresa),
            'zapsign_plantillas' => $this->plantillasZapsign($empresa),
            'zapsign_variables' => FirmaService::VARIABLES,
        ]);
    }

    /**
     * Guarda las reglas de validación por entidad (identidad, antifraude DIDIT,
     * plantilla ZapSign). Sólo crea / actualiza renglones; nunca borra.
     */
    public function updateReglasValidacion(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'reglas' => 'required|array',
            'reglas.*.entidad' => 'required|string|in:'.implode(',', array_keys(ValidacionRegla::ENTIDADES)),
            'reglas.*.kyc_activo' => 'required|boolean',
            'reglas.*.didit_antifraude' => 'required|boolean',
            'reglas.*.firma_activa' => 'required|boolean',
            'reglas.*.plantilla_zapsign' => 'nullable|string|max:64|regex:/^[A-Za-z0-9-]+$/',
            'reglas.*.nombre_documento' => 'nullable|string|max:120',
            'reglas.*.firma_obligatoria' => 'required|boolean',
            'reglas.*.firma_valida_identidad' => 'required|boolean',
        ]);

        foreach ($validated['reglas'] as $i => $r) {
            $conSeguimiento = in_array($r['entidad'], ValidacionRegla::ENTIDADES_CON_SEGUIMIENTO, true);

            if ($r['firma_activa'] && $conSeguimiento && empty($r['plantilla_zapsign'])) {
                return back()->withErrors([
                    "reglas.$i.plantilla_zapsign" => __('Choose a ZapSign template to enable signing.'),
                ])->with('notification', [
                    'type' => 'error',
                    'message' => __('Choose a ZapSign template to enable signing.'),
                ]);
            }

            ValidacionRegla::updateOrCreate(
                ['empresa_id' => $empresa->id, 'entidad' => $r['entidad']],
                [
                    'kyc_activo' => $r['kyc_activo'],
                    // Antifraude y firma sólo donde el alta ya entrega la liga de seguimiento.
                    'didit_antifraude' => $conSeguimiento && $r['didit_antifraude'],
                    'firma_activa' => $conSeguimiento && $r['firma_activa'],
                    'plantilla_zapsign' => $r['plantilla_zapsign'] ?: null,
                    'nombre_documento' => $r['nombre_documento'] ?: null,
                    'firma_obligatoria' => $conSeguimiento && $r['firma_obligatoria'],
                    'firma_valida_identidad' => $conSeguimiento && $r['firma_valida_identidad'],
                ],
            );
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Validation rules saved.'),
        ]);
    }

    private function reglasValidacion(Empresa $empresa): array
    {
        return collect(array_keys(ValidacionRegla::ENTIDADES))
            ->map(function (string $entidad) use ($empresa) {
                $r = ValidacionRegla::para($empresa->id, $entidad);

                return [
                    'entidad' => $entidad,
                    'kyc_activo' => (bool) $r->kyc_activo,
                    'didit_antifraude' => (bool) $r->didit_antifraude,
                    'firma_activa' => (bool) $r->firma_activa,
                    'plantilla_zapsign' => $r->plantilla_zapsign,
                    'nombre_documento' => $r->nombre_documento,
                    'firma_obligatoria' => (bool) $r->firma_obligatoria,
                    'firma_valida_identidad' => (bool) $r->firma_valida_identidad,
                    'con_seguimiento' => $r->conSeguimiento(),
                ];
            })
            ->all();
    }

    /**
     * Plantillas de la cuenta ZapSign para elegir en las reglas. Cacheado 5
     * minutos; si ZapSign no responde, la lista llega vacía y la pantalla
     * sigue funcionando (se puede escribir el token a mano).
     */
    private function plantillasZapsign(Empresa $empresa): array
    {
        if (! $empresa->zapsign_active || ! ZapSignService::tokenDe($empresa)) {
            return [];
        }

        return Cache::remember('zapsign:plantillas:'.$empresa->id, 300, function () use ($empresa) {
            $res = (new ZapSignService($empresa))->listarPlantillas();

            return $res['ok']
                ? collect($res['data']['results'] ?? [])
                    ->filter(fn ($t) => ($t['active'] ?? true))
                    ->map(fn ($t) => [
                        'token' => $t['token'] ?? null,
                        'nombre' => $t['name'] ?? '',
                        'tipo' => $t['template_type'] ?? null,
                    ])
                    ->filter(fn ($t) => $t['token'])
                    ->values()
                    ->all()
                : [];
        });
    }

    private function diditSecretoGuardado(Empresa $empresa): bool
    {
        try {
            return ! empty($empresa->didit_webhook_secret);
        } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
            return false;
        }
    }

    /**
     * Muestra la página de integración de Reloj Checador (BioTime PRO) de la empresa.
     * Solo lectura: replica el subconjunto de props de index() para esta integración.
     */
    public function relojChecadorIndex(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return redirect()->route('dashboard')->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        return inertia('admin/integrations/reloj-checador', [
            'biotime_base_url' => $empresa->biotime_base_url,
            'biotime_username' => $empresa->biotime_username,
            // La contraseña nunca viaja al frontend: sólo si hay una guardada.
            'biotime_password_set' => ! empty($empresa->biotime_password),
            'biotime_active' => (bool) $empresa->biotime_active,
            'biotime_last_sync_at' => $empresa->biotime_last_sync_at?->toIso8601String(),
        ]);
    }

    /**
     * Muestra la página de integración del Middleware de Control de Acceso de la empresa.
     * Solo lectura: replica el subconjunto de props de index() para esta integración.
     */
    public function controlAccesoIndex(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return redirect()->route('dashboard')->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        return inertia('admin/integrations/control-acceso', [
            'control_acceso_base_url' => $empresa->control_acceso_base_url,
            'control_acceso_app_token' => $empresa->control_acceso_app_token,
            'control_acceso_user_token' => $empresa->control_acceso_user_token,
            'control_acceso_active' => (bool) $empresa->control_acceso_active,
        ]);
    }

    /**
     * Actualiza la configuración de JAAK (KYC) de la empresa del usuario.
     */
    public function updateJaak(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'jaak_api_key' => 'nullable|string|max:4000',
            'jaak_environment' => 'required|in:sandbox,production',
            'jaak_active' => 'required|boolean',
        ]);

        $empresa->update([
            'jaak_api_key' => $validated['jaak_api_key'] ? trim($validated['jaak_api_key']) : null,
            'jaak_environment' => $validated['jaak_environment'],
            'jaak_active' => $validated['jaak_active'],
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('JAAK integration settings updated successfully.'),
        ]);
    }

    /**
     * Prueba la conexión con JAAK usando las credenciales guardadas.
     */
    public function jaakTest(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        if (empty($empresa->jaak_api_key)) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Please configure and save the App Key before testing the connection.'),
            ]);
        }

        $result = (new JaakService($empresa))->testConnection();

        return back()->with('notification', [
            'type' => $result['success'] ? 'success' : 'error',
            'message' => $result['message'],
        ]);
    }

    /**
     * Actualiza la configuración de ZapSign (firma electrónica) de la empresa.
     */
    public function updateZapsign(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'zapsign_api_token' => 'nullable|string|max:4000',
            'zapsign_environment' => 'required|in:sandbox,production',
            'zapsign_active' => 'required|boolean',
        ]);

        $token = $validated['zapsign_api_token'] !== null ? trim($validated['zapsign_api_token']) : '';

        // Activar sin token deja la integración en un estado inservible que sólo
        // se manifiesta al primer uso: se rechaza aquí, antes de guardar.
        if ($validated['zapsign_active'] && $token === '') {
            return back()->withErrors([
                'zapsign_api_token' => __('An API Token is required to enable the ZapSign integration.'),
            ])->with('notification', [
                'type' => 'error',
                'message' => __('An API Token is required to enable the ZapSign integration.'),
            ]);
        }

        $empresa->update([
            'zapsign_api_token' => $token !== '' ? $token : null,
            'zapsign_environment' => $validated['zapsign_environment'],
            'zapsign_active' => $validated['zapsign_active'],
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('ZapSign integration settings updated successfully.'),
        ]);
    }

    /**
     * Prueba la conexión con ZapSign usando las credenciales guardadas.
     */
    public function zapsignTest(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $result = (new ZapSignService($empresa))->testConnection();

        return back()->with('notification', [
            'type' => $result['success'] ? 'success' : 'error',
            'message' => $result['message'],
        ]);
    }

    /**
     * Actualiza la configuración de DIDIT (verificación de identidad) de la empresa.
     */
    public function updateDidit(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'didit_api_key' => 'nullable|string|max:4000',
            'didit_workflow_id' => 'nullable|string|max:100',
            'didit_active' => 'required|boolean',
            'didit_webhook_secret' => 'nullable|string|max:255',
        ]);

        $apiKey = $validated['didit_api_key'] !== null ? trim($validated['didit_api_key']) : '';

        // Activar sin API Key deja la integración inutilizable
        if ($validated['didit_active'] && $apiKey === '') {
            return back()->withErrors([
                'didit_api_key' => __('An API Key is required to enable the DIDIT integration.'),
            ])->with('notification', [
                'type' => 'error',
                'message' => __('An API Key is required to enable the DIDIT integration.'),
            ]);
        }

        $empresa->update([
            'didit_api_key' => $apiKey !== '' ? $apiKey : null,
            'didit_workflow_id' => ! empty($validated['didit_workflow_id']) ? trim($validated['didit_workflow_id']) : null,
            'didit_active' => $validated['didit_active'],
        ]);

        // Vacío = conservar el secreto guardado (nunca se manda al frontend).
        if (! empty($validated['didit_webhook_secret'])) {
            $empresa->forceFill(['didit_webhook_secret' => trim($validated['didit_webhook_secret'])])->save();
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('DIDIT integration settings updated successfully.'),
        ]);
    }

    /**
     * Prueba la conexión con DIDIT usando las credenciales guardadas.
     */
    public function diditTest(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        if (empty($empresa->didit_api_key)) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Please configure and save the API Key before testing the connection.'),
            ]);
        }

        $result = (new DiditService($empresa))->testConnection();

        return back()->with('notification', [
            'type' => $result['success'] ? 'success' : 'error',
            'message' => $result['message'],
        ]);
    }

    /**
     * Sincroniza el estado local de la empresa con la respuesta del servicio de WhatsApp.
     */
    private function syncLocalWhatsAppStatus(Empresa $empresa, $status)
    {
        $updateData = [];

        $token = $status['token'] ?? $status['raw']['token'] ?? null;
        if ($token && $empresa->whatsapp_api_key !== $token) {
            $updateData['whatsapp_api_key'] = $token;
        }

        if ($status && isset($status['isConnected']) && $status['isConnected']) {
            $livePhone = null;
            if (isset($status['user']['id'])) {
                $livePhone = explode('@', $status['user']['id'])[0];
            }

            $updateData['whatsapp_status'] = 'connected';
            $updateData['whatsapp_phone'] = $livePhone ?? $empresa->whatsapp_phone;
            $updateData['whatsapp_last_connected'] = now();
        } elseif ($status && isset($status['connectionState']) && $status['connectionState'] === 'connecting') {
            $updateData['whatsapp_status'] = 'connecting';
        } elseif ($status && isset($status['connectionState']) && $status['connectionState'] === 'qr_ready') {
            $updateData['whatsapp_status'] = 'qr_ready';
        } else {
            $updateData['whatsapp_status'] = 'disconnected';
        }

        if (! empty($updateData)) {
            $empresa->update($updateData);
        }
    }
}
