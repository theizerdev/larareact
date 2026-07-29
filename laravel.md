# 🐘 Tutorial: Cómo integrar el Motor de WhatsApp con Laravel

Este tutorial explica paso a paso cómo integrar esta API REST de WhatsApp Multi-Instancia en tu aplicación **Laravel**, tanto para **crear e interactuar con el Código QR**, **enviar mensajes** desde tu backend, como para **recibir mensajes entrantes** en tiempo real.

---

## 🎯 Requisitos Previos

1. Tener corriendo esta API de WhatsApp (localmente en `http://localhost:3000` o en tu servidor/Docker).
2. Tener tu proyecto Laravel (Laravel 9, 10 o 11+).

---

## 🛠️ Paso 1: Configurar Variables de Entorno en Laravel (`.env`)

Añade las siguientes variables al archivo `.env` de tu proyecto Laravel:

```env
# Configuración del Motor de WhatsApp API
WHATSAPP_API_URL=http://localhost:3000
WHATSAPP_API_KEY=my_secret_key_123
WHATSAPP_DEFAULT_INSTANCE=ventas
```

Añade los valores en `config/services.php`:

```php
// config/services.php
'whatsapp' => [
    'url' => env('WHATSAPP_API_URL', 'http://localhost:3000'),
    'key' => env('WHATSAPP_API_KEY'),
    'instance' => env('WHATSAPP_DEFAULT_INSTANCE', 'ventas'),
],
```

---

## 📦 Paso 2: Crear el Servicio `WhatsAppService` en Laravel

Crea la clase `app/Services/WhatsAppService.php` para centralizar todas las llamadas HTTP hacia la API de WhatsApp:

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $baseUrl;
    protected string $apiKey;
    protected string $defaultInstance;

    public function __construct()
    {
        $this->baseUrl = config('services.whatsapp.url');
        $this->apiKey = config('services.whatsapp.key');
        $this->defaultInstance = config('services.whatsapp.instance');
    }

    /**
     * Crear una nueva instancia de WhatsApp o inicializarla
     */
    public function createInstance(string $name, ?string $customToken = null): array
    {
        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
        ])->post("{$this->baseUrl}/api/instance/create", [
            'name' => $name,
            'token' => $customToken,
        ]);

        return $response->json();
    }

    /**
     * Obtener el estado actual y la imagen en Base64 del código QR
     */
    public function getStatus(string $name): array
    {
        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
        ])->get("{$this->baseUrl}/api/instance/{$name}/status");

        return $response->json();
    }

    /**
     * Enviar mensaje de texto simple por WhatsApp
     */
    public function sendText(string $to, string $message, ?string $instance = null): array
    {
        $instanceName = $instance ?? $this->defaultInstance;

        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
        ])->post("{$this->baseUrl}/api/message/send-text/{$instanceName}", [
            'to' => $to,
            'message' => $message,
        ]);

        if ($response->failed()) {
            Log::error("Error enviando WhatsApp a {$to}", [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
        }

        return $response->json();
    }

    /**
     * Enviar archivo multimedia (Imagen, PDF, Audio, Video) vía URL
     */
    public function sendMedia(string $to, string $mediaUrl, string $caption = '', ?string $instance = null): array
    {
        $instanceName = $instance ?? $this->defaultInstance;

        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
        ])->post("{$this->baseUrl}/api/message/send-media/{$instanceName}", [
            'to' => $to,
            'mediaUrl' => $mediaUrl,
            'caption' => $caption,
        ]);

        return $response->json();
    }

    /**
     * Iniciar / Encender una instancia
     */
    public function startInstance(string $name): array
    {
        return Http::withHeaders([
            'x-api-key' => $this->apiKey,
        ])->post("{$this->baseUrl}/api/instance/{$name}/start")->json();
    }

    /**
     * Detener / Apagar una instancia
     */
    public function stopInstance(string $name): array
    {
        return Http::withHeaders([
            'x-api-key' => $this->apiKey,
        ])->post("{$this->baseUrl}/api/instance/{$name}/stop")->json();
    }
}
```

---

## 📲 Paso 3: Crear Instancia y Mostrar el Código QR en Laravel (Vista Blade)

Para que tus usuarios o administradores en Laravel puedan vincular una cuenta escaneando el código QR:

### 1. Controlador en Laravel (`app/Http/Controllers/WhatsAppInstanceController.php`):

```php
<?php

namespace App\Http\Controllers;

use App\Services\WhatsAppService;
use Illuminate\Http\Request;

class WhatsAppInstanceController extends Controller
{
    protected WhatsAppService $whatsapp;

    public function __construct(WhatsAppService $whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    // Muestra la pantalla para crear o escanear el QR de una instancia
    public function showQr(Request $request, string $instanceName)
    {
        // 1. Crear la instancia si no existe
        $this->whatsapp->createInstance($instanceName);

        // 2. Obtener el estado actual (contiene el qrDataUrl si está en estado 'qr')
        $statusData = $this->whatsapp->getStatus($instanceName);

        return view('whatsapp.qr', [
            'instanceName' => $instanceName,
            'status' => $statusData['status'] ?? 'close',
            'qrDataUrl' => $statusData['qrDataUrl'] ?? null,
            'userJid' => $statusData['userJid'] ?? null,
        ]);
    }

    // Endpoint AJAX para consultar si el usuario ya escaneó el QR
    public function checkStatus(string $instanceName)
    {
        $statusData = $this->whatsapp->getStatus($instanceName);

        return response()->json([
            'status' => $statusData['status'] ?? 'close',
            'qrDataUrl' => $statusData['qrDataUrl'] ?? null,
            'userJid' => $statusData['userJid'] ?? null,
        ]);
    }
}
```

### 2. Registrar Rutas en `routes/web.php`:

```php
use App\Http\Controllers\WhatsAppInstanceController;

Route::get('/whatsapp/instance/{instanceName}/qr', [WhatsAppInstanceController::class, 'showQr'])->name('whatsapp.qr');
Route::get('/whatsapp/instance/{instanceName}/status', [WhatsAppInstanceController::class, 'checkStatus'])->name('whatsapp.status');
```

### 3. Vista Blade con actualización automática del QR (`resources/views/whatsapp/qr.blade.php`):

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Vincular WhatsApp - {{ $instanceName }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
    <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
        <h1 class="text-2xl font-bold">Vincular Cuenta de WhatsApp</h1>
        <p class="text-gray-400 text-sm">Instancia: <strong class="text-emerald-400">{{ $instanceName }}</strong></p>

        <!-- Contenedor del QR o Estado -->
        <div id="qr-container" class="flex flex-col items-center justify-center bg-gray-950 p-6 rounded-xl border border-gray-700 min-h-[280px]">
            @if($status === 'open')
                <div class="text-emerald-400 space-y-2">
                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    <h3 class="text-lg font-bold">¡WhatsApp Conectado!</h3>
                    <p class="text-xs text-gray-400 font-mono">{{ $userJid }}</p>
                </div>
            @elseif($qrDataUrl)
                <img id="qr-image" src="{{ $qrDataUrl }}" alt="Código QR de WhatsApp" class="w-64 h-64 rounded-lg shadow-md mb-3" />
                <p class="text-xs text-amber-400 font-medium animate-pulse">Escanea el código QR desde tu app de WhatsApp</p>
            @else
                <p class="text-gray-400 text-sm animate-pulse">Cargando código QR...</p>
            @endif
        </div>

        <p class="text-xs text-gray-500">Abre WhatsApp en tu teléfono > Dispositivos vinculados > Vincular un dispositivo</p>
    </div>

    <!-- Script JS que consulta el estado cada 3 segundos -->
    <script>
        const instanceName = "{{ $instanceName }}";
        
        function pollStatus() {
            fetch(`/whatsapp/instance/${instanceName}/status`)
                .then(res => res.json())
                .then(data => {
                    const container = document.getElementById('qr-container');

                    if (data.status === 'open') {
                        container.innerHTML = `
                            <div class="text-emerald-400 space-y-2">
                                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                <h3 class="text-lg font-bold">¡WhatsApp Conectado!</h3>
                                <p class="text-xs text-gray-400 font-mono">${data.userJid || ''}</p>
                            </div>`;
                    } else if (data.status === 'qr' && data.qrDataUrl) {
                        container.innerHTML = `
                            <img src="${data.qrDataUrl}" alt="Código QR de WhatsApp" class="w-64 h-64 rounded-lg shadow-md mb-3" />
                            <p class="text-xs text-amber-400 font-medium animate-pulse">Escanea el código QR desde tu app de WhatsApp</p>`;
                        setTimeout(pollStatus, 3000); // Seguir consultando
                    } else {
                        setTimeout(pollStatus, 3000); // Reintentar si está conectando
                    }
                })
                .catch(() => setTimeout(pollStatus, 3000));
        }

        // Iniciar polling si no está conectado aún
        @if($status !== 'open')
            setTimeout(pollStatus, 3000);
        @endif
    </script>
</body>
</html>
```

---

## 💻 Paso 4: Ejemplo de Envío de Mensajes desde Controlador

```php
<?php

namespace App\Http\Controllers;

use App\Services\WhatsAppService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    protected WhatsAppService $whatsapp;

    public function __construct(WhatsAppService $whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    // Enviar confirmación de pedido por WhatsApp
    public function sendOrderConfirmation(Request $request)
    {
        $phone = '5215555555555'; // Número con código de país sin +
        $message = "🎉 ¡Hola Juan! Tu pedido #1024 ha sido confirmado y está en preparación.";

        $result = $this->whatsapp->sendText($phone, $message);

        return response()->json([
            'message' => 'Notificación enviada por WhatsApp',
            'data' => $result,
        ]);
    }

    // Enviar factura en PDF
    public function sendInvoice(Request $request)
    {
        $phone = '5215555555555';
        $pdfUrl = 'https://tusitio.com/facturas/factura-1024.pdf';

        $result = $this->whatsapp->sendMedia($phone, $pdfUrl, 'Adjuntamos tu factura digital.');

        return response()->json($result);
    }
}
```

---

## 📥 Paso 5: Recibir Mensajes Entrantes vía Webhook en Laravel

### 1. Registrar la Ruta en `routes/api.php`:
```php
use App\Http\Controllers\WhatsAppWebhookController;

Route::post('/webhooks/whatsapp', [WhatsAppWebhookController::class, 'handleIncoming']);
```

### 2. Crear el Controlador del Webhook (`app/Http/Controllers/WhatsAppWebhookController.php`):
```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    public function handleIncoming(Request $request)
    {
        $payload = $request->all();

        Log::info('📥 Mensaje de WhatsApp Entrante:', $payload);

        $from = $payload['from'] ?? null; // Ej: 5215555555555@c.us
        $body = $payload['body'] ?? '';
        $instanceName = $payload['instanceName'] ?? '';

        // Ejemplo: Si el cliente escribe "Hola", responder con Bot
        if (strtolower(trim($body)) === 'hola') {
            app(\App\Services\WhatsAppService::class)->sendText(
                $from,
                "¡Hola! Bienvenido a nuestro servicio de soporte automático.",
                $instanceName
            );
        }

        return response()->json(['status' => 'success']);
    }
}
```

---

## 🔥 Resumen de Métodos del Servicio `WhatsAppService`

| Acción | Código PHP |
| :--- | :--- |
| **Crear Instancia** | `$whatsapp->createInstance('ventas')` |
| **Obtener QR y Estado** | `$whatsapp->getStatus('ventas')` |
| **Enviar Texto** | `$whatsapp->sendText('5215555555555', 'Hola', 'ventas')` |
| **Enviar Imagen/PDF** | `$whatsapp->sendMedia('5215555555555', 'https://...', 'Leyenda', 'ventas')` |
| **Iniciar Instancia** | `$whatsapp->startInstance('ventas')` |
| **Detener Instancia** | `$whatsapp->stopInstance('ventas')` |

¡Con esto tienes una solución completa para crear instancias, renderizar el código QR en vistas Blade y enviar/recibir mensajes en Laravel! 🚀
