<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\WhatsAppMessage;
use App\Models\WhatsAppTemplate;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private string $baseUrl;

    private ?string $apiKey = null;

    private int $companyId = 1;

    private string $instanceName = 'empresa_1';

    private int $timeout = 30;

    protected string $countryCode = '+58';

    public function setTimeout(int $seconds): self
    {
        $this->timeout = $seconds;

        return $this;
    }

    /**
     * Constructor del servicio WhatsApp
     *
     * @param  Empresa|int|array|null  $empresa  - Empresa, ID de empresa, array de credenciales, o null para usar la del usuario actual
     */
    public function __construct($empresa = null)
    {
        $this->baseUrl = rtrim(config('whatsapp.api_url', 'http://localhost:3000'), '/');
        $this->timeout = (int) config('whatsapp.timeout', 30);

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

    public static function forCompany($empresa): self
    {
        return new self($empresa);
    }

    /**
     * Resuelve las credenciales provistas directamente como array
     */
    private function resolveCredentials(array $credentials): void
    {
        if (! empty($credentials['api_url'])) {
            $this->baseUrl = rtrim($credentials['api_url'], '/');
        }

        $this->timeout = $credentials['timeout'] ?? $this->timeout;
        $this->companyId = (int) ($credentials['empresa_id'] ?? $credentials['company_id'] ?? 1);
        $this->apiKey = $credentials['api_key'] ?? $credentials['apiKey'] ?? null;
        $this->instanceName = $credentials['instance'] ?? $credentials['whatsapp_instance'] ?? '';

        if ($this->companyId) {
            $empresaModel = Empresa::with('pais')->find($this->companyId);
            if ($empresaModel) {
                if (! $this->apiKey) {
                    $this->apiKey = $empresaModel->whatsapp_api_key;
                }
                if (! $this->instanceName && ! empty($empresaModel->whatsapp_instance)) {
                    $this->instanceName = $empresaModel->whatsapp_instance;
                }
                $this->countryCode = $empresaModel->pais?->codigo_telefonico ?? '+58';
            }
        }

        if (! $this->apiKey) {
            $this->apiKey = config('whatsapp.api_key', 'my_secret_key_123');
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
            $empresaModel = Empresa::with('pais')->find($empresa);
        } elseif (auth()->check() && auth()->user()->empresa_id) {
            $empresaModel = Empresa::with('pais')->find(auth()->user()->empresa_id);
        }

        if (! $empresaModel) {
            $empresaModel = Empresa::with('pais')->find(1);
        }

        if ($empresaModel) {
            $this->companyId = (int) $empresaModel->id;
            $this->apiKey = $empresaModel->whatsapp_api_key ?? config('whatsapp.api_key', 'my_secret_key_123');
            if (! empty($empresaModel->whatsapp_api_url)) {
                $this->baseUrl = rtrim($empresaModel->whatsapp_api_url, '/');
            }
            $this->instanceName = ! empty($empresaModel->whatsapp_instance)
                ? $empresaModel->whatsapp_instance
                : 'empresa_'.$empresaModel->id;

            $pais = $empresaModel->relationLoaded('pais') ? $empresaModel->pais : $empresaModel->pais()->first();
            $this->countryCode = $pais?->codigo_telefonico ?? '+58';

            return;
        }

        $this->companyId = 1;
        $this->apiKey = config('whatsapp.api_key', 'my_secret_key_123');
        $this->instanceName = 'empresa_1';
        $this->countryCode = '+58';
    }

    /**
     * Cliente HTTP base con cabeceras de autenticación (x-api-key / X-Company-Id)
     */
    protected function client()
    {
        $key = (string) ($this->apiKey ?? '');
        $headers = [
            'x-api-key' => $key,
            'X-Company-Id' => (string) $this->companyId,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];

        return Http::withHeaders($headers)->timeout($this->timeout);
    }

    public function getCompanyId(): int
    {
        return $this->companyId;
    }

    public function getInstanceName(): string
    {
        return $this->instanceName;
    }

    public function getCountryCode(): string
    {
        return $this->countryCode;
    }

    /**
     * Crear una nueva instancia de WhatsApp o inicializarla en el motor
     */
    public function createInstance(?string $name = null, ?string $customToken = null): ?array
    {
        $instanceName = $name ?? $this->instanceName;
        $token = $customToken ?? $this->apiKey;
        $masterKey = config('whatsapp.api_key', 'my_secret_key_123');

        try {
            $response = Http::withHeaders([
                'x-api-key' => $masterKey,
                'X-Company-Id' => (string) $this->companyId,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout($this->timeout)->post("{$this->baseUrl}/api/instance/create", [
                'name' => $instanceName,
                'token' => $token,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning("WhatsApp createInstance returned status {$response->status()}: {$response->body()}");
            return $response->json();
        } catch (\Exception $e) {
            Log::error('WhatsApp Create Instance Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'instance' => $instanceName,
            ]);

            return null;
        }
    }

    /**
     * Obtener el estado actual y la imagen en Base64 del código QR
     */
    public function getStatus(?string $name = null): ?array
    {
        $instanceName = $name ?? $this->instanceName;

        try {
            $url = "{$this->baseUrl}/api/instance/{$instanceName}/status";
            $response = $this->client()->timeout(10)->get($url);

            if ($response->successful()) {
                $data = $response->json();
                $status = $data['status'] ?? 'close';
                $isConnected = ($status === 'open');

                return [
                    'instanceName' => $data['instanceName'] ?? $instanceName,
                    'status' => $status,
                    'isConnected' => $isConnected,
                    'connectionState' => $isConnected ? 'connected' : ($status === 'qr' ? 'qr_ready' : $status),
                    'qrCode' => $data['qrDataUrl'] ?? null,
                    'qrDataUrl' => $data['qrDataUrl'] ?? null,
                    'token' => $data['token'] ?? null,
                    'user' => [
                        'id' => $data['userJid'] ?? null,
                        'name' => $data['userName'] ?? null,
                    ],
                    'userJid' => $data['userJid'] ?? null,
                    'raw' => $data,
                ];
            }

            if ($response->status() === 404) {
                return [
                    'instanceName' => $instanceName,
                    'status' => 'close',
                    'isConnected' => false,
                    'connectionState' => 'disconnected',
                    'qrCode' => null,
                    'qrDataUrl' => null,
                    'user' => null,
                    'userJid' => null,
                ];
            }

            Log::warning('WhatsApp Status HTTP Error', [
                'company_id' => $this->companyId,
                'instance' => $instanceName,
                'status' => $response->status(),
            ]);

            return null;
        } catch (ConnectionException $e) {
            Log::error('WhatsApp Service Unavailable: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'url' => $this->baseUrl,
                'instance' => $instanceName,
            ]);

            return ['_error' => 'service_unavailable'];
        } catch (\Exception $e) {
            Log::error('WhatsApp Status Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'instance' => $instanceName,
            ]);

            return null;
        }
    }

    /**
     * Obtener código QR para conectar WhatsApp
     */
    public function getQRCode(?string $name = null): ?array
    {
        $status = $this->getStatus($name);
        if ($status && ! empty($status['qrCode'])) {
            return ['qrCode' => $status['qrCode']];
        }

        return null;
    }

    /**
     * 🛡️ Verificar si un número telefónico existe en WhatsApp
     */
    public function checkNumber(string $phone, ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;
        $formattedPhone = self::formatPhoneNumber($phone, $this->countryCode);

        try {
            $response = $this->client()->get("{$this->baseUrl}/api/instance/{$instanceName}/check-number/{$formattedPhone}");

            if ($response->successful()) {
                $data = $response->json();

                return [
                    'exists' => (bool) ($data['exists'] ?? true),
                    'jid' => $data['jid'] ?? ($formattedPhone.'@s.whatsapp.net'),
                    'formattedPhone' => $formattedPhone,
                ];
            }

            // Si el servidor de WhatsApp no tiene implementada la subruta check-number (404),
            // validamos el formato internacional E.164 para no arrojar un falso negativo
            if ($response->status() === 404) {
                $isValidFormat = strlen($formattedPhone) >= 10 && strlen($formattedPhone) <= 15;

                return [
                    'exists' => $isValidFormat,
                    'jid' => $formattedPhone.'@s.whatsapp.net',
                    'formattedPhone' => $formattedPhone,
                ];
            }

            return null;
        } catch (\Exception $e) {
            Log::error('WhatsApp Check Number Error: '.$e->getMessage(), [
                'phone' => $phone,
                'instance' => $instanceName,
            ]);

            return null;
        }
    }

    /**
     * 🛡️ Enviar mensaje de texto con protección Anti-Baneo, Spintax y variables
     */
    public function sendText(string $to, string $message, array $variables = [], bool $sync = false, ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;
        $toFormatted = self::formatPhoneNumber($to, $this->countryCode);

        try {
            $url = "{$this->baseUrl}/api/message/send-text/{$instanceName}";
            $response = $this->client()->post($url, [
                'to' => $toFormatted,
                'message' => $message,
                'variables' => (object) $variables,
                'sync' => $sync,
                'simulateTyping' => true,
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                $msgId = $responseData['data']['key']['id'] ?? $responseData['messageId'] ?? null;

                try {
                    WhatsAppMessage::create([
                        'message_id' => $msgId,
                        'recipient_phone' => $toFormatted,
                        'message_content' => $message,
                        'variables' => $variables,
                        'status' => 'sent',
                        'sent_at' => now(),
                        'direction' => 'outbound',
                        'created_by' => auth()->id() ?? null,
                    ]);
                } catch (\Throwable $e) {
                    Log::warning('Failed to log outbound WhatsAppMessage: '.$e->getMessage());
                }

                Log::info('WhatsApp mensaje enviado', [
                    'company_id' => $this->companyId,
                    'instance' => $instanceName,
                    'to' => $toFormatted,
                ]);

                return $responseData;
            }

            Log::error('WhatsApp Send Message Failed', [
                'company_id' => $this->companyId,
                'instance' => $instanceName,
                'to' => $toFormatted,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $response->json() ?? ['error' => 'HTTP '.$response->status()];
        } catch (\Exception $e) {
            Log::error('WhatsApp Send Message Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'instance' => $instanceName,
                'to' => $toFormatted,
            ]);

            return null;
        }
    }

    /**
     * 📋 Enviar un mensaje utilizando una Plantilla registrada con Spintax y variables dinámicas
     */
    public function sendTemplate(string $to, string $templateNameOrCategory, array $variables = [], bool $sync = false, ?string $instance = null): ?array
    {
        $template = WhatsAppTemplate::where('empresa_id', $this->companyId)
            ->where('activo', true)
            ->where(function ($q) use ($templateNameOrCategory) {
                $q->where('nombre', $templateNameOrCategory)
                    ->orWhere('categoria', $templateNameOrCategory);
            })
            ->first();

        $content = $template ? $template->contenido : $templateNameOrCategory;

        // Auto-inyectar nombre de la empresa si no se pasa explícitamente
        if (!isset($variables['empresa'])) {
            $variables['empresa'] = $this->empresa?->nombre ?? 'MMM Venezuela';
        }

        return $this->sendText($to, $content, $variables, $sync, $instance);
    }

    /**
     * Wrapper retrocompatible de sendMessage
     */
    public function sendMessage(string $to, string $message, array|bool $variablesOrIsWelcome = [], bool $sync = false, ?string $instance = null): ?array
    {
        $variables = is_array($variablesOrIsWelcome) ? $variablesOrIsWelcome : [];

        return $this->sendText($to, $message, $variables, $sync, $instance);
    }

    /**
     * 🛡️ Enviar archivo multimedia (Imagen, PDF, Audio, Video) vía URL
     */
    public function sendMedia(string $to, string $mediaUrl, string $caption = '', array $variables = [], bool $sync = false, ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;
        $toFormatted = self::formatPhoneNumber($to, $this->countryCode);

        try {
            $url = "{$this->baseUrl}/api/message/send-media/{$instanceName}";
            $response = $this->client()->post($url, [
                'to' => $toFormatted,
                'url' => $mediaUrl,
                'caption' => $caption,
                'message' => $caption,
                'variables' => (object) $variables,
                'sync' => $sync,
                'simulateTyping' => true,
            ]);

            if ($response->successful()) {
                Log::info('WhatsApp multimedia enviado', [
                    'company_id' => $this->companyId,
                    'to' => $toFormatted,
                    'response' => $response->json(),
                ]);

                return $response->json();
            }

            Log::error('WhatsApp Send Media Failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $response->json() ?? ['error' => 'HTTP '.$response->status()];
        } catch (\Exception $e) {
            Log::error('WhatsApp Send Media Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'instance' => $instanceName,
                'to' => $toFormatted,
            ]);

            return null;
        }
    }

    public function sendDocument(string $to, string $filePath, string $caption = '', array $variables = [], bool $sync = false, ?string $instance = null): ?array
    {
        return $this->sendMedia($to, $filePath, $caption, $variables, $sync, $instance);
    }

    public function sendImage(string $to, string $filePath, string $caption = '', array $variables = [], bool $sync = false, ?string $instance = null): ?array
    {
        return $this->sendMedia($to, $filePath, $caption, $variables, $sync, $instance);
    }

    /**
     * 📊 Obtener estadísticas de la cola de envíos, límites de calentamiento y salud de la cuenta
     */
    public function getQueueStats(?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;

        $empresa = Empresa::find($this->companyId);
        $dailyLimit = (int) ($empresa?->whatsapp_rate_limit ?? 100);

        $sentToday = WhatsAppMessage::where('direction', 'outbound')
            ->whereDate('created_at', today())
            ->count();

        $inQueue = WhatsAppMessage::where('direction', 'outbound')
            ->where('status', 'pending')
            ->count();

        $failedToday = WhatsAppMessage::where('direction', 'outbound')
            ->whereDate('created_at', today())
            ->where('status', 'failed')
            ->count();

        $remoteStats = null;
        try {
            $response = $this->client()->timeout(5)->get("{$this->baseUrl}/api/message/queue-status/{$instanceName}");
            if ($response->successful()) {
                $body = $response->json();
                $remoteStats = $body['stats'] ?? $body;
            }
        } catch (\Throwable $e) {
            // Continúa con métricas sincronizadas locales
        }

        $effectiveSent = max($sentToday, (int) ($remoteStats['dailySentCount'] ?? $remoteStats['sentToday'] ?? 0));
        $effectiveDailyLimit = (int) ($remoteStats['dailyLimit'] ?? $dailyLimit);
        $remaining = max(0, $effectiveDailyLimit - $effectiveSent);

        $dbWarmupMode = $empresa?->whatsapp_warmup_mode ?? true;
        $dbWorkingHoursEnabled = $empresa?->whatsapp_working_hours_enabled ?? true;
        $dbWorkingHoursStart = $empresa?->whatsapp_working_hours_start ?? '08:00';
        $dbWorkingHoursEnd = $empresa?->whatsapp_working_hours_end ?? '20:00';
        $dbProxyUrl = $empresa?->whatsapp_proxy_url ?? '';

        return [
            'sentToday' => $effectiveSent,
            'dailyLimit' => $effectiveDailyLimit,
            'remaining' => $remaining,
            'queued' => (int) ($remoteStats['queuedCount'] ?? $remoteStats['inQueue'] ?? $inQueue),
            'inQueue' => (int) ($remoteStats['queuedCount'] ?? $remoteStats['inQueue'] ?? $inQueue),
            'failedToday' => (int) ($remoteStats['failedToday'] ?? $failedToday),
            'warmupMode' => (bool) ($remoteStats['warmupMode'] ?? $dbWarmupMode),
            'warmupDay' => (int) ($remoteStats['warmupDay'] ?? 1),
            'warmupStartDate' => $remoteStats['warmupStartDate'] ?? null,
            'warmupInitialLimit' => (int) ($remoteStats['warmupInitialLimit'] ?? 10),
            'warmupIncrementPerDay' => (int) ($remoteStats['warmupIncrementPerDay'] ?? 10),
            'warmupTargetLimit' => (int) ($remoteStats['warmupTargetLimit'] ?? 100),
            'mutateMediaHash' => (bool) ($remoteStats['mutateMediaHash'] ?? true),
            'totalSentCount' => (int) ($remoteStats['totalSentCount'] ?? 0),
            'totalReceivedCount' => (int) ($remoteStats['totalReceivedCount'] ?? 0),
            'inboundOutboundRatio' => (float) ($remoteStats['inboundOutboundRatio'] ?? 1.0),
            'consecutiveFailures' => (int) ($remoteStats['consecutiveFailures'] ?? 0),
            'circuitBreakerActive' => (bool) ($remoteStats['circuitBreakerActive'] ?? false),
            'circuitBreakerUntil' => $remoteStats['circuitBreakerUntil'] ?? null,
            'workingHoursEnabled' => (bool) ($remoteStats['workingHoursEnabled'] ?? $dbWorkingHoursEnabled),
            'workingHoursStart' => $remoteStats['workingHoursStart'] ?? $dbWorkingHoursStart,
            'workingHoursEnd' => $remoteStats['workingHoursEnd'] ?? $dbWorkingHoursEnd,
            'proxyUrl' => $remoteStats['proxyUrl'] ?? $dbProxyUrl,
            'backupProxyUrl' => $remoteStats['backupProxyUrl'] ?? null,
        ];
    }

    /**
     * 🛑 Añadir un número a la Lista Negra (Blacklist / Opt-Out)
     */
    public function addToBlacklist(string $phone, string $reason = 'OPT_OUT_USER', ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;
        $formattedPhone = self::formatPhoneNumber($phone, $this->countryCode);

        try {
            $response = $this->client()->post("{$this->baseUrl}/api/instance/{$instanceName}/blacklist", [
                'phone' => $formattedPhone,
                'reason' => $reason,
            ]);

            return $response->json();
        } catch (\Exception $e) {
            Log::error('WhatsApp Add Blacklist Error: '.$e->getMessage(), [
                'phone' => $phone,
                'instance' => $instanceName,
            ]);

            return null;
        }
    }

    /**
     * Eliminar un número de la Lista Negra
     */
    public function removeFromBlacklist(string $phone, ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;
        $formattedPhone = self::formatPhoneNumber($phone, $this->countryCode);

        try {
            $response = $this->client()->delete("{$this->baseUrl}/api/instance/{$instanceName}/blacklist/{$formattedPhone}");

            return $response->json();
        } catch (\Exception $e) {
            Log::error('WhatsApp Remove Blacklist Error: '.$e->getMessage(), [
                'phone' => $phone,
                'instance' => $instanceName,
            ]);

            return null;
        }
    }

    /**
     * 🛡️ Configurar parámetros Anti-Baneo y Límites de Mensajería
     */
    public function updateAntiBan(array $settings, ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;

        try {
            $response = $this->client()->post("{$this->baseUrl}/api/instance/{$instanceName}/antiban", $settings);

            return $response->json();
        } catch (\Exception $e) {
            Log::error('WhatsApp Update AntiBan Error: '.$e->getMessage(), [
                'instance' => $instanceName,
            ]);

            return null;
        }
    }

    /**
     * 🔥 Configurar Curva de Calentamiento Automática Progresiva (Ramp-Up Schedule)
     */
    public function configureWarmupSchedule(int $initialLimit = 10, int $incrementPerDay = 10, int $targetLimit = 100, bool $enabled = true, ?string $instance = null): ?array
    {
        return $this->updateAntiBan([
            'warmupMode' => $enabled,
            'warmupInitialLimit' => $initialLimit,
            'warmupIncrementPerDay' => $incrementPerDay,
            'warmupTargetLimit' => $targetLimit,
            'warmupDay' => 1,
            'warmupStartDate' => now()->toISOString(),
        ], $instance);
    }

    /**
     * ⚡ Desactivar el Disyuntor (Circuit Breaker) y reanudar envíos tras una pausa preventiva
     */
    public function resetCircuitBreaker(?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;

        try {
            $response = $this->client()->post("{$this->baseUrl}/api/instance/{$instanceName}/circuit-breaker/reset");

            return $response->json();
        } catch (\Exception $e) {
            Log::error('WhatsApp Reset Circuit Breaker Error: '.$e->getMessage(), [
                'instance' => $instanceName,
            ]);

            return null;
        }
    }

    /**
     * 🎨 Activar/Desactivar la Mutación de Hash Multimedia (Anti-Fingerprinting)
     */
    public function setMediaMutation(bool $enabled = true, ?string $instance = null): ?array
    {
        return $this->updateAntiBan([
            'mutateMediaHash' => $enabled,
        ], $instance);
    }

    /**
     * 📤 Enviar archivo multimedia local subiéndolo como Multipart (con mutación automática)
     */
    public function sendLocalMedia(string $to, string $filePath, string $mediaType = 'image', string $caption = '', array $variables = [], ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;
        $formattedPhone = self::formatPhoneNumber($to, $this->countryCode);
        $fileName = basename($filePath);

        if (! file_exists($filePath)) {
            Log::error("WhatsApp Send Local Media: Archivo no encontrado en {$filePath}");
            return null;
        }

        try {
            $response = Http::withHeaders([
                'x-api-key' => (string) ($this->apiKey ?? ''),
                'X-Company-Id' => (string) $this->companyId,
            ])
            ->timeout($this->timeout)
            ->attach('file', file_get_contents($filePath), $fileName)
            ->post("{$this->baseUrl}/api/message/send-multimedia/{$instanceName}", [
                'to' => $formattedPhone,
                'mediaType' => $mediaType,
                'caption' => $caption,
                'variables' => (object) $variables,
                'simulateTyping' => true,
            ]);

            return $response->json();
        } catch (\Exception $e) {
            Log::error('WhatsApp Send Local Media Error: '.$e->getMessage(), [
                'to' => $to,
                'filePath' => $filePath,
                'instance' => $instanceName,
            ]);

            return null;
        }
    }

    /**
     * ⚙️ Ajustar límite diario y modo calentamiento rápidamente
     */
    public function setDailyLimit(int $limit, bool $warmupMode = true, ?string $instance = null): ?array
    {
        return $this->updateAntiBan([
            'dailyLimit' => $limit,
            'warmupMode' => $warmupMode,
        ], $instance);
    }

    /**
     * 🌙 Configurar Horarios de Envío y Silencio Nocturno (Working Hours)
     */
    public function updateWorkingHours(bool $enabled, string $start = '08:00', string $end = '20:00', ?string $instance = null): ?array
    {
        return $this->updateAntiBan([
            'workingHoursEnabled' => $enabled,
            'workingHoursStart' => $start,
            'workingHoursEnd' => $end,
        ], $instance);
    }

    /**
     * 🌐 Configurar Proxy HTTP/SOCKS5 principal y de contingencia (Failover)
     */
    public function setProxies(string $proxyUrl, ?string $backupProxyUrl = null, ?string $instance = null): ?array
    {
        return $this->updateAntiBan([
            'proxyUrl' => $proxyUrl,
            'backupProxyUrl' => $backupProxyUrl,
        ], $instance);
    }

    /**
     * 🌐 Configurar Proxy HTTP/SOCKS5 dedicado para la instancia (Legacy)
     */
    public function setProxy(string $proxyUrl, ?string $instance = null): ?array
    {
        return $this->setProxies($proxyUrl, null, $instance);
    }

    /**
     * 🎲 Previsualizar variaciones generadas por una plantilla Spintax
     */
    /**
     * 🛡️ Envía una reacción de emoji a un mensaje para humanizar la conversación (ej: "👍", "❤️", "🔥", "🙏")
     */
    /**
     * 💬 Enviar mensaje dividido en múltiples burbujas encadenadas (Multi-Bubble Chaining)
     */
    public function sendMultiBubble(string $to, array $bubbles, array $variables = [], ?string $instance = null): ?array
    {
        $chainedText = implode("
===
", $bubbles);
        return $this->sendMessage($to, $chainedText, $variables, false, null, $instance);
    }

    /**
     * 🔒 Activar/Desactivar Cuarentena de 7 días para Chips Nuevos (New SIM Isolation)
     */
    public function setNewSimQuarantine(bool $enabled = true, ?string $instance = null): ?array
    {
        return $this->updateAntiBan([
            'isNewSim' => $enabled,
        ], $instance);
    }

    /**
     * �� Activar/Desactivar Modulación Circadiana Biológica
     */
    public function setCircadianModulation(bool $enabled = true, ?string $instance = null): ?array
    {
        return $this->updateAntiBan([
            'circadianModulation' => $enabled,
        ], $instance);
    }

    /**
     * 🔗 Activar/Desactivar Sanitización Dinámica de Enlaces (Link Cloaking)
     */
    public function setLinkCloaking(bool $enabled = true, ?string $instance = null): ?array
    {
        return $this->updateAntiBan([
            'linkCloaking' => $enabled,
        ], $instance);
    }

    /**
     * 🤝 Activar/Desactivar Red de Calentamiento Cruzado P2P
     */
    public function setP2PWarmup(bool $enabled = true, ?string $instance = null): ?array
    {
        return $this->updateAntiBan([
            'p2pWarmupEnabled' => $enabled,
        ], $instance);
    }

    /**
     * 🛑 Desactivar el Freno de Emergencia (Emergency Brake)
     */
    public function resetEmergencyBrake(?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;

        try {
            $response = $this->client()->post("{$this->baseUrl}/api/instance/{$instanceName}/emergency-brake/reset");

            return $response->json();
        } catch (\Exception $e) {
            Log::error('WhatsApp Reset Emergency Brake Error: '.$e->getMessage(), [
                'instance' => $instanceName,
            ]);

            return null;
        }
    }

    /**
     * 🤝 Disparar manualmente una ronda de diálogo cruzado P2P
     */
    public function triggerP2PWarmupRound(): ?array
    {
        try {
            $response = $this->client()->post("{$this->baseUrl}/api/instance/p2p-warmup/trigger");

            return $response->json();
        } catch (\Exception $e) {
            Log::error('WhatsApp Trigger P2P Warmup Error: '.$e->getMessage());

            return null;
        }
    }

    public function sendReaction(string $to, string $messageId, string $emoji, bool $fromMe = false, ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;
        $formattedPhone = self::formatPhoneNumber($to, $this->countryCode);

        try {
            $response = $this->client()->post("{$this->baseUrl}/api/message/react/{$instanceName}", [
                'to' => $formattedPhone,
                'messageId' => $messageId,
                'emoji' => $emoji,
                'fromMe' => $fromMe,
            ]);

            return $response->json();
        } catch (\Exception $e) {
            Log::error('WhatsApp Send Reaction Error: '.$e->getMessage(), [
                'to' => $to,
                'messageId' => $messageId,
                'emoji' => $emoji,
            ]);

            return null;
        }
    }

    /**
     * 🛡️ Despacha una campaña masiva balanceando la carga en modo Round-Robin entre múltiples instancias
     */
    public function broadcastBalanced(array $instances, array $recipients, string $message, array $variables = [], ?string $mediaUrl = null, ?string $caption = null): ?array
    {
        try {
            $response = $this->client()->post("{$this->baseUrl}/api/message/broadcast-balanced", [
                'instances' => $instances,
                'recipients' => $recipients,
                'text' => $message,
                'variables' => (object) $variables,
                'mediaUrl' => $mediaUrl,
                'caption' => $caption,
            ]);

            return $response->json();
        } catch (\Exception $e) {
            Log::error('WhatsApp Balanced Broadcast Error: '.$e->getMessage(), [
                'instances' => $instances,
                'count' => count($recipients),
            ]);

            return null;
        }
    }

    public function previewSpintax(string $template, int $count = 5, array $variables = []): ?array
    {
        try {
            $response = $this->client()->post("{$this->baseUrl}/api/message/spintax/preview", [
                'text' => $template,
                'count' => $count,
                'variables' => (object) $variables,
            ]);

            return $response->json();
        } catch (\Exception $e) {
            Log::error('WhatsApp Spintax Preview Error: '.$e->getMessage(), [
                'template' => $template,
            ]);

            return null;
        }
    }

    /**
     * Iniciar / Encender una instancia
     */
    public function startInstance(?string $name = null): ?array
    {
        $instanceName = $name ?? $this->instanceName;

        try {
            return $this->client()->post("{$this->baseUrl}/api/instance/{$instanceName}/start")->json();
        } catch (\Exception $e) {
            Log::error('WhatsApp Start Instance Error: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Detener / Apagar una instancia
     */
    public function stopInstance(?string $name = null): ?array
    {
        $instanceName = $name ?? $this->instanceName;

        try {
            return $this->client()->post("{$this->baseUrl}/api/instance/{$instanceName}/stop")->json();
        } catch (\Exception $e) {
            Log::error('WhatsApp Stop Instance Error: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Conectar / Crear instancia en el servidor de WhatsApp
     */
    public function connect(?string $customToken = null)
    {
        return $this->createInstance($this->instanceName, $customToken);
    }

    /**
     * Desconectar / Eliminar instancia
     */
    public function disconnect(?string $name = null)
    {
        $instanceName = $name ?? $this->instanceName;

        try {
            $url = "{$this->baseUrl}/api/instance/{$instanceName}";
            $response = $this->client()->delete($url);

            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            Log::error('WhatsApp Disconnect Error: '.$e->getMessage(), [
                'company_id' => $this->companyId,
                'instance' => $instanceName,
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

    /**
     * Normaliza y formatea el número de teléfono con código de país.
     */
    public static function formatPhoneNumber(string $phone, ?string $defaultCountryCode = '+58'): string
    {
        $digits = preg_replace('/[^0-9]/', '', $phone);

        if (empty($digits)) {
            return '';
        }

        // Si empieza con 0 (ej. 04241234567 o 04121234567), quitar el 0
        if (str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        // Si ya tiene código de país de Venezuela (58) con 12 dígitos
        if (str_starts_with($digits, '58') && strlen($digits) >= 12) {
            return $digits;
        }

        // Si ya tiene código de país de México (521 o 52)
        if (str_starts_with($digits, '521') && strlen($digits) === 13) {
            return $digits;
        }
        if (str_starts_with($digits, '52') && strlen($digits) === 12) {
            return '521'.substr($digits, 2);
        }

        $cleanPrefix = $defaultCountryCode ? preg_replace('/[^0-9]/', '', $defaultCountryCode) : '58';

        // Manejo específico si el país de la empresa es México (52)
        if ($cleanPrefix === '52') {
            if (strlen($digits) === 10) {
                return '521'.$digits;
            }

            return $cleanPrefix.$digits;
        }

        // Si tiene 10 dígitos (típico móvil de Venezuela: 4242885159, 412..., 414...)
        if (strlen($digits) === 10) {
            return ($cleanPrefix ?: '58').$digits;
        }

        // Si ya incluye el prefijo limpio
        if ($cleanPrefix && str_starts_with($digits, $cleanPrefix)) {
            return $digits;
        }

        return ($cleanPrefix ?: '58').$digits;
    }

    

    public static function forCompanyOwn($empresa): self
    {
        return new self($empresa);
    }
}
