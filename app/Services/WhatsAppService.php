<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\Pais;
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
     * Formatea el número de teléfono asegurando el código de país.
     */
    public function formatPhoneNumber(string $phone, ?int $paisId = null): string
    {
        $clean = preg_replace('/[^0-9]/', '', $phone);

        if (empty($clean)) {
            return '';
        }

        if (str_starts_with($clean, '0')) {
            $clean = substr($clean, 1);
        }

        $codigoPais = null;

        if ($paisId) {
            $pais = Pais::find($paisId);
            if ($pais && $pais->codigo_telefonico) {
                $codigoPais = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
            }
        }

        if (! $codigoPais && $this->companyId) {
            $empresa = Empresa::with(['pais', 'paisTelefono'])->find($this->companyId);
            if ($empresa) {
                $paisModel = $empresa->paisTelefono ?? $empresa->pais;
                if ($paisModel && $paisModel->codigo_telefonico) {
                    $codigoPais = preg_replace('/[^0-9]/', '', $paisModel->codigo_telefonico);
                }
            }
        }

        if (! $codigoPais) {
            $codigoPais = '52'; // Predeterminado a México (+52)
        }

        if (strlen($clean) <= 10) {
            $clean = $codigoPais.$clean;
        } elseif (! str_starts_with($clean, $codigoPais)) {
            if ($codigoPais === '52' && strlen($clean) === 11 && str_starts_with($clean, '1')) {
                $clean = '52'.$clean;
            } else {
                $codigosComunes = ['52', '58', '57', '1', '34', '54', '56', '51', '593', '502', '503', '504', '505', '506', '507', '591', '595', '598'];
                $tieneCodigo = false;
                foreach ($codigosComunes as $code) {
                    if (str_starts_with($clean, $code) && strlen($clean) >= (strlen($code) + 8)) {
                        $tieneCodigo = true;
                        break;
                    }
                }
                if (! $tieneCodigo) {
                    $clean = $codigoPais.$clean;
                }
            }
        }

        return $clean;
    }

    /**
     * Enviar mensaje de texto
     */
    public function sendMessage(string $to, string $message, bool $isWelcome = false, ?int $paisId = null)
    {
        try {
            $cleanNumber = $this->formatPhoneNumber($to, $paisId);

            $url = "{$this->baseUrl}/api/message/send-text/{$this->instanceName}";
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->post($url, [
                    'to' => $cleanNumber,
                    'message' => $message,
                ]);

            if ($response->successful()) {
                Log::info('WhatsApp mensaje enviado', [
                    'company_id' => $this->companyId,
                    'instance' => $this->instanceName,
                    'to' => $cleanNumber,
                ]);

                return $response->json();
            } else {
                Log::error('WhatsApp Send Message Failed', [
                    'company_id' => $this->companyId,
                    'instance' => $this->instanceName,
                    'to' => $cleanNumber,
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
    public function sendMedia(string $to, string $mediaUrl, string $caption = '', ?int $paisId = null)
    {
        try {
            $cleanNumber = $this->formatPhoneNumber($to, $paisId);

            $url = "{$this->baseUrl}/api/message/send-media/{$this->instanceName}";
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->post($url, [
                    'to' => $cleanNumber,
                    'mediaUrl' => $mediaUrl,
                    'caption' => $caption,
                ]);

            return $response->successful() ? $response->json() : null;
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
