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

    private $empresaModel;

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
        $this->baseUrl = config('whatsapp.api_url', 'http://82.165.213.124:8092');
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

        if ($this->companyId) {
            $this->empresaModel = Empresa::with(['pais', 'paisTelefono'])->find($this->companyId);
            if ($this->empresaModel) {
                if (! $this->apiKey) {
                    $this->apiKey = $this->empresaModel->whatsapp_api_key;
                }
                if (! $this->instanceName && ! empty($this->empresaModel->whatsapp_instance)) {
                    $this->instanceName = $this->empresaModel->whatsapp_instance;
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
            $empresaModel = $empresa->relationLoaded('pais') && $empresa->relationLoaded('paisTelefono')
                ? $empresa
                : $empresa->load(['pais', 'paisTelefono']);
        } elseif (is_numeric($empresa)) {
            $empresaModel = Empresa::with(['pais', 'paisTelefono'])->find($empresa);
        } elseif (auth()->check() && auth()->user()->empresa_id) {
            $empresaModel = Empresa::with(['pais', 'paisTelefono'])->find(auth()->user()->empresa_id);
        }

        if (! $empresaModel) {
            $empresaModel = Empresa::with(['pais', 'paisTelefono'])->find(1);
        }

        $this->empresaModel = $empresaModel;

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
     * Normaliza y formatea el número de teléfono utilizando el código de país de la empresa.
     * En México (+52), la API de WhatsApp requiere el prefijo 521 para números móviles de 10 dígitos.
     */
    public static function formatPhoneNumber(string $phone, $empresa = null): string
    {
        $digits = preg_replace('/[^0-9]/', '', $phone);

        if (empty($digits)) {
            return '';
        }

        if (str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        // Si el número ya posee prefijo internacional completo (>= 11 dígitos)
        if (strlen($digits) >= 11) {
            if (strlen($digits) === 12 && str_starts_with($digits, '52')) {
                return '521' . substr($digits, 2);
            }
            return $digits;
        }

        // Si es un número local de 10 dígitos, formatear según el país de la empresa
        if (strlen($digits) === 10) {
            $codigoPais = null;

            if ($empresa instanceof Empresa) {
                $codigoPais = $empresa->paisTelefono->codigo_telefonico
                    ?? $empresa->pais->codigo_telefonico
                    ?? null;
            } elseif (is_numeric($empresa)) {
                $empModel = Empresa::with(['pais', 'paisTelefono'])->find($empresa);
                $codigoPais = $empModel->paisTelefono->codigo_telefonico
                    ?? $empModel->pais->codigo_telefonico
                    ?? null;
            }

            if (! $codigoPais && auth()->check() && auth()->user()->empresa_id) {
                $empModel = Empresa::with(['pais', 'paisTelefono'])->find(auth()->user()->empresa_id);
                $codigoPais = $empModel->paisTelefono->codigo_telefonico
                    ?? $empModel->pais->codigo_telefonico
                    ?? null;
            }

            if (! $codigoPais) {
                $empModel = Empresa::with(['pais', 'paisTelefono'])->find(1);
                $codigoPais = $empModel->paisTelefono->codigo_telefonico
                    ?? $empModel->pais->codigo_telefonico
                    ?? '58';
            }

            $codigoPaisClean = preg_replace('/[^0-9]/', '', (string) $codigoPais);

            // Regla específica de WhatsApp para México (+52)
            if ($codigoPaisClean === '52') {
                return '521' . $digits;
            }

            return ($codigoPaisClean ?: '58') . $digits;
        }

        return $digits;
    }

    /**
     * Enviar mensaje de texto
     */
    public function sendMessage(string $to, string $message, bool $isWelcome = false)
    {
        $to = self::formatPhoneNumber($to, $this->empresaModel);

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
        $to = self::formatPhoneNumber($to, $this->empresaModel);
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
     * Conectar / Crear instancia en el servidor de WhatsApp
     */
    public function connect()
    {
        try {
            $url = "{$this->baseUrl}/api/instance/create";
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->post($url, [
                    'name' => $this->instanceName,
                ]);

            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            Log::error('WhatsApp Connect Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'instance' => $this->instanceName,
            ]);

            return null;
        }
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
