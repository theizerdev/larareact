<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Pastor;
use App\Models\User;
use App\Models\WhatsAppMessage;
use App\Models\WhatsAppTemplate;
use App\Services\ControlAccesoService;
use App\Services\JaakService;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
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
         // Comprobar si el usuario es SuperAdmin o pertenece a la Empresa 1 (Dueño del SaaS)
        $user = $request->user();
        $isSuperAdmin = $user->hasRole('Super Administrador') || $user->hasRole('super-admin') || $empresa->id === 1;

        return inertia('admin/integrations/index', [
             'is_super_admin' => $isSuperAdmin,
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
       // Pasarelas de Pago Globales SaaS
            'paypal_active' => (bool) $empresa->paypal_active,
            'paypal_mode' => $empresa->paypal_mode ?? 'sandbox',
            'paypal_client_id' => $empresa->paypal_client_id ?? '',
            'paypal_client_secret' => $empresa->paypal_client_secret ?? '',
            'mercadopago_active' => (bool) $empresa->mercadopago_active,
            'mercadopago_mode' => $empresa->mercadopago_mode ?? 'sandbox',
            'mercadopago_public_key' => $empresa->mercadopago_public_key ?? '',
            'mercadopago_access_token' => $empresa->mercadopago_access_token ?? '',
            'stripe_active' => (bool) $empresa->stripe_active,
            'stripe_mode' => $empresa->stripe_mode ?? 'test',
            'stripe_publishable_key' => $empresa->stripe_publishable_key ?? '',
            'stripe_secret_key' => $empresa->stripe_secret_key ?? '',
            'stripe_webhook_secret' => $empresa->stripe_webhook_secret ?? '',
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
            'mapbox_api_key' => 'nullable|string|max:255',
            'mapbox_active' => 'required|boolean',
        ]);

        $empresa->update([
            'mapbox_api_key' => $validated['mapbox_api_key'],
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
     * Muestra la documentación técnica interactiva de la API de WhatsApp.
     */
    public function whatsappDocs(Request $request)
    {
        $empresa = $request->user()?->empresa ?? Empresa::find(1);

        $currentLocale = app()->getLocale();
        $translations = file_exists($path = base_path('lang/'.$currentLocale.'.json'))
            ? json_decode(file_get_contents($path) ?: '{}', true)
            : [];

        return inertia('admin/integrations/docs', [
            'empresa_id' => $empresa?->id ?? 1,
            'empresa_nombre' => $empresa?->razon_social ?? $empresa?->name ?? 'MMM Venezuela',
            'whatsapp_api_url' => $empresa?->whatsapp_api_url ?? config('whatsapp.api_url', 'http://localhost:3000'),
            'whatsapp_instance' => $empresa?->whatsapp_instance ?? 'empresa_1',
            'whatsapp_api_key' => $empresa?->whatsapp_api_key ?? 'my_secret_key_123',
            'locale' => $currentLocale,
            'translations' => $translations,
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

        $queueStats = $whatsappService->getQueueStats();

        $currentLocale = app()->getLocale();
        $translations = file_exists($path = base_path('lang/'.$currentLocale.'.json'))
            ? json_decode(file_get_contents($path) ?: '{}', true)
            : [];

        // Obtener lista de países activos para el selector de teléfono
        $paises = Pais::where('activo', true)
            ->orderBy('nombre', 'asc')
            ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico']);

        $templates = WhatsAppTemplate::where('empresa_id', $empresa->id)
            ->where('activo', true)
            ->orderBy('categoria')
            ->orderBy('nombre')
            ->get();

        return inertia('admin/integrations/whatsapp', [
            'paises' => $paises,
            'templates' => $templates,
            'empresa_id' => $empresa->id,
            'empresa_nombre' => $empresa->razon_social ?? $empresa->name ?? 'Empresa',
            'whatsapp_api_key' => $empresa->whatsapp_api_key,
            'whatsapp_api_url' => $empresa->whatsapp_api_url ?? config('whatsapp.api_url', 'http://localhost:3000'),
            'whatsapp_instance' => $empresa->whatsapp_instance ?? ('empresa_'.$empresa->id),
            'whatsapp_rate_limit' => (int) ($empresa->whatsapp_rate_limit ?? 300),
            'whatsapp_warmup_mode' => (bool) ($empresa->whatsapp_warmup_mode ?? true),
            'whatsapp_working_hours_enabled' => (bool) ($empresa->whatsapp_working_hours_enabled ?? true),
            'whatsapp_working_hours_start' => $empresa->whatsapp_working_hours_start ?? '08:00',
            'whatsapp_working_hours_end' => $empresa->whatsapp_working_hours_end ?? '20:00',
            'whatsapp_proxy_url' => $empresa->whatsapp_proxy_url ?? '',
            'whatsapp_active' => (bool) $empresa->whatsapp_active,
            'whatsapp_phone' => $empresa->whatsapp_phone,
            'whatsapp_status' => $empresa->whatsapp_status,
            'live_status' => $status,
            'queue_stats' => $queueStats,
            'locale' => $currentLocale,
            'translations' => $translations,'is_superadmin' => $request->user()->isSuperAdmin(),
            // Datos de suscripción / prueba
            'subscription_status' => $empresa->subscription_status,
            'trial_ends_at' => $empresa->trial_ends_at?->toIso8601String(),
            'dias_restantes' => $empresa->dias_restantes_suscripcion,
            'is_on_trial' => $empresa->isOnTrial(),
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
        $queueStats = $whatsappService->getQueueStats();

        return response()->json([
            'success' => true,
            'status' => $status,
            'whatsapp_status' => $empresa->whatsapp_status,
            'whatsapp_phone' => $empresa->whatsapp_phone,
            'queue_stats' => $queueStats,
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
     * Devuelve las estadísticas de la cola de WhatsApp en tiempo real (JSON).
     */
    public function whatsappQueueStats(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return response()->json(['success' => false, 'error' => 'No active company found.'], 404);
        }

        $whatsappService = new WhatsAppService($empresa);
        $stats = $whatsappService->getQueueStats();

        return response()->json([
            'success' => true,
            'stats' => $stats,
        ]);
    }

    /**
     * Verifica si un número telefónico existe en WhatsApp.
     */
    public function whatsappCheckNumber(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return response()->json(['success' => false, 'error' => 'No active company found.'], 404);
        }

        $validated = $request->validate([
            'phone' => 'required|string|min:6|max:25',
        ]);

        $whatsappService = new WhatsAppService($empresa);
        $result = $whatsappService->checkNumber($validated['phone']);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Previsualiza variaciones de una plantilla con Spintax y variables dinámicas.
     */
    public function whatsappPreviewSpintax(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return response()->json(['success' => false, 'error' => 'No active company found.'], 404);
        }

        $validated = $request->validate([
            'template' => 'required|string|max:2000',
            'count' => 'nullable|integer|min:1|max:20',
            'variables' => 'nullable|array',
        ]);

        $whatsappService = new WhatsAppService($empresa);
        $variations = $whatsappService->previewSpintax(
            $validated['template'],
            $validated['count'] ?? 5,
            $validated['variables'] ?? []
        );

        return response()->json([
            'success' => true,
            'data' => $variations,
        ]);
    }

    /**
     * Actualiza configuración Anti-Baneo en el motor de WhatsApp.
     */
    public function whatsappUpdateAntiBan(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'dailyLimit' => 'nullable|integer|min:1|max:50000',
            'warmupMode' => 'nullable|boolean',
            'workingHoursEnabled' => 'nullable|boolean',
            'workingHoursStart' => 'nullable|string|max:10',
            'workingHoursEnd' => 'nullable|string|max:10',
            'proxyUrl' => 'nullable|string|max:255',
        ]);

        $updateData = [];
        if (isset($validated['dailyLimit'])) {
            $updateData['whatsapp_rate_limit'] = (int) $validated['dailyLimit'];
        }
        if (isset($validated['warmupMode'])) {
            $updateData['whatsapp_warmup_mode'] = (bool) $validated['warmupMode'];
        }
        if (isset($validated['workingHoursEnabled'])) {
            $updateData['whatsapp_working_hours_enabled'] = (bool) $validated['workingHoursEnabled'];
        }
        if (isset($validated['workingHoursStart'])) {
            $updateData['whatsapp_working_hours_start'] = $validated['workingHoursStart'];
        }
        if (isset($validated['workingHoursEnd'])) {
            $updateData['whatsapp_working_hours_end'] = $validated['workingHoursEnd'];
        }
        if (array_key_exists('proxyUrl', $validated)) {
            $updateData['whatsapp_proxy_url'] = $validated['proxyUrl'];
        }

        if (! empty($updateData)) {
            $empresa->update($updateData);
        }

        $whatsappService = new WhatsAppService($empresa);
        $whatsappService->updateAntiBan([
            'dailyLimit' => $validated['dailyLimit'] ?? $empresa->whatsapp_rate_limit,
            'warmupMode' => $validated['warmupMode'] ?? $empresa->whatsapp_warmup_mode,
            'workingHoursEnabled' => $validated['workingHoursEnabled'] ?? $empresa->whatsapp_working_hours_enabled,
            'workingHoursStart' => $validated['workingHoursStart'] ?? $empresa->whatsapp_working_hours_start,
            'workingHoursEnd' => $validated['workingHoursEnd'] ?? $empresa->whatsapp_working_hours_end,
            'proxyUrl' => $validated['proxyUrl'] ?? $empresa->whatsapp_proxy_url,
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Anti-Ban & Messaging limits updated successfully.'),
        ]);
    }

    /**
     * Añade un número a la lista negra.
     */
    public function whatsappAddToBlacklist(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'phone' => 'required|string|min:6|max:25',
            'reason' => 'nullable|string|max:100',
        ]);

        $whatsappService = new WhatsAppService($empresa);
        $result = $whatsappService->addToBlacklist($validated['phone'], $validated['reason'] ?? 'MANUAL_BLOCK');

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Phone number added to blacklist successfully.'),
        ]);
    }

    /**
     * Elimina un número de la lista negra.
     */
    public function whatsappRemoveFromBlacklist(Request $request, string $phone)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $whatsappService = new WhatsAppService($empresa);
        $whatsappService->removeFromBlacklist($phone);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Phone number removed from blacklist.'),
        ]);
    }

    /**
     * Envía un mensaje de prueba con soporte Spintax y variables.
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
            'to' => 'required|string|min:8|max:25',
            'message' => 'required|string|max:2000',
            'variables' => 'nullable|array',
            'sync' => 'nullable|boolean',
        ]);

        $whatsappService = new WhatsAppService($empresa);

        // Envío seguro con Spintax y variables
        $result = $whatsappService->sendText(
            $validated['to'],
            $validated['message'],
            $validated['variables'] ?? ['nombre' => $request->user()->name ?? 'Usuario'],
            (bool) ($validated['sync'] ?? false)
        );

        if ($result && (isset($result['success']) && $result['success'] || isset($result['messageId']) || isset($result['jobId']) || isset($result['status']))) {
            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Test message processed successfully! Spintax and variables resolved.'),
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
            if (! empty($status['userJid'])) {
                $livePhone = explode('@', $status['userJid'])[0];
            } elseif (isset($status['user']['id'])) {
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

    /**
     * 🩺 Diagnóstico y prueba de latencia en vivo del motor de WhatsApp
     */
    public function whatsappDiagnostic(Request $request)
    {
        $empresa = $request->user()->empresa;
        if (! $empresa) {
            return response()->json(['success' => false, 'error' => 'No active company found.'], 404);
        }

        $whatsappService = new WhatsAppService($empresa);
        $startTime = microtime(true);
        $status = $whatsappService->getStatus();
        $latencyMs = round((microtime(true) - $startTime) * 1000, 2);

        $healthData = null;
        try {
            $apiUrl = rtrim($empresa->whatsapp_api_url ?? config('whatsapp.api_url', 'http://localhost:3000'), '/');
            $res = \Illuminate\Support\Facades\Http::timeout(3)->get("{$apiUrl}/health");
            if ($res->successful()) {
                $healthData = $res->json();
            }
        } catch (\Throwable $e) {
            // Silencioso si falla
        }

        return response()->json([
            'success' => true,
            'latencyMs' => $latencyMs,
            'status' => $status,
            'health' => $healthData,
            'empresa_status' => $empresa->whatsapp_status,
            'last_connected' => $empresa->whatsapp_last_connected?->toIso8601String(),
        ]);
    }

    /**
     * 📬 Historial y logs de mensajes de WhatsApp
     */
    public function whatsappMessages(Request $request)
    {
        $empresa = $request->user()->empresa;
        if (! $empresa) {
            return response()->json(['success' => false, 'messages' => []], 404);
        }

        $query = WhatsAppMessage::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('recipient_phone', 'like', "%{$search}%")
                    ->orWhere('message_content', 'like', "%{$search}%")
                    ->orWhere('message_id', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($direction = $request->input('direction')) {
            if ($direction !== 'all') {
                $query->where('direction', $direction);
            }
        }

        $messages = $query->orderBy('created_at', 'desc')->paginate((int) $request->input('per_page', 15));

        $totalSent = WhatsAppMessage::where('direction', 'outbound')->count();
        $totalDelivered = WhatsAppMessage::where('direction', 'outbound')->whereIn('status', ['delivered', 'read'])->count();
        $totalRead = WhatsAppMessage::where('direction', 'outbound')->where('status', 'read')->count();
        $totalFailed = WhatsAppMessage::where('direction', 'outbound')->where('status', 'failed')->count();

        $deliveryRate = $totalSent > 0 ? round(($totalDelivered / $totalSent) * 100, 1) : 100;
        $readRate = $totalDelivered > 0 ? round(($totalRead / $totalDelivered) * 100, 1) : 0;

        return response()->json([
            'success' => true,
            'messages' => $messages,
            'stats' => [
                'totalSent' => $totalSent,
                'totalDelivered' => $totalDelivered,
                'totalRead' => $totalRead,
                'totalFailed' => $totalFailed,
                'deliveryRate' => $deliveryRate,
                'readRate' => $readRate,
            ],
        ]);
    }

    /**
     * 🔄 Reintentar envío de mensaje fallido
     */
    public function whatsappRetryMessage(Request $request, $id)
    {
        $empresa = $request->user()->empresa;
        if (! $empresa) {
            return response()->json(['success' => false, 'error' => 'No active company.'], 404);
        }

        $message = WhatsAppMessage::findOrFail($id);
        $whatsappService = new WhatsAppService($empresa);

        $result = $whatsappService->sendText($message->recipient_phone, $message->message_content, $message->variables ?? []);

        if ($result && (isset($result['success']) && $result['success'] || isset($result['data']))) {
            $message->update([
                'status' => 'sent',
                'sent_at' => now(),
                'retry_count' => $message->retry_count + 1,
            ]);

            return response()->json(['success' => true, 'message' => __('Message re-queued successfully.')]);
        }

        $message->increment('retry_count');

        return response()->json(['success' => false, 'error' => __('Failed to retry message.')], 500);
    }

    /**
     * 📋 Crear plantilla de WhatsApp
     */
    public function whatsappTemplatesStore(Request $request)
    {
        $empresa = $request->user()->empresa;
        if (! $empresa) {
            return back()->with('notification', ['type' => 'error', 'message' => __('No active company.')]);
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:150',
            'categoria' => 'required|string|max:50',
            'contenido' => 'required|string',
            'variables' => 'nullable|array',
            'activo' => 'nullable|boolean',
        ]);

        WhatsAppTemplate::create([
            'empresa_id' => $empresa->id,
            'nombre' => $validated['nombre'],
            'categoria' => $validated['categoria'],
            'contenido' => $validated['contenido'],
            'variables' => $validated['variables'] ?? [],
            'activo' => $validated['activo'] ?? true,
        ]);

        return back()->with('notification', ['type' => 'success', 'message' => __('Template created successfully.')]);
    }

    /**
     * 📋 Actualizar plantilla de WhatsApp
     */
    public function whatsappTemplatesUpdate(Request $request, $id)
    {
        $empresa = $request->user()->empresa;
        if (! $empresa) {
            return back()->with('notification', ['type' => 'error', 'message' => __('No active company.')]);
        }

        $template = WhatsAppTemplate::where('empresa_id', $empresa->id)->findOrFail($id);

        $validated = $request->validate([
            'nombre' => 'required|string|max:150',
            'categoria' => 'required|string|max:50',
            'contenido' => 'required|string',
            'variables' => 'nullable|array',
            'activo' => 'nullable|boolean',
        ]);

        $template->update($validated);

        return back()->with('notification', ['type' => 'success', 'message' => __('Template updated successfully.')]);
    }

    /**
     * 📋 Eliminar plantilla de WhatsApp
     */
    public function whatsappTemplatesDestroy(Request $request, $id)
    {
        $empresa = $request->user()->empresa;
        if (! $empresa) {
            return back()->with('notification', ['type' => 'error', 'message' => __('No active company.')]);
        }

        $template = WhatsAppTemplate::where('empresa_id', $empresa->id)->findOrFail($id);
        $template->delete();

        return back()->with('notification', ['type' => 'success', 'message' => __('Template deleted successfully.')]);
    }

    /**
     * 📢 Obtener destinatarios segmentados para Difusión Masiva (Broadcast)
     */
    public function whatsappBroadcastRecipients(Request $request)
    {
        $empresa = $request->user()->empresa;
        if (! $empresa) {
            return response()->json(['success' => false, 'error' => __('No active company.')], 400);
        }

        $target = $request->query('target', 'presbiteros'); // 'presbiteros' | 'pastores' | 'usuarios'
        $zona = $request->query('zona'); // optional zone filter

        $countryCode = $empresa->pais?->codigo_telefonico ?? '+58';
        $recipients = [];

        if ($target === 'presbiteros') {
            $query = User::where('empresa_id', $empresa->id)
                ->whereHas('roles', function ($q) {
                    $q->whereIn('name', ['Presbitero', 'Presbítero', 'presbitero']);
                });

            if (!empty($zona) && $zona !== 'all') {
                $query->where(function ($q) use ($zona) {
                    $q->where('zona', $zona)
                      ->orWhere('zona_2', $zona);
                });
            }

            $users = $query->orderBy('name')->get();

            foreach ($users as $u) {
                $rawPhone = $u->telefono ?? '';
                $formattedPhone = $rawPhone ? WhatsAppService::formatPhoneNumber($rawPhone, $countryCode) : '';
                $isValidPhone = !empty($formattedPhone) && strlen($formattedPhone) >= 10;
                $zonasList = implode(', ', $u->getZonasList()) ?: __('Unassigned');
                $distritosList = !empty($u->getDistritosList()) 
                    ? implode(', ', array_map(fn($d) => "D. {$d}", $u->getDistritosList()))
                    : __('Unassigned');

                $recipients[] = [
                    'id' => $u->id,
                    'type' => 'user',
                    'name' => $u->name,
                    'email' => $u->email,
                    'phone' => $rawPhone,
                    'formatted_phone' => $formattedPhone,
                    'is_valid_phone' => $isValidPhone,
                    'zonas' => $zonasList,
                    'distritos' => $distritosList,
                    'role' => 'Presbítero',
                ];
            }
        } elseif ($target === 'pastores') {
            $query = Pastor::where('empresa_id', $empresa->id)
                ->where('status', true);

            if (!empty($zona) && $zona !== 'all') {
                $query->where('zona', $zona);
            }

            $pastores = $query->orderBy('nombres')->get();

            foreach ($pastores as $p) {
                $rawPhone = $p->telefono ?? '';
                $formattedPhone = $rawPhone ? WhatsAppService::formatPhoneNumber($rawPhone, $countryCode) : '';
                $isValidPhone = !empty($formattedPhone) && strlen($formattedPhone) >= 10;

                $recipients[] = [
                    'id' => $p->id,
                    'type' => 'pastor',
                    'name' => trim("{$p->nombres} {$p->apellidos}"),
                    'email' => $p->email,
                    'phone' => $rawPhone,
                    'formatted_phone' => $formattedPhone,
                    'is_valid_phone' => $isValidPhone,
                    'zonas' => $p->zona ? "Zona {$p->zona}" : __('Unassigned'),
                    'distritos' => $p->distrito ? "Distrito {$p->distrito}" : __('Unassigned'),
                    'role' => $p->nivel_ministerial ?? 'Pastor',
                    'codigo' => $p->codigo,
                ];
            }
        } else { // 'usuarios'
            $query = User::where('empresa_id', $empresa->id);

            if (!empty($zona) && $zona !== 'all') {
                $query->where(function ($q) use ($zona) {
                    $q->where('zona', $zona)
                      ->orWhere('zona_2', $zona);
                });
            }

            $users = $query->orderBy('name')->get();

            foreach ($users as $u) {
                $rawPhone = $u->telefono ?? '';
                $formattedPhone = $rawPhone ? WhatsAppService::formatPhoneNumber($rawPhone, $countryCode) : '';
                $isValidPhone = !empty($formattedPhone) && strlen($formattedPhone) >= 10;
                $roleName = $u->roles->first()?->name ?? 'Usuario';

                $recipients[] = [
                    'id' => $u->id,
                    'type' => 'user',
                    'name' => $u->name,
                    'email' => $u->email,
                    'phone' => $rawPhone,
                    'formatted_phone' => $formattedPhone,
                    'is_valid_phone' => $isValidPhone,
                    'zonas' => implode(', ', $u->getZonasList()) ?: __('Unassigned'),
                    'distritos' => !empty($u->getDistritosList()) 
                        ? implode(', ', array_map(fn($d) => "D. {$d}", $u->getDistritosList()))
                        : __('Unassigned'),
                    'role' => $roleName,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'target' => $target,
            'count' => count($recipients),
            'valid_count' => count(array_filter($recipients, fn($r) => $r['is_valid_phone'])),
            'recipients' => $recipients,
        ]);
    }

    /**
     * 🚀 Despachar Difusión Masiva de WhatsApp (Broadcast Send)
     */
    public function whatsappBroadcastSend(Request $request)
    {
        $empresa = $request->user()->empresa;
        if (! $empresa) {
            return response()->json(['success' => false, 'error' => __('No active company.')], 400);
        }

        $validated = $request->validate([
            'target_type' => 'required|string|in:presbiteros,pastores,usuarios',
            'recipient_ids' => 'required|array|min:1',
            'recipient_ids.*' => 'required|integer',
            'message_content' => 'required|string|min:3',
            'delay_seconds' => 'nullable|integer|min:5|max:120',
        ]);

        $targetType = $validated['target_type'];
        $recipientIds = $validated['recipient_ids'];
        $messageTemplate = $validated['message_content'];

        $whatsappService = new WhatsAppService($empresa);
        $countryCode = $empresa->pais?->codigo_telefonico ?? '+58';
        $empresaName = $empresa->razon_social ?? $empresa->nombre ?? 'MMM Venezuela';

        $enqueued = 0;
        $errors = [];

        if ($targetType === 'presbiteros' || $targetType === 'usuarios') {
            $recipients = User::where('empresa_id', $empresa->id)
                ->whereIn('id', $recipientIds)
                ->get();

            foreach ($recipients as $recipient) {
                $rawPhone = $recipient->telefono;
                if (empty($rawPhone)) {
                    continue;
                }

                $formattedPhone = WhatsAppService::formatPhoneNumber($rawPhone, $countryCode);
                if (empty($formattedPhone)) {
                    continue;
                }

                $zonas = implode(', ', $recipient->getZonasList()) ?: 'Nacional';
                $distritos = !empty($recipient->getDistritosList()) 
                    ? implode(', ', array_map(fn($d) => "Distrito {$d}", $recipient->getDistritosList()))
                    : 'Nacional';

                $variables = [
                    'nombre' => $recipient->name,
                    'zonas' => $zonas,
                    'zona' => $recipient->zona ?: $zonas,
                    'distritos' => $distritos,
                    'distrito' => $recipient->distrito ?: $distritos,
                    'email' => $recipient->email,
                    'empresa' => $empresaName,
                    'fecha' => now()->translatedFormat('d/m/Y'),
                    'hora' => now()->format('h:i A'),
                    'random' => strtoupper(substr(md5(uniqid()), 0, 6)),
                ];

                $res = $whatsappService->sendText($formattedPhone, $messageTemplate, $variables, false);

                if ($res && !isset($res['error'])) {
                    $enqueued++;
                } else {
                    $errors[] = "Error al despachar a {$recipient->name} ({$formattedPhone})";
                }
            }
        } elseif ($targetType === 'pastores') {
            $recipients = Pastor::where('empresa_id', $empresa->id)
                ->whereIn('id', $recipientIds)
                ->get();

            foreach ($recipients as $recipient) {
                $rawPhone = $recipient->telefono;
                if (empty($rawPhone)) {
                    continue;
                }

                $formattedPhone = WhatsAppService::formatPhoneNumber($rawPhone, $countryCode);
                if (empty($formattedPhone)) {
                    continue;
                }

                $variables = [
                    'nombre' => trim("{$recipient->nombres} {$recipient->apellidos}"),
                    'codigo' => $recipient->codigo ?? 'N/A',
                    'grado' => $recipient->nivel_ministerial ?? 'Pastor',
                    'zona' => $recipient->zona ? "Zona {$recipient->zona}" : 'General',
                    'zonas' => $recipient->zona ? "Zona {$recipient->zona}" : 'General',
                    'distrito' => $recipient->distrito ? "Distrito {$recipient->distrito}" : 'General',
                    'distritos' => $recipient->distrito ? "Distrito {$recipient->distrito}" : 'General',
                    'email' => $recipient->email ?? '',
                    'empresa' => $empresaName,
                    'fecha' => now()->translatedFormat('d/m/Y'),
                    'hora' => now()->format('h:i A'),
                    'random' => strtoupper(substr(md5(uniqid()), 0, 6)),
                ];

                $res = $whatsappService->sendText($formattedPhone, $messageTemplate, $variables, false);

                if ($res && !isset($res['error'])) {
                    $enqueued++;
                } else {
                    $errors[] = "Error al despachar a {$recipient->nombres} ({$formattedPhone})";
                }
            }
        }

        return response()->json([
            'success' => true,
            'enqueued_count' => $enqueued,
            'errors' => $errors,
            'message' => __(':count broadcast messages enqueued successfully.', ['count' => $enqueued]),
        ]);
    }
     /**
     * Actualiza la configuración de la pasarela PayPal.
     */
    public function updatePaypal(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'paypal_active' => 'required|boolean',
            'paypal_mode' => 'required|in:sandbox,live',
            'paypal_client_id' => 'nullable|string|max:255',
            'paypal_client_secret' => 'nullable|string',
        ]);

        $empresa->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('PayPal integration settings updated successfully.'),
        ]);
    }

    /**
     * Actualiza la configuración de la pasarela Mercado Pago.
     */
    public function updateMercadoPago(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'mercadopago_active' => 'required|boolean',
            'mercadopago_mode' => 'required|in:sandbox,live',
            'mercadopago_public_key' => 'nullable|string|max:255',
            'mercadopago_access_token' => 'nullable|string',
        ]);

        $empresa->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Mercado Pago integration settings updated successfully.'),
        ]);
    }

    /**
     * Actualiza la configuración de la pasarela Stripe.
     */
    public function updateStripe(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'stripe_active' => 'required|boolean',
            'stripe_mode' => 'required|in:test,live',
            'stripe_publishable_key' => 'nullable|string|max:255',
            'stripe_secret_key' => 'nullable|string',
            'stripe_webhook_secret' => 'nullable|string',
        ]);

        $empresa->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Stripe integration settings updated successfully.'),
        ]);
    }
}
