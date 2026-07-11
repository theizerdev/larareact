<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Pais;
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
            return redirect()->route('admin.dashboard')->with('notification', [
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
        ]);
    }

    /**
     * Muestra la página de navegación Mapbox.
     */
    public function mapboxMap(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return redirect()->route('admin.dashboard')->with('notification', [
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
            return redirect()->route('admin.dashboard')->with('notification', [
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
     * Muestra la interfaz de configuración y estado de WhatsApp.
     */
    public function whatsappIndex(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (! $empresa) {
            return redirect()->route('admin.dashboard')->with('notification', [
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
            'whatsapp_active' => 'required|boolean',
            'whatsapp_rate_limit' => 'required|integer|min:1|max:1000',
        ]);

        $empresa->update([
            'whatsapp_api_url' => $validated['whatsapp_api_url'],
            'whatsapp_active' => $validated['whatsapp_active'],
            'whatsapp_rate_limit' => $validated['whatsapp_rate_limit'],
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('WhatsApp settings updated successfully.'),
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

        if ($result && isset($result['success']) && $result['success']) {
            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Connection process started.'),
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
     * Sincroniza el estado local de la empresa con la respuesta del servicio de WhatsApp.
     */
    private function syncLocalWhatsAppStatus(Empresa $empresa, $status)
    {
        if ($status && isset($status['isConnected']) && $status['isConnected']) {
            $livePhone = null;
            if (isset($status['user']['id'])) {
                $livePhone = explode('@', $status['user']['id'])[0];
            }

            $empresa->update([
                'whatsapp_status' => 'connected',
                'whatsapp_phone' => $livePhone ?? $empresa->whatsapp_phone,
                'whatsapp_last_connected' => now(),
            ]);
        } elseif ($status && isset($status['connectionState']) && $status['connectionState'] === 'connecting') {
            $empresa->update([
                'whatsapp_status' => 'connecting',
            ]);
        } elseif ($status && isset($status['connectionState']) && $status['connectionState'] === 'qr_ready') {
            $empresa->update([
                'whatsapp_status' => 'qr_ready',
            ]);
        } else {
            $empresa->update([
                'whatsapp_status' => 'disconnected',
            ]);
        }
    }
}
