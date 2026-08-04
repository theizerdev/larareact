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
    /** @var bool Permite o bloquea envíos de WhatsApp */
    private $canSend = true;

    public function setTimeout(int $seconds): self
    {
        $this->timeout = $seconds;

        return $this;
    }

    /**
     * Constructor del servicio WhatsApp
     *
     * @param  Empresa|int|null  $empresa  - Empresa, ID de empresa, o null para usar la del usuario actual
     * @param  bool  $allowFallback  - Si es true, las empresas en prueba o sin WhatsApp propio usarán la conexión de la Empresa 1
     */
    public function __construct($empresa = null, bool $allowFallback = true)
    {
        $this->baseUrl = 'http://166.1.85.56:3000';
        $this->apiKey = env('WHATSAPP_API_KEY');
        $this->timeout = config('whatsapp.timeout', 30);

        if (is_array($empresa)) {
            $this->resolveCredentials($empresa);
        } else {
            $this->resolveCompany($empresa, $allowFallback);
        }
    }

    public static function forCredentials(array $credentials): self
    {
        return new self($credentials);
    }

    public static function forCompany($empresa, bool $allowFallback = true): self
    {
        return new self($empresa, $allowFallback);
    }

    public static function forCompanyOwn($empresa): self
    {
        return new self($empresa, false);
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

        if ((! $this->apiKey || ! $this->instanceName) && $this->companyId) {
            // Utilizar credenciales de la Empresa 1 (Dueña del SaaS) si faltan datos
            $empresa = \App\Models\Empresa::find(1);
            if ($empresa) {
                $this->apiKey = $this->apiKey ?: ($empresa->whatsapp_api_key ?? config('whatsapp.api_key', 'test-api-key-vargas-centro'));
                $this->instanceName = $this->instanceName ?: ($empresa->whatsapp_instance ?? 'empresa_1');
                if ($empresa->whatsapp_api_url && empty($credentials['api_url'])) {
                    $this->baseUrl = rtrim($empresa->whatsapp_api_url, '/');
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
     * Resuelve la empresa y configura la URL, API key e instancia.
     * Si la empresa está en período de prueba o no tiene una conexión propia activa,
     * hereda y utiliza la conexión de WhatsApp de la Empresa Principal (ID 1).
     */
    private function resolveCompany($empresa = null, bool $allowFallback = true): void
    {
        $empresaModel = null;

        if ($empresa instanceof Empresa) {
            $empresaModel = $empresa;
        } elseif (is_numeric($empresa)) {
            $empresaModel = Empresa::find($empresa);
        } elseif (auth()->check() && auth()->user()->empresa_id) {
            $empresaModel = Empresa::find(auth()->user()->empresa_id);
        }

        // Si no se encontró, usamos la empresa propietaria (ID 1)
        if (! $empresaModel) {
            $empresaModel = Empresa::find(1);
        }

        if ($empresaModel) {
            $effectiveEmpresa = $empresaModel;

            $hasOwnActiveConnection = (bool) $empresaModel->whatsapp_active && $empresaModel->whatsapp_status === 'connected';

            // Si se permite el fallback y la empresa no es la principal (ID 1):
            // Si la empresa no tiene una conexión de WhatsApp propia activa (whatsapp_status === 'connected'),
            // hereda y utiliza la conexión de WhatsApp de la Empresa Principal (ID 1 - driscolls).
            if ($allowFallback && $empresaModel->id !== 1 && ! $hasOwnActiveConnection) {
                $empresaPrincipal = Empresa::find(1);
                if ($empresaPrincipal) {
                    $effectiveEmpresa = $empresaPrincipal;
                }
            }

            $this->companyId   = $effectiveEmpresa->id;
            $this->apiKey      = $effectiveEmpresa->whatsapp_api_key;

            if (! empty($effectiveEmpresa->whatsapp_api_url)) {
                $this->baseUrl = rtrim($effectiveEmpresa->whatsapp_api_url, '/');
            } else {
                $this->baseUrl = config('whatsapp.api_url', 'http://166.1.85.56:3000');
            }

            if ($effectiveEmpresa->id === 1 || ! $hasOwnActiveConnection || $this->instanceName === 'driscolls') {
                $this->companyId = 1;
                $this->instanceName = 'driscolls';
                $this->apiKey = config('whatsapp.api_key', 'ac31f0a8-c0ba-41a2-b2ca-1a38b01993e9');
            } else {
                $this->instanceName = ! empty($effectiveEmpresa->whatsapp_instance)
                    ? $effectiveEmpresa->whatsapp_instance
                    : 'empresa_' . $effectiveEmpresa->id;
                $this->apiKey = $effectiveEmpresa->whatsapp_api_key;
            }

            // Si falta la apiKey, consultar en la base de datos externa de la API (tabla `instance`) o fallback a config
            //dd( $this->instanceName , $this->apiKey, $this->baseUrl );
            
            if (empty($this->apiKey)) {
                try {
                    $apiRecord = \Illuminate\Support\Facades\DB::connection('whatsapp_api')
                        ->table('instance')
                        ->where('name', $this->instanceName)
                        ->orWhere('instanceName', $this->instanceName)
                        ->first();

                    if (! $apiRecord) {
                        $apiRecord = \Illuminate\Support\Facades\DB::connection('whatsapp_api')
                            ->table('instance')
                            ->where('id', $this->companyId)
                            ->first();
                    }

                    if ($apiRecord) {
                        $this->apiKey = $apiRecord->token ?? $apiRecord->apiKey ?? $apiRecord->api_key ?? null;
                    }
                } catch (\Throwable $e) {
                    // Ignorar si no se puede conectar a la DB externa
                }
            }

            if (empty($this->apiKey)) {
                $this->apiKey = config('whatsapp.api_key', 'test-api-key-vargas-centro');
            }

            // Determina si la empresa puede enviar mensajes (período de prueba, suscrita o exenta)
            $this->canSend = $empresaModel->isExemptFromSubscription() || $empresaModel->isOnTrial() || $empresaModel->hasActiveSubscription();

            return;
        }

        // Valores por defecto en caso de error inesperado
        $this->companyId   = 1;
        $this->apiKey      = config('whatsapp.api_key', 'test-api-key-vargas-centro');
        $this->instanceName = 'driscolls';
        $this->canSend     = true;
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

        // Si el número ya empieza por un código de país internacional conocido, respetarlo y retornar
        $codigosComunes = ['593', '502', '503', '504', '505', '506', '507', '591', '595', '598', '52', '58', '57', '34', '54', '56', '51', '1'];
        foreach ($codigosComunes as $code) {
            if (str_starts_with($clean, $code) && strlen($clean) >= (strlen($code) + 7)) {
                return $clean;
            }
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
            $codigoPais = '58'; // Predeterminado
        }

        if (! str_starts_with($clean, $codigoPais)) {
            $clean = $codigoPais . $clean;
        }

        return $clean;
    }

    /**
     * Enviar mensaje de texto
     */
    public function sendMessage(string $to, string $message, bool $isWelcome = false, ?int $paisId = null)
    {
        try {
            // Formatear número de teléfono
            $cleanNumber = $this->formatPhoneNumber($to, $paisId);

            // Bloquear envío si la empresa no tiene permiso
            if (! $this->canSend) {
                Log::warning('WhatsApp envío bloqueado (empresa sin permiso)', [
                    'company_id' => $this->companyId,
                    'instance'   => $this->instanceName,
                    'to'         => $cleanNumber,
                ]);
                return null;
            }

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
            // Formatear número y validar permiso de envío
            $cleanNumber = $this->formatPhoneNumber($to, $paisId);
            if (! $this->canSend) {
                Log::warning('WhatsApp envío de media bloqueado (empresa sin permiso)', [
                    'company_id' => $this->companyId,
                    'instance'   => $this->instanceName,
                    'to'         => $cleanNumber,
                ]);
                return null;
            }

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
