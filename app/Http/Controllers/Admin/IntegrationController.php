<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use App\Models\User;
use App\Models\WhatsAppMessage;
use App\Models\WhatsAppTemplate;
use App\Services\ControlAccesoService;
use App\Services\JaakService;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

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

        // Obtener resumen multi-sucursal de WhatsApp en una sola consulta al motor Python
        $sucursales = $empresa->sucursales()->orderBy('id', 'asc')->get();
        $whatsappBranchesTotal = $sucursales->count();
        $whatsappBranchesConnected = 0;
        $whatsappActive = $sucursales->contains(fn ($s) => (bool) $s->whatsapp_active);
        $whatsappConnected = false;

        if ($sucursales->isNotEmpty()) {
            $instanceNames = $sucursales->map(fn ($s) => $s->getWhatsAppInstanceName())->all();
            $summary = WhatsAppService::forSucursal($sucursales->first())->getInstancesSummary($instanceNames);
            if (is_array($summary)) {
                foreach ($summary as $inst) {
                    if (! empty($inst['isConnected'])) {
                        $whatsappBranchesConnected++;
                    }
                }
                $whatsappConnected = $whatsappBranchesConnected > 0;
            } else {
                $whatsappBranchesConnected = $sucursales->where('whatsapp_status', 'connected')->count();
                $whatsappConnected = $whatsappBranchesConnected > 0;
            }
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
            'whatsapp_active' => $whatsappActive,
            'whatsapp_connected' => $whatsappConnected,
            'whatsapp_branches_total' => $whatsappBranchesTotal,
            'whatsapp_branches_connected' => $whatsappBranchesConnected,
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
            'primary_payment_gateway' => $empresa->primary_payment_gateway ?? 'stripe',
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

        $sucursal = $request->user()?->sucursal ?? $empresa?->sucursales()->first();
        $whatsappService = $sucursal ? WhatsAppService::forSucursal($sucursal) : WhatsAppService::forCompany($empresa);

        return inertia('admin/integrations/docs', [
            'empresa_id' => $empresa?->id ?? 1,
            'empresa_nombre' => $empresa?->nombre_comercial ?: ($empresa?->razon_social ?: 'FixSale'),
            'whatsapp_api_url' => $whatsappService->getBaseUrl(),
            'whatsapp_instance' => $sucursal ? $sucursal->getWhatsAppInstanceName() : 'sucursal_1',
            'whatsapp_api_key' => $empresa?->whatsapp_api_key ?? config('whatsapp.api_key', 'my_secret_key_123'),
            'locale' => $currentLocale,
            'translations' => $translations,
        ]);
    }

    /**
     * Resuelve el objetivo de WhatsApp (Estrictamente aislado por Sucursal).
     */
    private function resolveWhatsAppTarget(Request $request): array
    {
        $user = $request->user();
        $empresa = $user->empresa;
        $sucursales = $empresa ? $empresa->sucursales()->orderBy('id', 'asc')->get() : collect();

        // Si la empresa no tiene ninguna sucursal registrada, crear una sucursal Principal por defecto
        if ($empresa && $sucursales->isEmpty()) {
            $defaultSucursal = Sucursal::create([
                'empresa_id' => $empresa->id,
                'nombre' => 'Principal',
                'telefono' => $empresa->telefono ?? null,
                'direccion' => $empresa->direccion ?? 'Sede Principal',
                'status' => true,
                'whatsapp_status' => 'disconnected',
                'whatsapp_active' => true,
            ]);
            $defaultSucursal->updateQuietly([
                'whatsapp_instance' => $defaultSucursal->buildWhatsAppInstanceName(),
            ]);
            $sucursales = collect([$defaultSucursal]);
        }

        $selectedSucursalId = $request->input('sucursal_id')
            ?? $request->query('sucursal_id')
            ?? session('active_whatsapp_sucursal_id')
            ?? $user->sucursal_id
            ?? $sucursales->first()?->id;

        $targetSucursal = $selectedSucursalId ? $sucursales->firstWhere('id', (int) $selectedSucursalId) : $sucursales->first();

        if (! $targetSucursal) {
            $targetSucursal = $sucursales->first();
        }

        if ($targetSucursal) {
            if (empty($targetSucursal->whatsapp_instance)) {
                $targetSucursal->updateQuietly([
                    'whatsapp_instance' => $targetSucursal->buildWhatsAppInstanceName(),
                ]);
            }
            session(['active_whatsapp_sucursal_id' => $targetSucursal->id]);
            $whatsappService = WhatsAppService::forSucursal($targetSucursal);

            return [$targetSucursal, $whatsappService, $empresa, $sucursales, $targetSucursal->id];
        }

        return [null, WhatsAppService::forCompany($empresa), $empresa, $sucursales, null];
    }

    /**
     * Construye el resumen en vivo de todas las sucursales de la empresa para el tablero multi-instancia.
     */
    private function buildSucursalesInstancesSummary($sucursales, WhatsAppService $whatsappService): array
    {
        if ($sucursales->isEmpty()) {
            return [];
        }

        $instanceNames = $sucursales->map(fn ($s) => $s->getWhatsAppInstanceName())->all();
        $liveList = $whatsappService->getInstancesSummary($instanceNames);
        $liveByName = [];
        $engineOnline = is_array($liveList);

        if ($engineOnline) {
            foreach ($liveList as $item) {
                if (! empty($item['instanceName'])) {
                    $liveByName[$item['instanceName']] = $item;
                }
            }
        }

        return $sucursales->map(function (Sucursal $s) use ($liveByName, $engineOnline) {
            $instName = $s->getWhatsAppInstanceName();
            $live = $liveByName[$instName] ?? null;

            $connState = $live['connectionState']
                ?? ($s->whatsapp_status === 'connected' ? 'CONNECTED' : ($s->whatsapp_status === 'qr_ready' ? 'QR_READY' : 'DISCONNECTED'));
            $isConnected = (bool) ($live['isConnected'] ?? ($connState === 'CONNECTED'));
            $phone = $live['phoneNumber'] ?? $s->whatsapp_phone;

            // Sincronizar cambios relevantes de conexión en BD sin generar logs innecesarios
            if ($engineOnline && $live) {
                $mappedStatus = match ($connState) {
                    'CONNECTED' => 'connected',
                    'QR_READY' => 'qr_ready',
                    'CONNECTING', 'RECONNECTING' => 'connecting',
                    default => 'disconnected',
                };
                if ($s->whatsapp_status !== $mappedStatus || ($phone && $s->whatsapp_phone !== $phone)) {
                    $s->updateQuietly([
                        'whatsapp_status' => $mappedStatus,
                        'whatsapp_phone' => $phone ?: $s->whatsapp_phone,
                    ]);
                }
            }

            return [
                'id' => $s->id,
                'sucursal_id' => $s->id,
                'nombre' => $s->nombre,
                'telefono' => $s->telefono,
                'whatsapp_instance' => $instName,
                'whatsapp_phone' => $phone,
                'push_name' => $live['pushName'] ?? null,
                'whatsapp_status' => $isConnected ? 'connected' : strtolower($connState),
                'connection_state' => $connState,
                'is_connected' => $isConnected,
                'whatsapp_active' => (bool) $s->whatsapp_active,
                'sent_today' => (int) ($live['sentToday'] ?? 0),
                'effective_daily_limit' => (int) ($live['effectiveDailyLimit'] ?? ($s->whatsapp_rate_limit ?: 200)),
                'sent_this_hour' => (int) ($live['sentThisHour'] ?? 0),
                'hourly_limit' => (int) ($live['hourlyLimit'] ?? ($s->whatsapp_hourly_limit ?: 25)),
                'queued' => (int) ($live['queued'] ?? 0),
                'queue_paused' => (bool) ($live['queuePaused'] ?? $s->whatsapp_queue_paused ?? false),
                'safety_score' => (int) ($live['safetyScore'] ?? 100),
                'currently_typing_to' => $live['currentlyTypingTo'] ?? null,
                'has_saved_session' => (bool) ($live['hasSavedSession'] ?? false),
            ];
        })->values()->all();
    }

    /**
     * Muestra la interfaz rediseñada de WhatsApp Multi-Sucursal (Python Nativo).
     */
    public function whatsappIndex(Request $request)
    {
        [$target, $whatsappService, $empresa, $sucursales, $activeSucursalId] = $this->resolveWhatsAppTarget($request);

        if (! $empresa) {
            return redirect()->route('dashboard')->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $status = $whatsappService->getStatus();
        $this->syncLocalWhatsAppStatus($target, $status);
        $queueStats = $whatsappService->getQueueStats();
        $instancesSummary = $this->buildSucursalesInstancesSummary($sucursales, $whatsappService);

        $currentLocale = app()->getLocale();
        $translations = file_exists($path = base_path('lang/'.$currentLocale.'.json'))
            ? json_decode(file_get_contents($path) ?: '{}', true)
            : [];

        $paises = Pais::where('activo', true)
            ->orderBy('nombre', 'asc')
            ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico']);

        $templates = WhatsAppTemplate::where('empresa_id', $empresa->id)
            ->orderBy('categoria')
            ->orderBy('nombre')
            ->get();

        return inertia('admin/integrations/whatsapp', [
            'paises' => $paises,
            'templates' => $templates,
            'empresa_id' => $empresa->id,
            'empresa_nombre' => $empresa->nombre_comercial ?: ($empresa->razon_social ?: 'FixSale'),
            'wallet_summary' => app(\App\Services\WhatsAppBillingService::class)->getWalletSummary($empresa->id),
            'sucursales' => $instancesSummary,
            'active_sucursal_id' => $activeSucursalId,
            'target_type' => 'sucursal',
            'target_name' => $target->nombre,
            'whatsapp_api_url' => $whatsappService->getBaseUrl(),
            'whatsapp_instance' => $target->getWhatsAppInstanceName(),
            'whatsapp_active' => (bool) $target->whatsapp_active,
            'whatsapp_phone' => $target->whatsapp_phone,
            'whatsapp_status' => $target->whatsapp_status ?? 'disconnected',
            'whatsapp_rate_limit' => (int) ($target->whatsapp_rate_limit ?: 200),
            'whatsapp_hourly_limit' => (int) ($target->whatsapp_hourly_limit ?: 25),
            'whatsapp_warmup_mode' => (bool) ($target->whatsapp_warmup_mode ?? true),
            'whatsapp_working_hours_enabled' => (bool) ($target->whatsapp_working_hours_enabled ?? true),
            'whatsapp_working_hours_start' => substr((string) ($target->whatsapp_working_hours_start ?: '08:00'), 0, 5),
            'whatsapp_working_hours_end' => substr((string) ($target->whatsapp_working_hours_end ?: '20:00'), 0, 5),
            'whatsapp_simulate_typing' => (bool) ($target->whatsapp_simulate_typing ?? true),
            'whatsapp_typing_min_sec' => (float) ($target->whatsapp_typing_min_sec ?: 2.0),
            'whatsapp_typing_max_sec' => (float) ($target->whatsapp_typing_max_sec ?: 6.0),
            'whatsapp_delay_min_sec' => (int) ($target->whatsapp_delay_min_sec ?: 8),
            'whatsapp_delay_max_sec' => (int) ($target->whatsapp_delay_max_sec ?: 20),
            'whatsapp_batch_size' => (int) ($target->whatsapp_batch_size ?: 10),
            'whatsapp_batch_pause_sec' => (int) ($target->whatsapp_batch_pause_sec ?: 60),
            'whatsapp_verify_number' => (bool) ($target->whatsapp_verify_number ?? true),
            'whatsapp_proxy_url' => $target->whatsapp_proxy_url ?? $empresa->whatsapp_proxy_url ?? '',
            'live_status' => $status,
            'queue_stats' => $queueStats,
            'locale' => $currentLocale,
            'translations' => $translations,
            'is_superadmin' => $request->user()->isSuperAdmin(),
            'subscription_status' => $empresa->subscription_status,
            'trial_ends_at' => $empresa->trial_ends_at?->toIso8601String(),
            'dias_restantes' => $empresa->dias_restantes_suscripcion,
            'is_on_trial' => $empresa->isOnTrial(),
        ]);
    }

    /**
     * Resumen JSON en tiempo real de todas las instancias de sucursales de la empresa.
     */
    public function whatsappInstances(Request $request)
    {
        [$target, $whatsappService, $empresa, $sucursales] = $this->resolveWhatsAppTarget($request);

        if (! $empresa) {
            return response()->json(['success' => false, 'instances' => []], 404);
        }

        $instances = $this->buildSucursalesInstancesSummary($sucursales, $whatsappService);

        return response()->json([
            'success' => true,
            'instances' => $instances,
        ]);
    }

    /**
     * Devuelve el estado en tiempo real (JSON) para polling del QR y conexión de la sucursal activa.
     */
    public function whatsappStatus(Request $request)
    {
        if ($request->header('X-Inertia')) {
            return redirect()->route('admin.integrations.whatsapp.index');
        }

        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'No active branch found.'], 404);
        }

        $status = $whatsappService->getStatus();
        $this->syncLocalWhatsAppStatus($target, $status);
        $queueStats = $whatsappService->getQueueStats();

        return response()->json([
            'success' => true,
            'sucursal_id' => $target->id,
            'instance_name' => $target->getWhatsAppInstanceName(),
            'whatsapp_active' => (bool) $target->whatsapp_active,
            'status' => $status,
            'whatsapp_status' => $target->whatsapp_status ?? 'disconnected',
            'whatsapp_phone' => $target->whatsapp_phone,
            'queue_stats' => $queueStats,
        ]);
    }

    /**
     * Activar / desactivar rápidamente el WhatsApp de una sucursal.
     */
    public function whatsappToggleActive(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'Sucursal no encontrada.'], 404);
        }

        $validated = $request->validate([
            'active' => 'required|boolean',
        ]);

        $target->update([
            'whatsapp_active' => (bool) $validated['active'],
        ]);

        if (! $validated['active']) {
            $whatsappService->stopInstance();
        }

        return response()->json([
            'success' => true,
            'whatsapp_active' => (bool) $target->whatsapp_active,
            'message' => $validated['active']
                ? "WhatsApp activado para {$target->nombre}."
                : "WhatsApp pausado para {$target->nombre}.",
        ]);
    }

    /**
     * Actualiza la configuración de instancia de la sucursal seleccionada.
     */
    public function whatsappUpdate(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'error' => 'Sucursal no encontrada.'], 404);
            }

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'sucursal_id' => 'nullable|integer',
            'whatsapp_api_url' => 'nullable|url|max:255',
            'whatsapp_instance' => 'nullable|string|max:100',
            'whatsapp_active' => 'required|boolean',
            'whatsapp_rate_limit' => 'nullable|integer|min:10|max:5000',
        ]);

        if (! empty($validated['whatsapp_api_url']) && $request->user()->isSuperAdmin() && $empresa->whatsapp_api_url !== $validated['whatsapp_api_url']) {
            $empresa->update(['whatsapp_api_url' => $validated['whatsapp_api_url']]);
        }

        $cleanInstance = ! empty($validated['whatsapp_instance'])
            ? preg_replace('/[^a-zA-Z0-9_-]/', '_', trim($validated['whatsapp_instance']))
            : $target->getWhatsAppInstanceName();

        $updateData = [
            'whatsapp_instance' => $cleanInstance,
            'whatsapp_active' => (bool) $validated['whatsapp_active'],
        ];
        if (isset($validated['whatsapp_rate_limit'])) {
            $updateData['whatsapp_rate_limit'] = (int) $validated['whatsapp_rate_limit'];
        }

        $target->update($updateData);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Configuración guardada para {$target->nombre}.",
                'whatsapp_instance' => $cleanInstance,
                'whatsapp_active' => (bool) $target->whatsapp_active,
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('WhatsApp branch settings updated successfully.'),
        ]);
    }

    /**
     * Genera un nuevo token/API Key interno de WhatsApp (compatibilidad).
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

        $token = 'whatsapp-'.$empresa->id.'-'.substr(bin2hex(random_bytes(16)), 0, 16);
        $empresa->update(['whatsapp_api_key' => $token]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('New WhatsApp API Key generated successfully.'),
        ]);
    }

    /**
     * Sincroniza la empresa con el motor de WhatsApp (compatibilidad).
     */
    public function whatsappSync(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $status = $whatsappService->getStatus();
        $this->syncLocalWhatsAppStatus($target, $status);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Instance synchronized with Python WhatsApp engine.'),
        ]);
    }

    /**
     * Inicia sesión de WhatsApp y genera QR para la sucursal seleccionada.
     */
    public function whatsappConnect(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'Sucursal no encontrada.'], 404);
        }

        if (! $target->whatsapp_active) {
            $target->update(['whatsapp_active' => true]);
        }

        $result = $whatsappService->connect();

        if (! $result || ($result['_error'] ?? null) === 'service_unavailable' || (isset($result['success']) && $result['success'] === false)) {
            $errMsg = $result['error'] ?? 'El motor Python de WhatsApp no responde en '.$whatsappService->getBaseUrl().'. Ejecuta php artisan whatsapp:start o whatsapp-service/run.bat.';
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'error' => $errMsg], 503);
            }

            return back()->with('notification', ['type' => 'error', 'message' => $errMsg]);
        }

        $status = $whatsappService->getStatus();
        $this->syncLocalWhatsAppStatus($target, $status);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Instancia {$target->getWhatsAppInstanceName()} iniciada.",
                'status' => $status,
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Connection process started for ').$target->getWhatsAppInstanceName(),
        ]);
    }

    /**
     * Genera código de emparejamiento de 8 dígitos por número telefónico para la sucursal seleccionada.
     */
    public function whatsappPairPhone(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'Sucursal no encontrada.'], 404);
        }

        $validated = $request->validate([
            'phone' => 'required|string|min:8|max:25',
        ]);

        if (! $target->whatsapp_active) {
            $target->update(['whatsapp_active' => true]);
        }

        $result = $whatsappService->pairPhone($validated['phone']);

        if (! $result || ! ($result['success'] ?? false)) {
            return response()->json([
                'success' => false,
                'error' => $result['error'] ?? 'No se pudo generar el código de emparejamiento de 8 dígitos.',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'already_connected' => (bool) ($result['already_connected'] ?? false),
            'pairing_code' => $result['pairing_code'] ?? $result['pairingCode'] ?? null,
            'phone' => $result['phone'] ?? $validated['phone'],
            'instance_name' => $target->getWhatsAppInstanceName(),
        ]);
    }

    /**
     * Desconecta y elimina la sesión de WhatsApp de la sucursal seleccionada.
     */
    public function whatsappDisconnect(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'Sucursal no encontrada.'], 404);
        }

        $whatsappService->disconnect();

        $updateData = [
            'whatsapp_status' => 'disconnected',
            'whatsapp_phone' => null,
        ];
        if (Schema::hasColumn('sucursales', 'whatsapp_connected_at')) {
            $updateData['whatsapp_connected_at'] = null;
        }
        $target->update($updateData);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Sesión de {$target->nombre} desvinculada correctamente.",
                'status' => $whatsappService->getStatus(),
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Disconnected from WhatsApp (').$whatsappService->getInstanceName().').',
        ]);
    }

    /**
     * Reinicia la sesión y solicita un nuevo código QR para la sucursal seleccionada (Cambiar Línea).
     */
    public function whatsappReconnect(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'Sucursal no encontrada.'], 404);
        }

        if (! $target->whatsapp_active) {
            $target->update(['whatsapp_active' => true]);
        }

        $clearSession = $request->boolean('clear_session', true);
        $result = $whatsappService->reconnect(null, $clearSession);

        if (! $result) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'error' => 'El motor Python no respondió al reiniciar la sesión.'], 503);
            }

            return back()->with('notification', ['type' => 'error', 'message' => 'No se pudo reiniciar la sesión.']);
        }

        $status = $whatsappService->getStatus();
        $this->syncLocalWhatsAppStatus($target, $status);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Sesión reiniciada. Nuevo código QR listo.',
                'status' => $status,
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Reconnection forced successfully for ').$whatsappService->getInstanceName(),
        ]);
    }

    /**
     * Pausar o reanudar la cola de envíos (y restablecer Circuit Breaker) de la sucursal seleccionada.
     */
    public function whatsappToggleQueuePause(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'Sucursal no encontrada.'], 404);
        }

        $validated = $request->validate([
            'paused' => 'required|boolean',
            'reason' => 'nullable|string|max:200',
        ]);

        if (Schema::hasColumn('sucursales', 'whatsapp_queue_paused')) {
            $target->update(['whatsapp_queue_paused' => (bool) $validated['paused']]);
        }

        $res = $whatsappService->toggleQueuePause((bool) $validated['paused'], $validated['reason'] ?? null);

        return response()->json([
            'success' => true,
            'paused' => (bool) $validated['paused'],
            'message' => $validated['paused']
                ? "Cola de envíos pausada para {$target->nombre}."
                : "Cola de envíos reanudada para {$target->nombre}.",
            'stats' => $res['stats'] ?? $whatsappService->getQueueStats(),
        ]);
    }

    /**
     * Cancelar todos los mensajes pendientes en la cola de la sucursal seleccionada.
     */
    public function whatsappClearQueue(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'Sucursal no encontrada.'], 404);
        }

        $res = $whatsappService->clearQueue();

        $q = WhatsAppMessage::where('direction', 'outbound')->whereIn('status', ['queued', 'pending']);
        if (Schema::hasColumn('whatsapp_messages', 'sucursal_id')) {
            $q->where('sucursal_id', $target->id);
        }
        $localCancelled = $q->update([
            'status' => 'cancelled',
            'error_message' => 'Cancelado manualmente desde el panel.',
        ]);

        return response()->json([
            'success' => true,
            'cancelled' => max($localCancelled, (int) ($res['cancelled_count'] ?? 0)),
            'message' => "Cola de {$target->nombre} vaciada correctamente.",
        ]);
    }

    /**
     * Devuelve las estadísticas de la cola de WhatsApp en tiempo real (JSON).
     */
    public function whatsappQueueStats(Request $request)
    {
        if ($request->header('X-Inertia')) {
            return redirect()->route('admin.integrations.whatsapp.index');
        }

        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'No active branch found.'], 404);
        }

        return response()->json([
            'success' => true,
            'stats' => $whatsappService->getQueueStats(),
        ]);
    }

    /**
     * Verifica en vivo si un número telefónico tiene WhatsApp activo (usando la instancia de la sucursal).
     */
    public function whatsappCheckNumber(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'No active branch found.'], 404);
        }

        $validated = $request->validate([
            'phone' => 'required|string|min:6|max:25',
        ]);

        $result = $whatsappService->checkNumber($validated['phone']);

        if (! $result) {
            return response()->json([
                'success' => false,
                'error' => 'No se pudo consultar el número en el motor Python de WhatsApp.',
            ], 503);
        }

        return response()->json([
            'success' => true,
            'result' => $result,
            'data' => $result,
        ]);
    }

    /**
     * Previsualiza variaciones de una plantilla con Spintax y variables dinámicas.
     */
    public function whatsappPreviewSpintax(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa) {
            return response()->json(['success' => false, 'error' => 'No active company found.'], 404);
        }

        $validated = $request->validate([
            'text' => 'nullable|string|max:2000',
            'template' => 'nullable|string|max:2000',
            'count' => 'nullable|integer|min:1|max:20',
            'variables' => 'nullable|array',
        ]);

        $sourceText = $validated['text'] ?? $validated['template'] ?? '';
        if (trim($sourceText) === '') {
            return response()->json(['success' => false, 'error' => 'Texto vacío.'], 422);
        }

        $defaultVars = [
            'cliente' => 'Carlos Mendoza',
            'nombre' => 'Carlos Mendoza',
            'empresa' => $empresa->nombre_comercial ?: ($empresa->razon_social ?: 'FixSale'),
            'sucursal' => $target?->nombre ?? 'Principal',
            'orden' => 'ORD-2026-0042',
            'equipo' => 'iPhone 14 Pro',
            'fecha' => now()->format('d/m/Y'),
            'hora' => now()->format('h:i A'),
            'random' => (string) random_int(1000, 9999),
        ];

        $vars = array_merge($defaultVars, $validated['variables'] ?? []);
        $res = $whatsappService->previewSpintax($sourceText, $validated['count'] ?? 4, $vars);
        $variations = $res['variations'] ?? [];

        return response()->json([
            'success' => true,
            'variations' => $variations,
            'data' => $res,
        ]);
    }

    /**
     * Actualiza las políticas completas Anti-Baneo aisladas para la sucursal seleccionada.
     */
    public function whatsappUpdateAntiBan(Request $request)
    {
        if (! $request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'error' => 'Solo el Super Administrador puede modificar las políticas anti-baneo.',
            ], 403);
        }

        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'Sucursal no encontrada.'], 404);
        }

        $validated = $request->validate([
            'dailyLimit' => 'nullable|integer|min:10|max:5000',
            'hourlyLimit' => 'nullable|integer|min:5|max:500',
            'warmupMode' => 'nullable|boolean',
            'workingHoursEnabled' => 'nullable|boolean',
            'workingHoursStart' => 'nullable|string|max:10',
            'workingHoursEnd' => 'nullable|string|max:10',
            'simulateTyping' => 'nullable|boolean',
            'typingMinSec' => 'nullable|numeric|min:0.5|max:15',
            'typingMaxSec' => 'nullable|numeric|min:1|max:25',
            'delayMinSec' => 'nullable|integer|min:2|max:120',
            'delayMaxSec' => 'nullable|integer|min:3|max:240',
            'batchSize' => 'nullable|integer|min:2|max:100',
            'batchPauseSec' => 'nullable|integer|min:10|max:600',
            'verifyNumber' => 'nullable|boolean',
            'proxyUrl' => 'nullable|string|max:255',
        ]);

        $colMap = [
            'dailyLimit' => 'whatsapp_rate_limit',
            'hourlyLimit' => 'whatsapp_hourly_limit',
            'warmupMode' => 'whatsapp_warmup_mode',
            'workingHoursEnabled' => 'whatsapp_working_hours_enabled',
            'workingHoursStart' => 'whatsapp_working_hours_start',
            'workingHoursEnd' => 'whatsapp_working_hours_end',
            'simulateTyping' => 'whatsapp_simulate_typing',
            'typingMinSec' => 'whatsapp_typing_min_sec',
            'typingMaxSec' => 'whatsapp_typing_max_sec',
            'delayMinSec' => 'whatsapp_delay_min_sec',
            'delayMaxSec' => 'whatsapp_delay_max_sec',
            'batchSize' => 'whatsapp_batch_size',
            'batchPauseSec' => 'whatsapp_batch_pause_sec',
            'verifyNumber' => 'whatsapp_verify_number',
            'proxyUrl' => 'whatsapp_proxy_url',
        ];

        $updateData = [];
        foreach ($colMap as $key => $col) {
            if (array_key_exists($key, $validated) && Schema::hasColumn('sucursales', $col)) {
                $updateData[$col] = $validated[$key];
            }
        }

        if (! empty($updateData)) {
            $target->update($updateData);
        }

        $enginePayload = [
            'dailyLimit' => (int) ($validated['dailyLimit'] ?? $target->whatsapp_rate_limit ?? 200),
            'hourlyLimit' => (int) ($validated['hourlyLimit'] ?? $target->whatsapp_hourly_limit ?? 25),
            'warmupMode' => (bool) ($validated['warmupMode'] ?? $target->whatsapp_warmup_mode ?? true),
            'workingHoursEnabled' => (bool) ($validated['workingHoursEnabled'] ?? $target->whatsapp_working_hours_enabled ?? true),
            'workingHoursStart' => substr((string) ($validated['workingHoursStart'] ?? $target->whatsapp_working_hours_start ?? '08:00'), 0, 5),
            'workingHoursEnd' => substr((string) ($validated['workingHoursEnd'] ?? $target->whatsapp_working_hours_end ?? '20:00'), 0, 5),
            'simulateTyping' => (bool) ($validated['simulateTyping'] ?? $target->whatsapp_simulate_typing ?? true),
            'typingMinSec' => (float) ($validated['typingMinSec'] ?? $target->whatsapp_typing_min_sec ?? 2.0),
            'typingMaxSec' => (float) ($validated['typingMaxSec'] ?? $target->whatsapp_typing_max_sec ?? 6.0),
            'delayMinSec' => (int) ($validated['delayMinSec'] ?? $target->whatsapp_delay_min_sec ?? 8),
            'delayMaxSec' => (int) ($validated['delayMaxSec'] ?? $target->whatsapp_delay_max_sec ?? 20),
            'batchSize' => (int) ($validated['batchSize'] ?? $target->whatsapp_batch_size ?? 10),
            'batchPauseSec' => (int) ($validated['batchPauseSec'] ?? $target->whatsapp_batch_pause_sec ?? 60),
            'verifyNumber' => (bool) ($validated['verifyNumber'] ?? $target->whatsapp_verify_number ?? true),
            'proxyUrl' => $validated['proxyUrl'] ?? $target->whatsapp_proxy_url ?? '',
        ];

        $res = $whatsappService->updateAntiBan($enginePayload);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Políticas Anti-Baneo guardadas para {$target->nombre}.",
                'stats' => $res['stats'] ?? $whatsappService->getQueueStats(),
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Anti-Ban & Messaging limits updated successfully.'),
        ]);
    }

    /**
     * Añade un número a la lista negra de la sucursal seleccionada.
     */
    public function whatsappAddToBlacklist(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'Sucursal no encontrada.'], 404);
        }

        $validated = $request->validate([
            'phone' => 'required|string|min:6|max:25',
            'reason' => 'nullable|string|max:100',
        ]);

        $res = $whatsappService->addToBlacklist($validated['phone'], $validated['reason'] ?? 'MANUAL_BLOCK');

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'data' => $res, 'message' => 'Número agregado a lista negra.']);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Phone number added to blacklist successfully.'),
        ]);
    }

    /**
     * Elimina un número de la lista negra de la sucursal seleccionada.
     */
    public function whatsappRemoveFromBlacklist(Request $request, string $phone)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'Sucursal no encontrada.'], 404);
        }

        $res = $whatsappService->removeFromBlacklist($phone);

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'data' => $res, 'message' => 'Número removido de lista negra.']);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Phone number removed from blacklist.'),
        ]);
    }

    /**
     * Envía un mensaje de prueba humanizado (directo o por cola) desde la sucursal seleccionada.
     */
    public function whatsappSendMessage(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);

        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'Sucursal no encontrada.'], 404);
        }

        $validated = $request->validate([
            'to' => 'nullable|string|min:8|max:25',
            'phone' => 'nullable|string|min:8|max:25',
            'message' => 'required|string|max:2000',
            'variables' => 'nullable|array',
            'sync' => 'nullable|boolean',
            'simulate_typing' => 'nullable|boolean',
            'verify_number' => 'nullable|boolean',
        ]);

        $recipient = trim((string) ($validated['to'] ?? $validated['phone'] ?? ''));
        if ($recipient === '') {
            return response()->json(['success' => false, 'error' => 'Ingresa un número de teléfono destino.'], 422);
        }

        $defaultVars = [
            'cliente' => $request->user()->name ?? 'Cliente',
            'nombre' => $request->user()->name ?? 'Cliente',
            'empresa' => $empresa->nombre_comercial ?: ($empresa->razon_social ?: 'FixSale'),
            'sucursal' => $target->nombre,
            'fecha' => now()->format('d/m/Y'),
            'hora' => now()->format('h:i A'),
            'random' => (string) random_int(1000, 9999),
        ];

        $sync = array_key_exists('sync', $validated) ? (bool) $validated['sync'] : true;
        $options = [
            'recipient_name' => $validated['variables']['cliente'] ?? $validated['variables']['nombre'] ?? 'Prueba en Vivo',
        ];
        if (array_key_exists('simulate_typing', $validated)) {
            $options['simulateTyping'] = (bool) $validated['simulate_typing'];
        }
        if (array_key_exists('verify_number', $validated)) {
            $options['verifyNumber'] = (bool) $validated['verify_number'];
        }

        $result = $whatsappService->sendText(
            $recipient,
            $validated['message'],
            array_merge($defaultVars, $validated['variables'] ?? []),
            $sync,
            null,
            $options
        );

        $ok = $result && (($result['success'] ?? false) || isset($result['messageId']) || isset($result['jobId']));

        if ($request->expectsJson()) {
            if ($ok) {
                $msg = ! empty($result['queued'])
                    ? "Mensaje encolado de forma segura en la cola Anti-Baneo de {$target->nombre}."
                    : "Mensaje enviado exitosamente desde {$target->nombre}.";

                return response()->json([
                    'success' => true,
                    'message' => $msg,
                    'data' => $result,
                ]);
            }

            return response()->json([
                'success' => false,
                'error' => $result['error'] ?? 'No se pudo enviar el mensaje. Verifica que la sucursal esté conectada.',
            ], 400);
        }

        if ($ok) {
            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Test message processed successfully!'),
            ]);
        }

        return back()->with('notification', [
            'type' => 'error',
            'message' => __('Error: ').($result['error'] ?? __('Failed to send message.')),
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
     * Sincroniza el estado local de la sucursal con la respuesta del servicio de WhatsApp.
     */
    private function syncLocalWhatsAppStatus(?\Illuminate\Database\Eloquent\Model $target, $status)
    {
        if (! $target || ! is_array($status) || ($status['_error'] ?? null) === 'service_unavailable') {
            return;
        }

        $updateData = [];
        $state = strtoupper((string) ($status['connectionState'] ?? ''));

        if (! empty($status['isConnected']) || $state === 'CONNECTED') {
            $livePhone = $status['phoneNumber'] ?? null;
            if (! $livePhone && ! empty($status['userJid'])) {
                $livePhone = explode('@', $status['userJid'])[0];
            } elseif (! $livePhone && isset($status['user']['id'])) {
                $livePhone = explode('@', $status['user']['id'])[0];
            }

            $updateData['whatsapp_status'] = 'connected';
            if ($livePhone) {
                $updateData['whatsapp_phone'] = $livePhone;
            }
            $updateData['whatsapp_last_connected'] = now();
            if (Schema::hasColumn('sucursales', 'whatsapp_connected_at') && empty($target->whatsapp_connected_at)) {
                $updateData['whatsapp_connected_at'] = now();
            }
        } elseif (in_array($state, ['CONNECTING', 'RECONNECTING'], true)) {
            $updateData['whatsapp_status'] = 'connecting';
        } elseif ($state === 'QR_READY') {
            $updateData['whatsapp_status'] = 'qr_ready';
        } else {
            $updateData['whatsapp_status'] = 'disconnected';
        }

        if (! empty($updateData)) {
            $target->updateQuietly($updateData);
        }
    }

    /**
     * Diagnóstico y telemetría en vivo del motor Python para la sucursal seleccionada.
     */
    public function whatsappDiagnostic(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);
        if (! $empresa || ! $target) {
            return response()->json(['success' => false, 'error' => 'No active branch found.'], 404);
        }

        $startTime = microtime(true);
        $diag = $whatsappService->getDiagnostic();
        $latencyMs = round((microtime(true) - $startTime) * 1000, 2);

        if (! $diag) {
            return response()->json([
                'success' => false,
                'online' => false,
                'api_url' => $whatsappService->getBaseUrl(),
                'instance' => $target->getWhatsAppInstanceName(),
                'target_name' => $target->nombre,
                'socket_state' => 'OFFLINE',
                'thread_alive' => false,
                'latency_ms' => $latencyMs,
                'error' => 'No se pudo conectar al motor Python en '.$whatsappService->getBaseUrl(),
            ]);
        }

        return response()->json([
            'success' => true,
            'online' => true,
            'api_url' => $whatsappService->getBaseUrl(),
            'engine' => $diag['engine'] ?? 'Python Nativo (Neonize / WhatsMeow)',
            'instance' => $diag['instance'] ?? $target->getWhatsAppInstanceName(),
            'target_name' => $target->nombre,
            'socket_state' => $diag['socket_state'] ?? 'DISCONNECTED',
            'thread_alive' => (bool) ($diag['thread_alive'] ?? false),
            'phone_number' => $diag['phone_number'] ?? $target->whatsapp_phone,
            'push_name' => $diag['push_name'] ?? null,
            'latency_ms' => $latencyMs,
            'memory_usage' => $diag['memory_usage'] ?? 'N/D',
            'session_size_kb' => $diag['session_size_kb'] ?? 0,
            'active_instances_count' => $diag['active_instances_count'] ?? 1,
            'uptime_seconds' => $diag['uptime_seconds'] ?? 0,
            'webhook_url' => $diag['webhook_url'] ?? null,
            'worker_running' => (bool) ($diag['worker_running'] ?? true),
        ]);
    }

    /**
     * Historial y cola de mensajes de WhatsApp (filtrado por empresa y sucursal seleccionada).
     */
    public function whatsappMessages(Request $request)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);
        if (! $empresa) {
            return response()->json(['success' => false, 'messages' => []], 404);
        }

        $hasSucursalCol = Schema::hasColumn('whatsapp_messages', 'sucursal_id');
        $hasEmpresaCol = Schema::hasColumn('whatsapp_messages', 'empresa_id');

        $baseScope = WhatsAppMessage::query();
        if ($hasEmpresaCol) {
            $baseScope->where(function ($q) use ($empresa) {
                $q->where('empresa_id', $empresa->id)->orWhereNull('empresa_id');
            });
        }
        if ($hasSucursalCol && $target && ! $request->boolean('all_branches', false)) {
            $baseScope->where(function ($q) use ($target) {
                $q->where('sucursal_id', $target->id)->orWhereNull('sucursal_id');
            });
        }

        $query = clone $baseScope;

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('recipient_phone', 'like', "%{$search}%")
                    ->orWhere('recipient_name', 'like', "%{$search}%")
                    ->orWhere('message_content', 'like', "%{$search}%")
                    ->orWhere('message_id', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            if ($status === 'queued') {
                $query->whereIn('status', ['queued', 'pending', 'sending']);
            } elseif ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($direction = $request->input('direction')) {
            if ($direction !== 'all') {
                $query->where('direction', $direction);
            }
        }

        $messages = $query->orderBy('created_at', 'desc')->paginate((int) $request->input('per_page', 12));

        $outboundScope = (clone $baseScope)->where('direction', 'outbound');
        $totalSent = (clone $outboundScope)->whereIn('status', ['sent', 'delivered', 'read'])->count();
        $totalDelivered = (clone $outboundScope)->whereIn('status', ['delivered', 'read'])->count();
        $totalRead = (clone $outboundScope)->where('status', 'read')->count();
        $totalFailed = (clone $outboundScope)->where('status', 'failed')->count();
        $totalQueued = (clone $outboundScope)->whereIn('status', ['queued', 'pending', 'sending'])->count();

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
                'totalQueued' => $totalQueued,
                'deliveryRate' => $deliveryRate,
                'readRate' => $readRate,
            ],
        ]);
    }

    /**
     * Reintentar envío de mensaje fallido o cancelado usando la instancia de su sucursal.
     */
    public function whatsappRetryMessage(Request $request, $id)
    {
        [$target, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);
        if (! $empresa) {
            return response()->json(['success' => false, 'error' => 'No active company.'], 404);
        }

        $message = WhatsAppMessage::findOrFail($id);
        $svc = $message->sucursal_id ? WhatsAppService::forSucursal($message->sucursal_id) : $whatsappService;

        $result = $svc->sendText($message->recipient_phone, $message->message_content, $message->variables ?? [], true);

        if ($result && (($result['success'] ?? false) || isset($result['data']))) {
            $message->update([
                'status' => 'sent',
                'sent_at' => now(),
                'error_message' => null,
                'message_id' => $result['messageId'] ?? $result['data']['key']['id'] ?? $message->message_id,
                'retry_count' => $message->retry_count + 1,
            ]);

            return response()->json(['success' => true, 'message' => 'Mensaje reenviado correctamente.']);
        }

        $message->update([
            'retry_count' => $message->retry_count + 1,
            'error_message' => $result['error'] ?? 'Fallo al reintentar el envío.',
        ]);

        return response()->json(['success' => false, 'error' => $result['error'] ?? 'No se pudo reenviar el mensaje.'], 400);
    }

    /**
     * Crear plantilla de WhatsApp con Spintax.
     */
    public function whatsappTemplatesStore(Request $request)
    {
        $empresa = $request->user()->empresa;
        if (! $empresa) {
            return response()->json(['success' => false, 'error' => 'No active company.'], 404);
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:150',
            'categoria' => 'required|string|max:50',
            'contenido' => 'required|string',
            'variables' => 'nullable|array',
            'activo' => 'nullable|boolean',
        ]);

        $template = WhatsAppTemplate::create([
            'empresa_id' => $empresa->id,
            'nombre' => $validated['nombre'],
            'categoria' => $validated['categoria'],
            'contenido' => $validated['contenido'],
            'variables' => $validated['variables'] ?? [],
            'activo' => $validated['activo'] ?? true,
        ]);

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'template' => $template, 'message' => 'Plantilla creada correctamente.']);
        }

        return back()->with('notification', ['type' => 'success', 'message' => __('Template created successfully.')]);
    }

    /**
     * Actualizar plantilla de WhatsApp.
     */
    public function whatsappTemplatesUpdate(Request $request, $id)
    {
        $empresa = $request->user()->empresa;
        if (! $empresa) {
            return response()->json(['success' => false, 'error' => 'No active company.'], 404);
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

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'template' => $template->fresh(), 'message' => 'Plantilla actualizada correctamente.']);
        }

        return back()->with('notification', ['type' => 'success', 'message' => __('Template updated successfully.')]);
    }

    /**
     * Eliminar plantilla de WhatsApp.
     */
    public function whatsappTemplatesDestroy(Request $request, $id)
    {
        $empresa = $request->user()->empresa;
        if (! $empresa) {
            return response()->json(['success' => false, 'error' => 'No active company.'], 404);
        }

        $template = WhatsAppTemplate::where('empresa_id', $empresa->id)->findOrFail($id);
        $template->delete();

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => 'Plantilla eliminada correctamente.']);
        }

        return back()->with('notification', ['type' => 'success', 'message' => __('Template deleted successfully.')]);
    }

    /**
     * Destinatarios segmentados de Fixsale (Clientes, Empleados/Técnicos, Usuarios) para Difusión Segura.
     */
    public function whatsappBroadcastRecipients(Request $request)
    {
        [$targetSucursal, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);
        if (! $empresa) {
            return response()->json(['success' => false, 'error' => __('No active company.')], 400);
        }

        $target = $request->query('target', 'clientes'); // 'clientes' | 'empleados' | 'usuarios'
        $onlyBranch = $request->boolean('only_branch', false);
        $countryCode = $whatsappService->getCountryCode();
        $recipients = [];

        if ($target === 'clientes') {
            $query = Cliente::where('empresa_id', $empresa->id)->where('estado', true);
            if ($onlyBranch && $targetSucursal) {
                $query->where('sucursal_id', $targetSucursal->id);
            }
            $clientes = $query->with('sucursal:id,nombre')->orderBy('nombre')->get();

            foreach ($clientes as $c) {
                $rawPhone = $c->telefono ?? '';
                $formattedPhone = $rawPhone ? WhatsAppService::formatPhoneNumber($rawPhone, $countryCode) : '';
                $isValidPhone = ! empty($formattedPhone) && strlen($formattedPhone) >= 10;

                $recipients[] = [
                    'id' => $c->id,
                    'type' => 'cliente',
                    'name' => $c->nombre,
                    'email' => $c->email,
                    'phone' => $rawPhone,
                    'formatted_phone' => $formattedPhone ? '+'.$formattedPhone : '',
                    'is_valid_phone' => $isValidPhone,
                    'sucursal' => $c->sucursal?->nombre ?? 'General',
                    'role' => $c->saldo_pendiente > 0 ? 'Con crédito' : 'Cliente',
                ];
            }
        } elseif ($target === 'empleados') {
            $query = Empleado::where('empresa_id', $empresa->id)->where('estado', true);
            if ($onlyBranch && $targetSucursal) {
                $query->where('sucursal_id', $targetSucursal->id);
            }
            $empleados = $query->with('sucursal:id,nombre')->orderBy('nombres')->get();

            foreach ($empleados as $e) {
                $rawPhone = $e->telefono ?? '';
                $formattedPhone = $rawPhone ? WhatsAppService::formatPhoneNumber($rawPhone, $countryCode) : '';
                $isValidPhone = ! empty($formattedPhone) && strlen($formattedPhone) >= 10;

                $recipients[] = [
                    'id' => $e->id,
                    'type' => 'empleado',
                    'name' => $e->nombre_completo,
                    'email' => $e->email,
                    'phone' => $rawPhone,
                    'formatted_phone' => $formattedPhone ? '+'.$formattedPhone : '',
                    'is_valid_phone' => $isValidPhone,
                    'sucursal' => $e->sucursal?->nombre ?? 'General',
                    'role' => $e->cargo ?: 'Empleado',
                ];
            }
        } else {
            $query = User::where('empresa_id', $empresa->id)->with(['roles', 'sucursal:id,nombre']);
            if ($onlyBranch && $targetSucursal) {
                $query->where('sucursal_id', $targetSucursal->id);
            }
            $users = $query->orderBy('name')->get();

            foreach ($users as $u) {
                $rawPhone = $u->telefono ?? '';
                $formattedPhone = $rawPhone ? WhatsAppService::formatPhoneNumber($rawPhone, $countryCode) : '';
                $isValidPhone = ! empty($formattedPhone) && strlen($formattedPhone) >= 10;

                $recipients[] = [
                    'id' => $u->id,
                    'type' => 'user',
                    'name' => $u->name,
                    'email' => $u->email,
                    'phone' => $rawPhone,
                    'formatted_phone' => $formattedPhone ? '+'.$formattedPhone : '',
                    'is_valid_phone' => $isValidPhone,
                    'sucursal' => $u->sucursal?->nombre ?? 'General',
                    'role' => $u->roles->first()?->name ?? 'Usuario',
                ];
            }
        }

        return response()->json([
            'success' => true,
            'target' => $target,
            'count' => count($recipients),
            'valid_count' => count(array_filter($recipients, fn ($r) => $r['is_valid_phone'])),
            'recipients' => $recipients,
        ]);
    }

    /**
     * Encolar Difusión Masiva Segura en el worker Anti-Baneo de la sucursal seleccionada.
     */
    public function whatsappBroadcastSend(Request $request)
    {
        [$targetSucursal, $whatsappService, $empresa] = $this->resolveWhatsAppTarget($request);
        if (! $empresa || ! $targetSucursal) {
            return response()->json(['success' => false, 'error' => __('No active branch found.')], 400);
        }

        $validated = $request->validate([
            'target_type' => 'required|string|in:clientes,empleados,usuarios',
            'recipient_ids' => 'required|array|min:1',
            'recipient_ids.*' => 'required|integer',
            'message_content' => 'required|string|min:3|max:2000',
        ]);

        $targetType = $validated['target_type'];
        $recipientIds = $validated['recipient_ids'];
        $messageTemplate = $validated['message_content'];
        $countryCode = $whatsappService->getCountryCode();
        $empresaName = $empresa->nombre_comercial ?: ($empresa->razon_social ?: config('app.name', 'FixSale'));
        $sucursalName = $targetSucursal->nombre;

        $contacts = [];
        if ($targetType === 'clientes') {
            $items = Cliente::where('empresa_id', $empresa->id)->whereIn('id', $recipientIds)->get();
            foreach ($items as $c) {
                $contacts[] = ['name' => $c->nombre, 'phone' => $c->telefono, 'email' => $c->email ?? ''];
            }
        } elseif ($targetType === 'empleados') {
            $items = Empleado::where('empresa_id', $empresa->id)->whereIn('id', $recipientIds)->get();
            foreach ($items as $e) {
                $contacts[] = ['name' => $e->nombre_completo, 'phone' => $e->telefono, 'email' => $e->email ?? ''];
            }
        } else {
            $items = User::where('empresa_id', $empresa->id)->whereIn('id', $recipientIds)->get();
            foreach ($items as $u) {
                $contacts[] = ['name' => $u->name, 'phone' => $u->telefono, 'email' => $u->email ?? ''];
            }
        }

        $enqueued = 0;
        $errors = [];

        foreach ($contacts as $contact) {
            $rawPhone = $contact['phone'] ?? '';
            if (empty($rawPhone)) {
                continue;
            }
            $formattedPhone = WhatsAppService::formatPhoneNumber($rawPhone, $countryCode);
            if (empty($formattedPhone) || strlen($formattedPhone) < 10) {
                continue;
            }

            $variables = [
                'cliente' => $contact['name'],
                'nombre' => $contact['name'],
                'email' => $contact['email'],
                'empresa' => $empresaName,
                'sucursal' => $sucursalName,
                'fecha' => now()->format('d/m/Y'),
                'hora' => now()->format('h:i A'),
                'random' => strtoupper(substr(md5(uniqid('', true)), 0, 6)),
            ];

            // sync = false -> se encola en el worker Anti-Baneo Python con retardos gaussianos y lotes
            $res = $whatsappService->sendText($formattedPhone, $messageTemplate, $variables, false, null, [
                'recipient_name' => $contact['name'],
            ]);

            if ($res && (($res['success'] ?? false) || ! empty($res['queued']))) {
                $enqueued++;
            } else {
                $errors[] = "Error al encolar a {$contact['name']}: ".($res['error'] ?? 'Sin respuesta');
            }
        }

        return response()->json([
            'success' => $enqueued > 0,
            'enqueued_count' => $enqueued,
            'errors' => $errors,
            'message' => "{$enqueued} mensaje(s) encolados de forma segura en la línea de {$sucursalName}.",
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
            'is_primary' => 'nullable|boolean',
        ]);

        if (! empty($validated['is_primary'])) {
            $validated['primary_payment_gateway'] = 'stripe';
        }
        unset($validated['is_primary']);

        $empresa->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Stripe integration settings updated successfully.'),
        ]);
    }

    /**
     * Define la pasarela de pago principal en todo el sistema (SaaS / Suscripciones).
     */
    public function setPrimaryPaymentGateway(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'primary_payment_gateway' => 'required|in:stripe,paypal,mercadopago',
        ]);

        $empresa->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Método de pago principal actualizado a :gateway.', [
                'gateway' => strtoupper($validated['primary_payment_gateway']),
            ]),
        ]);
    }

    /**
     * Prueba la conexión en vivo con la API de Stripe para validar las credenciales.
     */
    public function testStripe(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return response()->json([
                'success' => false,
                'message' => __('No active company associated with your user.'),
            ], 400);
        }

        $secretKey = $request->input('stripe_secret_key') ?: $empresa->stripe_secret_key;

        if (empty($secretKey)) {
            return response()->json([
                'success' => false,
                'message' => __('No se ha proporcionado la clave secreta de Stripe.'),
            ], 422);
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withToken($secretKey)
                ->timeout(10)
                ->get('https://api.stripe.com/v1/balance');

            if ($response->successful()) {
                $data = $response->json();
                return response()->json([
                    'success' => true,
                    'message' => __('¡Conexión con Stripe exitosa! Las credenciales son válidas.'),
                    'livemode' => $data['livemode'] ?? false,
                ]);
            }

            $error = $response->json()['error']['message'] ?? __('Error desconocido al contactar con la API de Stripe.');
            return response()->json([
                'success' => false,
                'message' => __('Error de Stripe: ') . $error,
            ], 400);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => __('Error de conexión: ') . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Webhook receptor de eventos desde el motor nativo de WhatsApp en Python (Neonize).
     */
    public function whatsappWebhook(Request $request)
    {
        $payload = $request->all();
        $event = $payload['event'] ?? null;
        $data = $payload['data'] ?? [];
        $instance = $data['instance'] ?? '';
        $sucursal = $instance ? Sucursal::withoutGlobalScopes()->where('whatsapp_instance', $instance)->first() : null;

        if ($event === 'inbound_message') {
            $sender = $data['from'] ?? '';
            $text = $data['text'] ?? '';
            $msgId = $data['message_id'] ?? null;
            $pushName = $data['push_name'] ?? null;

            if ($sender && ($text || ! empty($data['is_media']))) {
                $attrs = [
                    'message_id' => $msgId,
                    'recipient_phone' => $sender,
                    'recipient_name' => $pushName,
                    'message_content' => $text ?: ($data['filename'] ?? 'Archivo adjunto'),
                    'status' => 'delivered',
                    'direction' => 'inbound',
                    'sent_at' => now(),
                    'delivered_at' => now(),
                    'metadata' => $data,
                ];
                if (Schema::hasColumn('whatsapp_messages', 'empresa_id')) {
                    $attrs['empresa_id'] = $sucursal?->empresa_id;
                    $attrs['sucursal_id'] = $sucursal?->id;
                    $attrs['instance_name'] = $instance ?: null;
                }
                WhatsAppMessage::create($attrs);
            }
        } elseif ($event === 'queue_update') {
            $localId = $data['local_message_id'] ?? null;
            $newStatus = $data['status'] ?? null;
            if ($localId && $newStatus) {
                $update = ['status' => $newStatus];
                if ($newStatus === 'sent') {
                    $update['sent_at'] = now();
                    if (! empty($data['message_id'])) {
                        $update['message_id'] = $data['message_id'];
                    }
                    if (! empty($data['final_message'])) {
                        $update['message_content'] = $data['final_message'];
                    }
                    $update['error_message'] = null;
                } elseif ($newStatus === 'failed') {
                    $update['error_message'] = $data['error'] ?? 'Error enviando mensaje.';
                }
                WhatsAppMessage::where('id', $localId)->update($update);

                if ($newStatus === 'failed') {
                    $failedMsg = WhatsAppMessage::find($localId);
                    if ($failedMsg && $failedMsg->empresa_id && ! empty($failedMsg->metadata['billing_source'])) {
                        app(\App\Services\WhatsAppBillingService::class)->refund(
                            (int) $failedMsg->empresa_id,
                            (string) $failedMsg->metadata['billing_source'],
                            (float) ($failedMsg->metadata['billing_cost'] ?? $failedMsg->cost ?? 0),
                            $failedMsg->id,
                            (string) ($update['error_message'] ?? 'Fallo en envío')
                        );
                    }
                }
            }
        } elseif ($event === 'queue_bulk_cancelled') {
            $ids = $data['local_message_ids'] ?? [];
            if (! empty($ids)) {
                WhatsAppMessage::whereIn('id', $ids)->update([
                    'status' => 'cancelled',
                    'error_message' => 'Cancelado desde el panel.',
                ]);
                $billingService = app(\App\Services\WhatsAppBillingService::class);
                foreach (WhatsAppMessage::whereIn('id', $ids)->get() as $cancelledMsg) {
                    if ($cancelledMsg->empresa_id && ! empty($cancelledMsg->metadata['billing_source'])) {
                        $billingService->refund(
                            (int) $cancelledMsg->empresa_id,
                            (string) $cancelledMsg->metadata['billing_source'],
                            (float) ($cancelledMsg->metadata['billing_cost'] ?? $cancelledMsg->cost ?? 0),
                            $cancelledMsg->id,
                            'Cancelado en cola'
                        );
                    }
                }
            }
        } elseif ($event === 'receipt') {
            $ids = $data['message_ids'] ?? [];
            $type = $data['receipt_type'] ?? '';
            if (! empty($ids)) {
                $status = ($type === 'read') ? 'read' : 'delivered';
                $update = ['status' => $status];
                if ($type === 'read') {
                    $update['read_at'] = now();
                    $update['delivered_at'] = now();
                } else {
                    $update['delivered_at'] = now();
                }
                WhatsAppMessage::whereIn('message_id', $ids)->update($update);
            }
        } elseif ($event === 'status' && $sucursal) {
            $status = $data['status'] ?? '';
            $phone = $data['phone'] ?? null;
            $mapped = match ($status) {
                'connected' => 'connected',
                'qr_ready' => 'qr_ready',
                'reconnecting', 'connecting' => 'connecting',
                default => 'disconnected',
            };
            $upd = ['whatsapp_status' => $mapped];
            if ($phone) {
                $upd['whatsapp_phone'] = $phone;
            }
            if ($mapped === 'connected') {
                $upd['whatsapp_last_connected'] = now();
                if (Schema::hasColumn('sucursales', 'whatsapp_connected_at') && empty($sucursal->whatsapp_connected_at)) {
                    $upd['whatsapp_connected_at'] = now();
                }
            }
            if (array_key_exists('paused', $data) && Schema::hasColumn('sucursales', 'whatsapp_queue_paused')) {
                $upd['whatsapp_queue_paused'] = (bool) $data['paused'];
            }
            $sucursal->updateQuietly($upd);
        }

        return response()->json(['success' => true]);
    }
}

