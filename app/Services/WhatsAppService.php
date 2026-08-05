<?php

namespace App\Services;

use App\Models\Empresa;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private $baseUrl;

    private $apiKey;

    private $companyId;

    private $instanceName;

    private $timeout;

    public function setTimeout(int $seconds): self
    {
        $this->timeout = $seconds;

        return $this;
    }

    /**
     * Constructor del servicio WhatsApp
     *
     * @param  Empresa|int|null  $empresa  - Empresa, ID de empresa, o null para usar la del usuario actual
     */
    public function __construct($empresa = null)
    {
        $this->baseUrl = config('whatsapp.api_url', 'http://166.1.85.56:3000');
        $this->timeout = config('whatsapp.timeout', 30);

        if (is_array($empresa)) {
            $this->resolveCredentials($empresa);
        } else {
            $this->resolveCompany($empresa);
        }
    }

    public static function forCredentials(array $credentials): self
    {
        return new self($credentials);
    }

    /**
     * Resuelve las credenciales provistas directamente
     */
    private function resolveCredentials(array $credentials): void
    {
        if (! empty($credentials['api_url'])) {
            $this->baseUrl = rtrim($credentials['api_url'], '/');
        }

        $this->timeout = $credentials['timeout'] ?? $this->timeout;
        $this->companyId = $credentials['empresa_id'] ?? $credentials['company_id'] ?? 1;
        $this->apiKey = $credentials['api_key'] ?? $credentials['apiKey'] ?? null;
        $this->instanceName = $credentials['instance'] ?? $credentials['whatsapp_instance'] ?? null;

        if (! $this->apiKey && $this->companyId) {
            $empresaModel = Empresa::find($this->companyId);
            if ($empresaModel) {
                $this->apiKey = $empresaModel->whatsapp_api_key;
                if (! $this->instanceName && ! empty($empresaModel->whatsapp_instance)) {
                    $this->instanceName = $empresaModel->whatsapp_instance;
                }
            }
        }

        if (! $this->apiKey) {
            $this->apiKey = config('whatsapp.api_key', 'test-api-key-vargas-centro');
        }

        if (! $this->instanceName) {
            $this->instanceName = 'empresa_'.$this->companyId;
        }
    }

    /**
     * Resuelve la empresa y configura la API key e instancia
     */
    private function resolveCompany($empresa = null): void
    {
        $empresaModel = null;

        if ($empresa instanceof Empresa) {
            $empresaModel = $empresa;
        } elseif (is_numeric($empresa)) {
            $empresaModel = Empresa::find($empresa);
        } elseif (auth()->check() && auth()->user()->empresa_id) {
            $empresaModel = Empresa::find(auth()->user()->empresa_id);
        }

        if (! $empresaModel) {
            $empresaModel = Empresa::find(1);
        }

        if ($empresaModel) {
            $this->companyId = $empresaModel->id;
            $this->apiKey = $empresaModel->whatsapp_api_key ?? config('whatsapp.api_key', 'test-api-key-vargas-centro');
            if (! empty($empresaModel->whatsapp_api_url)) {
                $this->baseUrl = rtrim($empresaModel->whatsapp_api_url, '/');
            }
            $this->instanceName = ! empty($empresaModel->whatsapp_instance)
                ? $empresaModel->whatsapp_instance
                : 'empresa_'.$empresaModel->id;

            return;
        }

        $this->companyId = 1;
        $this->apiKey = config('whatsapp.api_key', 'test-api-key-vargas-centro');
        $this->instanceName = 'empresa_1';
    }

    /**
     * Obtiene los headers necesarios para la API
     */
    private function getHeaders(): array
    {
        return [
            'X-API-Key' => $this->apiKey,
            'X-Company-Id' => (string) $this->companyId,
            'Content-Type' => 'application/json',
        ];
    }

    public static function forCompany($empresa): self
    {
        return new self($empresa);
    }

    public static function forCompanyOwn($empresa): self
    {
        return new self($empresa);
    }

    public function getCompanyId(): int
    {
        return $this->companyId;
    }

    public function getInstanceName(): string
    {
        return $this->instanceName;
    }

    /**
     * Obtener el estado de la conexión WhatsApp
     */
    public function getStatus()
    {
        try {
            $url = "{$this->baseUrl}/api/instance/{$this->instanceName}/status";
            $response = Http::timeout(10)
                ->withHeaders($this->getHeaders())
                ->get($url);

            if ($response->successful()) {
                $data = $response->json();
                $status = $data['status'] ?? 'close';
                $isConnected = ($status === 'open');

                return [
                    'instanceName' => $data['instanceName'] ?? $this->instanceName,
                    'status' => $status,
                    'isConnected' => $isConnected,
                    'connectionState' => $isConnected ? 'connected' : ($status === 'qr' ? 'qr_ready' : $status),
                    'qrCode' => $data['qrDataUrl'] ?? null,
                    'token' => $data['token'] ?? null,
                    'user' => [
                        'id' => $data['userJid'] ?? null,
                    ],
                    'raw' => $data,
                ];
            }

            // Si la instancia aún no existe en el manager de Node (404), la declaramos como desconectada
            if ($response->status() === 404) {
                return [
                    'instanceName' => $this->instanceName,
                    'status' => 'close',
                    'isConnected' => false,
                    'connectionState' => 'disconnected',
                    'qrCode' => null,
                    'user' => null,
                ];
            }

            Log::warning('WhatsApp Status HTTP Error', [
                'company_id' => $this->companyId,
                'instance' => $this->instanceName,
                'status' => $response->status(),
            ]);

            return null;
        } catch (ConnectionException $e) {
            Log::error('WhatsApp Service Unavailable: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'url' => $this->baseUrl,
                'instance' => $this->instanceName,
            ]);

            return ['_error' => 'service_unavailable'];
        } catch (\Exception $e) {
            Log::error('WhatsApp Status Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'instance' => $this->instanceName,
            ]);

            return null;
        }
    }

    /**
     * Obtener código QR para conectar WhatsApp
     */
    public function getQRCode()
    {
        $status = $this->getStatus();
        if ($status && isset($status['qrCode'])) {
            return ['qrCode' => $status['qrCode']];
        }

        return null;
    }

    /**
     * Enviar mensaje de texto
     */
    public function sendMessage(string $to, string $message, bool $isWelcome = false)
    {
        try {
            $url = "{$this->baseUrl}/api/message/send-text/{$this->instanceName}";
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->post($url, [
                    'to' => $to,
                    'message' => $message,
                ]);

            if ($response->successful()) {
                Log::info('WhatsApp mensaje enviado', [
                    'company_id' => $this->companyId,
                    'instance' => $this->instanceName,
                    'to' => $to,
                ]);

                return $response->json();
            } else {
                Log::error('WhatsApp Send Message Failed', [
                    'company_id' => $this->companyId,
                    'instance' => $this->instanceName,
                    'to' => $to,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }
        } catch (\Exception $e) {
            Log::error('WhatsApp Send Message Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'instance' => $this->instanceName,
                'to' => $to,
            ]);

            return null;
        }
    }

    /**
     * Enviar documento o imagen vía URL
     */
    public function sendMedia(string $to, string $mediaUrl, string $caption = '')
    {
        try {
            $url = "{$this->baseUrl}/api/message/send-media/{$this->instanceName}";
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->post($url, [
                    'to' => $to,
                    'url' => $mediaUrl,
                    'caption' => $caption,
                    'message' => $caption,
                    'isWelcome' => true,
                ]);

            if ($response->successful()) {
                Log::info('WhatsApp documento enviado exitosamente', [
                    'company_id' => $this->companyId,
                    'to' => $to,
                    'response' => $response->json(),
                ]);
                return $response->json();
            }

            Log::error('WhatsApp Send Document Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('WhatsApp Send Media Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'instance' => $this->instanceName,
                'to' => $to,
            ]);

            return null;
        }
    }

    public function sendDocument(string $to, string $filePath, string $caption = '')
    {
        return $this->sendMedia($to, $filePath, $caption);
    }

    public function sendImage(string $to, string $filePath, string $caption = '')
    {
        return $this->sendMedia($to, $filePath, $caption);
    }

    /**
     * Crear una nueva instancia en el motor de WhatsApp (Node.js)
     */
    public function createInstance(?string $name = null, ?string $customToken = null)
    {
        $instanceName = $name ?? $this->instanceName;
        $token = $customToken ?? $this->apiKey;
        $masterKey = config('whatsapp.api_key', 'cbd21569-e530-427f-993b-4abcb2a08f81');

        try {
            $url = "{$this->baseUrl}/api/instance/create";
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'x-api-key' => $masterKey,
                    'X-API-Key' => $masterKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($url, [
                    'name' => $instanceName,
                    'token' => $token,
                ]);

            if ($response->successful()) {
                Log::info("Instancia de WhatsApp '{$instanceName}' creada/inicializada exitosamente.", [
                    'company_id' => $this->companyId,
                    'response' => $response->json(),
                ]);
                return $response->json();
            }

            Log::warning("No se pudo crear la instancia de WhatsApp '{$instanceName}' (HTTP {$response->status()})", [
                'company_id' => $this->companyId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('WhatsApp Create Instance Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'instance' => $instanceName,
            ]);

            return null;
        }
    }

    /**
     * Iniciar / Encender una instancia
     */
    public function startInstance(?string $name = null)
    {
        $instanceName = $name ?? $this->instanceName;
        try {
            $url = "{$this->baseUrl}/api/instance/{$instanceName}/start";
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->post($url);

            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Detener / Apagar una instancia
     */
    public function stopInstance(?string $name = null)
    {
        $instanceName = $name ?? $this->instanceName;
        try {
            $url = "{$this->baseUrl}/api/instance/{$instanceName}/stop";
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->post($url);

            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Alias para enviar mensajes de texto simple
     */
    public function sendText(string $to, string $message, ?string $instance = null)
    {
        if ($instance) {
            $this->instanceName = $instance;
        }

        return $this->sendMessage($to, $message);
    }

    /**
     * Conectar / Crear instancia en el servidor de WhatsApp
     */
    public function connect()
    {
        return $this->createInstance();
    }

    /**
     * Desconectar / Eliminar instancia
     */
    public function disconnect()
    {
        try {
            $url = "{$this->baseUrl}/api/instance/{$this->instanceName}";
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->delete($url);

            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            Log::error('WhatsApp Disconnect Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'instance' => $this->instanceName,
            ]);

            return null;
        }
    }

    public function reconnect()
    {
        return $this->connect();
    }

    public function removeSession()
    {
        return $this->disconnect();
    }

    public function isConfigured(): bool
    {
        return ! empty($this->apiKey) && ! empty($this->companyId);
    }
}
