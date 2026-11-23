<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\WhatsAppMessage;
use App\Models\WhatsAppTemplate;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class WhatsAppService
{
    private string $baseUrl;

    private ?string $apiKey = null;

    private ?int $sucursalId = null;

    private ?Sucursal $sucursalModel = null;

    private int $companyId = 1;

    private ?Empresa $empresaModel = null;

    private string $instanceName = 'sucursal_1';

    private int $timeout = 30;

    protected string $countryCode = '+58';

    public function setTimeout(int $seconds): self
    {
        $this->timeout = $seconds;

        return $this;
    }

    /**
     * Constructor del servicio WhatsApp (estrictamente multi-instancia por Sucursal)
     *
     * @param  Sucursal|Empresa|int|array|null  $target
     */
    public function __construct($target = null)
    {
        $this->baseUrl = rtrim(config('whatsapp.api_url', 'http://127.0.0.1:3001'), '/');
        $this->timeout = (int) config('whatsapp.timeout', 30);

        if (is_array($target)) {
            $this->resolveCredentials($target);
        } elseif ($target instanceof Sucursal) {
            $this->resolveSucursal($target);
        } else {
            $this->resolveCompany($target);
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

    public static function forCompanyOwn($empresa): self
    {
        return new self($empresa);
    }

    public static function forSucursal($sucursal): self
    {
        $service = new self($sucursal instanceof Sucursal ? $sucursal : null);
        $service->resolveSucursal($sucursal);

        return $service;
    }

    public static function forBranch($sucursal): self
    {
        return self::forSucursal($sucursal);
    }

    /**
     * Evita que URLs legadas del antiguo servidor Node.js (:3000) bloqueen el motor Python (:3001).
     */
    private function resolveEffectiveApiUrl(?string $configuredUrl): string
    {
        $defaultUrl = rtrim(config('whatsapp.api_url', 'http://127.0.0.1:3001'), '/');
        $clean = rtrim(trim((string) ($configuredUrl ?? '')), '/');

        if ($clean === '' || in_array($clean, ['http://localhost:3000', 'http://127.0.0.1:3000'], true)) {
            return $defaultUrl;
        }

        return $clean;
    }

    private function resolveCredentials(array $credentials): void
    {
        if (! empty($credentials['api_url'])) {
            $this->baseUrl = $this->resolveEffectiveApiUrl($credentials['api_url']);
        }

        $this->timeout = (int) ($credentials['timeout'] ?? $this->timeout);
        $this->companyId = (int) ($credentials['empresa_id'] ?? $credentials['company_id'] ?? 1);
        $this->sucursalId = isset($credentials['sucursal_id']) ? (int) $credentials['sucursal_id'] : null;
        $this->apiKey = $credentials['api_key'] ?? $credentials['apiKey'] ?? null;
        $this->instanceName = $credentials['instance'] ?? $credentials['whatsapp_instance'] ?? '';

        if ($this->sucursalId) {
            $sucursalModel = Sucursal::with(['empresa.pais', 'paisTelefono'])->find($this->sucursalId);
            if ($sucursalModel) {
                $this->sucursalModel = $sucursalModel;
                $this->empresaModel = $sucursalModel->empresa;
                if (! $this->apiKey) {
                    $this->apiKey = $sucursalModel->empresa?->whatsapp_api_key;
                }
                if (! $this->instanceName) {
                    $this->instanceName = $sucursalModel->getWhatsAppInstanceName();
                }
                $pais = $sucursalModel->paisTelefono ?? $sucursalModel->empresa?->pais;
                $this->countryCode = $pais?->codigo_telefonico ?? '+58';
            }
        } elseif ($this->companyId) {
            $empresaModel = Empresa::with(['pais', 'sucursales'])->find($this->companyId);
            if ($empresaModel) {
                $this->empresaModel = $empresaModel;
                if (! $this->apiKey) {
                    $this->apiKey = $empresaModel->whatsapp_api_key;
                }
                if (! $this->instanceName) {
                    $sucursal = $empresaModel->sucursales()
                        ->where('whatsapp_active', true)
                        ->where('whatsapp_status', 'connected')
                        ->whereNotNull('whatsapp_instance')
                        ->first()
                        ?? $empresaModel->sucursales()->whereNotNull('whatsapp_instance')->first()
                        ?? $empresaModel->sucursales()->first();

                    if ($sucursal) {
                        $this->sucursalModel = $sucursal;
                        $this->sucursalId = (int) $sucursal->id;
                        $this->instanceName = $sucursal->getWhatsAppInstanceName();
                    }
                }
                $this->countryCode = $empresaModel->pais?->codigo_telefonico ?? '+58';
            }
        }

        if (! $this->apiKey) {
            $this->apiKey = config('whatsapp.api_key', 'my_secret_key_123');
        }

        if (! $this->instanceName) {
            $this->instanceName = $this->sucursalId ? ('sucursal_'.$this->sucursalId) : ('empresa_'.$this->companyId);
        }
    }

    /**
     * Resuelve la sucursal y configura su instancia aislada en el motor Python.
     */
    public function resolveSucursal($sucursal = null): void
    {
        $sucursalModel = null;
        if ($sucursal instanceof Sucursal) {
            $sucursalModel = $sucursal;
        } elseif (is_numeric($sucursal)) {
            $sucursalModel = Sucursal::with(['empresa.pais', 'paisTelefono'])->find($sucursal);
            if (! $sucursalModel) {
                $sucursalModel = Sucursal::with(['empresa.pais', 'paisTelefono'])
                    ->where('empresa_id', $sucursal)
                    ->where('whatsapp_status', 'connected')
                    ->whereNotNull('whatsapp_instance')
                    ->where('whatsapp_instance', '!=', '')
                    ->first()
                    ?? Sucursal::with(['empresa.pais', 'paisTelefono'])
                    ->where('empresa_id', $sucursal)
                    ->whereNotNull('whatsapp_instance')
                    ->where('whatsapp_instance', '!=', '')
                    ->first()
                    ?? Sucursal::with(['empresa.pais', 'paisTelefono'])
                    ->where('empresa_id', $sucursal)
                    ->first();
            }
        } elseif (auth()->check() && auth()->user()->sucursal_id) {
            $sucursalModel = Sucursal::with(['empresa.pais', 'paisTelefono'])->find(auth()->user()->sucursal_id);
        }

        if ($sucursalModel) {
            $this->sucursalModel = $sucursalModel;
            $this->sucursalId = (int) $sucursalModel->id;
            $this->companyId = (int) $sucursalModel->empresa_id;
            $empresa = $sucursalModel->empresa ?? Empresa::with('pais')->find($sucursalModel->empresa_id);
            $this->empresaModel = $empresa;

            $this->apiKey = $empresa?->whatsapp_api_key ?? config('whatsapp.api_key', 'my_secret_key_123');
            $this->baseUrl = $this->resolveEffectiveApiUrl($empresa?->whatsapp_api_url);

            $this->instanceName = $sucursalModel->getWhatsAppInstanceName();
            if (empty($sucursalModel->whatsapp_instance)) {
                try {
                    $sucursalModel->updateQuietly(['whatsapp_instance' => $this->instanceName]);
                } catch (\Throwable) {
                    // silencioso
                }
            }

            $pais = $sucursalModel->paisTelefono ?? $empresa?->pais;
            $this->countryCode = $pais?->codigo_telefonico ?? '+58';

            return;
        }

        if (auth()->check() && auth()->user()->empresa_id) {
            $firstSucursal = Sucursal::with(['empresa.pais', 'paisTelefono'])
                ->where('empresa_id', auth()->user()->empresa_id)
                ->where('whatsapp_status', 'connected')
                ->whereNotNull('whatsapp_instance')
                ->where('whatsapp_instance', '!=', '')
                ->first()
                ?? Sucursal::with(['empresa.pais', 'paisTelefono'])
                ->where('empresa_id', auth()->user()->empresa_id)
                ->first();

            if ($firstSucursal) {
                $this->resolveSucursal($firstSucursal);

                return;
            }
        }

        $defaultSucursal = Sucursal::with(['empresa.pais', 'paisTelefono'])->find(1);
        if ($defaultSucursal) {
            $this->resolveSucursal($defaultSucursal);

            return;
        }

        $this->instanceName = 'sucursal_1';
        $this->countryCode = '+58';
    }

    /**
     * Resuelve la empresa y su sucursal activa de WhatsApp.
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
            $this->empresaModel = $empresaModel;
            $this->companyId = (int) $empresaModel->id;
            $this->apiKey = $empresaModel->whatsapp_api_key ?? config('whatsapp.api_key', 'my_secret_key_123');
            $this->baseUrl = $this->resolveEffectiveApiUrl($empresaModel->whatsapp_api_url);

            $sucursal = null;
            if (auth()->check() && auth()->user()->empresa_id == $empresaModel->id && auth()->user()->sucursal_id) {
                $userSucursal = Sucursal::with(['empresa.pais', 'paisTelefono'])->find(auth()->user()->sucursal_id);
                if ($userSucursal) {
                    $sucursal = $userSucursal;
                }
            }

            if (! $sucursal && session()->has('active_whatsapp_sucursal_id')) {
                $sessSucursal = Sucursal::with(['empresa.pais', 'paisTelefono'])->find(session('active_whatsapp_sucursal_id'));
                if ($sessSucursal && $sessSucursal->empresa_id == $empresaModel->id) {
                    $sucursal = $sessSucursal;
                }
            }

            if (! $sucursal) {
                $sucursal = $empresaModel->sucursales()
                    ->with(['empresa.pais', 'paisTelefono'])
                    ->where('whatsapp_active', true)
                    ->where('whatsapp_status', 'connected')
                    ->first()
                    ?? $empresaModel->sucursales()->with(['empresa.pais', 'paisTelefono'])->where('whatsapp_active', true)->first()
                    ?? $empresaModel->sucursales()->with(['empresa.pais', 'paisTelefono'])->first();
            }

            if ($sucursal) {
                $this->resolveSucursal($sucursal);

                return;
            }

            $this->instanceName = 'empresa_'.$empresaModel->id;
            $pais = $empresaModel->relationLoaded('pais') ? $empresaModel->pais : $empresaModel->pais()->first();
            $this->countryCode = $pais?->codigo_telefonico ?? '+58';

            return;
        }

        $defaultSucursal = Sucursal::with(['empresa.pais', 'paisTelefono'])->find(1);
        if ($defaultSucursal) {
            $this->resolveSucursal($defaultSucursal);

            return;
        }

        $this->companyId = 1;
        $this->apiKey = config('whatsapp.api_key', 'my_secret_key_123');
        $this->instanceName = 'sucursal_1';
        $this->countryCode = '+58';
    }

    protected function client()
    {
        return Http::withHeaders([
            'x-api-key' => (string) ($this->apiKey ?? ''),
            'X-Company-Id' => (string) $this->companyId,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ])->timeout($this->timeout);
    }

    public function getCompanyId(): int
    {
        return $this->companyId;
    }

    public function getSucursalId(): ?int
    {
        return $this->sucursalId;
    }

    public function getSucursal(): ?Sucursal
    {
        return $this->sucursalModel;
    }

    public function isBranchActive(): bool
    {
        return $this->sucursalModel ? (bool) $this->sucursalModel->whatsapp_active : true;
    }

    public function getInstanceName(): string
    {
        return $this->instanceName;
    }

    public function getCountryCode(): string
    {
        return $this->countryCode;
    }

    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * Resumen en vivo de múltiples instancias de sucursales en una sola llamada HTTP.
     */
    public function getInstancesSummary(array $instanceNames = []): ?array
    {
        try {
            $query = ! empty($instanceNames) ? ('?names='.urlencode(implode(',', $instanceNames))) : '';
            $response = $this->client()->timeout(4)->get("{$this->baseUrl}/api/instances{$query}");
            if ($response->successful()) {
                return $response->json()['instances'] ?? [];
            }

            return null;
        } catch (ConnectionException) {
            return null;
        } catch (\Throwable $e) {
            Log::debug('WhatsApp getInstancesSummary error: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Crear / inicializar una instancia de sucursal en el motor Python.
     */
    public function createInstance(?string $name = null, ?string $customToken = null, ?string $proxyUrl = null): ?array
    {
        $instanceName = $name ?? $this->instanceName;
        $token = $customToken ?? $this->apiKey;
        $proxy = $proxyUrl ?? $this->sucursalModel?->whatsapp_proxy_url ?? $this->empresaModel?->whatsapp_proxy_url;

        try {
            $response = $this->client()->timeout(18)->post("{$this->baseUrl}/api/instance/create", [
                'name' => $instanceName,
                'token' => $token,
                'proxyUrl' => $proxy ?: null,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning("WhatsApp createInstance status {$response->status()}: {$response->body()}");

            return $response->json();
        } catch (ConnectionException $e) {
            Log::error('WhatsApp Service Unavailable on createInstance: '.$e->getMessage());

            return ['success' => false, '_error' => 'service_unavailable', 'error' => 'El motor Python de WhatsApp no está encendido en '.$this->baseUrl];
        } catch (\Throwable $e) {
            Log::error('WhatsApp Create Instance Error: '.$e->getMessage());

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Obtener el estado actual en tiempo real de la instancia de la sucursal.
     */
    public function getStatus(?string $name = null): ?array
    {
        $instanceName = $name ?? $this->instanceName;

        try {
            $url = "{$this->baseUrl}/api/instance/{$instanceName}/status";
            $response = $this->client()->timeout(5)->get($url);

            if ($response->successful()) {
                $data = $response->json();
                $status = $data['status'] ?? 'close';
                $connState = $data['connectionState'] ?? $data['connection_state'] ?? ($status === 'open' ? 'CONNECTED' : ($status === 'qr' ? 'QR_READY' : 'DISCONNECTED'));
                $isConnected = (bool) ($data['isConnected'] ?? ($status === 'open'));

                return [
                    'instanceName' => $data['instanceName'] ?? $instanceName,
                    'status' => $status,
                    'isConnected' => $isConnected,
                    'connectionState' => strtoupper((string) $connState),
                    'qrCode' => $data['qrDataUrl'] ?? $data['qrCode'] ?? null,
                    'qrDataUrl' => $data['qrDataUrl'] ?? $data['qrCode'] ?? null,
                    'qrExpiresIn' => $data['qrExpiresIn'] ?? null,
                    'phoneNumber' => $data['phoneNumber'] ?? null,
                    'pushName' => $data['pushName'] ?? $data['userName'] ?? null,
                    'currentlyTypingTo' => $data['currentlyTypingTo'] ?? null,
                    'queuePaused' => (bool) ($data['queuePaused'] ?? false),
                    'pauseReason' => $data['pauseReason'] ?? null,
                    'lastError' => $data['lastError'] ?? null,
                    'hasSavedSession' => (bool) ($data['hasSavedSession'] ?? false),
                    'engine' => $data['engine'] ?? 'python-neonize',
                    'user' => [
                        'id' => $data['userJid'] ?? null,
                        'name' => $data['userName'] ?? $data['pushName'] ?? null,
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
                    'connectionState' => 'DISCONNECTED',
                    'qrCode' => null,
                    'qrDataUrl' => null,
                    'user' => null,
                    'userJid' => null,
                ];
            }

            return null;
        } catch (ConnectionException $e) {
            Log::debug('WhatsApp Service Unavailable: '.$e->getMessage());

            return ['_error' => 'service_unavailable', 'isConnected' => false, 'connectionState' => 'DISCONNECTED'];
        } catch (\Throwable $e) {
            Log::error('WhatsApp Status Error: '.$e->getMessage());

            return null;
        }
    }

    public function getQRCode(?string $name = null): ?array
    {
        $status = $this->getStatus($name);
        if ($status && ! empty($status['qrCode'])) {
            return ['qrCode' => $status['qrCode']];
        }

        return null;
    }

    /**
     * Vincular la instancia de la sucursal mediante código de emparejamiento de 8 dígitos.
     */
    public function pairPhone(string $phone, ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;
        $formatted = self::formatPhoneNumber($phone, $this->countryCode);

        try {
            $response = $this->client()->timeout(20)->post("{$this->baseUrl}/api/instance/{$instanceName}/pair", [
                'phone' => $formatted,
                'country_code' => $this->countryCode,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            $body = $response->json();

            return [
                'success' => false,
                'error' => $body['detail'] ?? $body['error'] ?? ('HTTP '.$response->status()),
            ];
        } catch (ConnectionException) {
            return ['success' => false, '_error' => 'service_unavailable', 'error' => 'El motor Python de WhatsApp no responde en '.$this->baseUrl];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Diagnóstico y telemetría en vivo del motor Python para esta sucursal.
     */
    public function getDiagnostic(?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;

        try {
            $response = $this->client()->timeout(5)->get("{$this->baseUrl}/api/instance/{$instanceName}/diagnostic");
            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Verificar en vivo si un número tiene WhatsApp activo.
     */
    public function checkNumber(string $phone, ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;
        $formattedPhone = self::formatPhoneNumber($phone, $this->countryCode);

        try {
            $response = $this->client()->timeout(10)->get(
                "{$this->baseUrl}/api/instance/{$instanceName}/check-number/{$formattedPhone}",
                ['country_code' => $this->countryCode]
            );

            if ($response->successful()) {
                $data = $response->json();

                return [
                    'exists' => (bool) ($data['exists'] ?? false),
                    'jid' => $data['jid'] ?? ($formattedPhone.'@s.whatsapp.net'),
                    'phone' => $data['phone'] ?? $formattedPhone,
                    'formattedPhone' => $data['formattedPhone'] ?? $formattedPhone,
                    'verified_live' => (bool) ($data['verified_live'] ?? false),
                    'verified_name' => $data['verified_name'] ?? null,
                    'reason' => $data['reason'] ?? null,
                ];
            }

            return null;
        } catch (\Throwable $e) {
            Log::error('WhatsApp Check Number Error: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Enviar mensaje de texto (directo humanizado si sync=true, o encolado seguro si sync=false).
     */
    public function sendText(
        string $to,
        string $message,
        array $variables = [],
        bool $sync = false,
        ?string $instance = null,
        array $options = []
    ): ?array {
        $instanceName = $instance ?? $this->instanceName;
        $toFormatted = self::formatPhoneNumber($to, $this->countryCode);

        if (empty($toFormatted)) {
            return ['success' => false, 'error' => 'Número telefónico inválido.'];
        }

        // Registrar mensaje localmente primero para vincularlo con el worker y webhooks
        $localMsg = null;
        try {
            $msgAttrs = [
                'recipient_phone' => $toFormatted,
                'recipient_name' => $options['recipient_name'] ?? ($variables['cliente'] ?? $variables['nombre'] ?? null),
                'template_id' => $options['template_id'] ?? null,
                'message_content' => $message,
                'variables' => $variables,
                'status' => $sync ? 'pending' : 'queued',
                'direction' => 'outbound',
                'created_by' => auth()->id() ?? null,
            ];
            if (Schema::hasColumn('whatsapp_messages', 'empresa_id')) {
                $msgAttrs['empresa_id'] = $this->companyId;
                $msgAttrs['sucursal_id'] = $this->sucursalId;
                $msgAttrs['instance_name'] = $instanceName;
            }
            $localMsg = WhatsAppMessage::create($msgAttrs);
        } catch (\Throwable $e) {
            Log::warning('Failed to create local WhatsAppMessage record: '.$e->getMessage());
        }

        try {
            $url = "{$this->baseUrl}/api/message/send-text/{$instanceName}";
            $payload = [
                'to' => $toFormatted,
                'message' => $message,
                'variables' => (object) $variables,
                'country_code' => $this->countryCode,
                'sync' => $sync,
                'localMessageId' => $localMsg?->id,
            ];
            if (array_key_exists('simulateTyping', $options)) {
                $payload['simulateTyping'] = (bool) $options['simulateTyping'];
            } elseif ($this->sucursalModel && $this->sucursalModel->whatsapp_simulate_typing !== null) {
                $payload['simulateTyping'] = (bool) $this->sucursalModel->whatsapp_simulate_typing;
            }
            if (array_key_exists('typingMinSec', $options)) {
                $payload['typingMinSec'] = (float) $options['typingMinSec'];
            }
            if (array_key_exists('typingMaxSec', $options)) {
                $payload['typingMaxSec'] = (float) $options['typingMaxSec'];
            }
            if (array_key_exists('verifyNumber', $options)) {
                $payload['verifyNumber'] = (bool) $options['verifyNumber'];
            } elseif ($this->sucursalModel && $this->sucursalModel->whatsapp_verify_number !== null) {
                $payload['verifyNumber'] = (bool) $this->sucursalModel->whatsapp_verify_number;
            }

            $timeout = $sync ? max($this->timeout, 35) : $this->timeout;
            $response = $this->client()->timeout($timeout)->post($url, $payload);

            if ($response->successful()) {
                $responseData = $response->json();
                $msgId = $responseData['data']['key']['id'] ?? $responseData['messageId'] ?? null;
                $isQueued = (bool) ($responseData['queued'] ?? (! $sync));

                if ($localMsg) {
                    $localMsg->update([
                        'message_id' => $msgId,
                        'message_content' => $responseData['final_message'] ?? $message,
                        'status' => $isQueued ? 'queued' : 'sent',
                        'sent_at' => $isQueued ? null : now(),
                    ]);
                }

                return $responseData;
            }

            $errBody = $response->json();
            $errText = $errBody['detail'] ?? $errBody['error'] ?? ('HTTP '.$response->status());

            if ($localMsg) {
                $localMsg->update([
                    'status' => 'failed',
                    'error_message' => $errText,
                ]);
            }

            Log::error('WhatsApp Send Message Failed', [
                'instance' => $instanceName,
                'to' => $toFormatted,
                'status' => $response->status(),
                'error' => $errText,
            ]);

            return ['success' => false, 'error' => $errText];
        } catch (ConnectionException $e) {
            $errText = 'El motor Python de WhatsApp está fuera de línea ('.$this->baseUrl.').';
            if ($localMsg) {
                $localMsg->update(['status' => 'failed', 'error_message' => $errText]);
            }

            return ['success' => false, 'error' => $errText];
        } catch (\Throwable $e) {
            if ($localMsg) {
                $localMsg->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            }

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Enviar un mensaje utilizando una Plantilla registrada con Spintax y variables dinámicas.
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

        if (! isset($variables['empresa'])) {
            $empresa = $this->empresaModel ?? Empresa::find($this->companyId);
            $variables['empresa'] = $empresa?->nombre_comercial ?: ($empresa?->razon_social ?: config('app.name', 'FixSale'));
        }
        if (! isset($variables['sucursal']) && $this->sucursalModel) {
            $variables['sucursal'] = $this->sucursalModel->nombre;
        }

        return $this->sendText($to, $content, $variables, $sync, $instance, [
            'template_id' => $template?->id,
        ]);
    }

    /**
     * Wrapper retrocompatible de sendMessage.
     */
    public function sendMessage(string $to, string $message, array|bool $variablesOrIsWelcome = [], bool $sync = false, ?string $instance = null): ?array
    {
        $variables = is_array($variablesOrIsWelcome) ? $variablesOrIsWelcome : [];

        return $this->sendText($to, $message, $variables, $sync, $instance);
    }

    /**
     * Enviar archivo multimedia (Imagen, PDF) vía URL o ruta local.
     */
    public function sendMedia(string $to, string $mediaUrl, string $caption = '', array $variables = [], bool $sync = true, ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;
        $toFormatted = self::formatPhoneNumber($to, $this->countryCode);

        try {
            $url = "{$this->baseUrl}/api/message/send-media/{$instanceName}";
            $response = $this->client()->timeout(max($this->timeout, 35))->post($url, [
                'to' => $toFormatted,
                'url' => $mediaUrl,
                'caption' => $caption,
                'message' => $caption,
                'country_code' => $this->countryCode,
                'variables' => (object) $variables,
                'sync' => $sync,
                'simulateTyping' => true,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            $body = $response->json();

            return ['success' => false, 'error' => $body['detail'] ?? $body['error'] ?? ('HTTP '.$response->status())];
        } catch (\Throwable $e) {
            Log::error('WhatsApp Send Media Error: '.$e->getMessage());

            return null;
        }
    }

    public function sendDocument(string $to, string $filePath, string $caption = '', array $variables = [], bool $sync = true, ?string $instance = null): ?array
    {
        return $this->sendMedia($to, $filePath, $caption, $variables, $sync, $instance);
    }

    public function sendImage(string $to, string $filePath, string $caption = '', array $variables = [], bool $sync = true, ?string $instance = null): ?array
    {
        return $this->sendMedia($to, $filePath, $caption, $variables, $sync, $instance);
    }

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
                ->timeout(max($this->timeout, 35))
                ->attach('file', file_get_contents($filePath), $fileName)
                ->post("{$this->baseUrl}/api/message/send-multimedia/{$instanceName}", [
                    'to' => $formattedPhone,
                    'mediaType' => $mediaType,
                    'caption' => $caption,
                    'simulateTyping' => true,
                ]);

            return $response->json();
        } catch (\Throwable $e) {
            Log::error('WhatsApp Send Local Media Error: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Estadísticas completas de la cola y políticas Anti-Baneo de la sucursal.
     */
    public function getQueueStats(?string $instance = null): array
    {
        $instanceName = $instance ?? $this->instanceName;
        $sucursal = $this->sucursalModel ?? ($this->sucursalId ? Sucursal::find($this->sucursalId) : null);

        $dailyLimit = (int) ($sucursal?->whatsapp_rate_limit ?: 200);
        $hourlyLimit = (int) ($sucursal?->whatsapp_hourly_limit ?: 25);
        $warmupMode = (bool) ($sucursal?->whatsapp_warmup_mode ?? true);
        $workingHoursEnabled = (bool) ($sucursal?->whatsapp_working_hours_enabled ?? true);
        $workingHoursStart = substr((string) ($sucursal?->whatsapp_working_hours_start ?: '08:00'), 0, 5);
        $workingHoursEnd = substr((string) ($sucursal?->whatsapp_working_hours_end ?: '20:00'), 0, 5);
        $simulateTyping = (bool) ($sucursal?->whatsapp_simulate_typing ?? true);
        $typingMinSec = (float) ($sucursal?->whatsapp_typing_min_sec ?: 2.0);
        $typingMaxSec = (float) ($sucursal?->whatsapp_typing_max_sec ?: 6.0);
        $delayMinSec = (int) ($sucursal?->whatsapp_delay_min_sec ?: 8);
        $delayMaxSec = (int) ($sucursal?->whatsapp_delay_max_sec ?: 20);
        $batchSize = (int) ($sucursal?->whatsapp_batch_size ?: 10);
        $batchPauseSec = (int) ($sucursal?->whatsapp_batch_pause_sec ?: 60);
        $verifyNumber = (bool) ($sucursal?->whatsapp_verify_number ?? true);
        $queuePaused = (bool) ($sucursal?->whatsapp_queue_paused ?? false);
        $proxyUrl = (string) ($sucursal?->whatsapp_proxy_url ?? $this->empresaModel?->whatsapp_proxy_url ?? '');

        $msgQuery = WhatsAppMessage::where('direction', 'outbound');
        if ($this->sucursalId && Schema::hasColumn('whatsapp_messages', 'sucursal_id')) {
            $msgQuery->where('sucursal_id', $this->sucursalId);
        }

        $sentToday = (clone $msgQuery)->whereIn('status', ['sent', 'delivered', 'read'])->whereDate('created_at', today())->count();
        $inQueue = (clone $msgQuery)->whereIn('status', ['queued', 'pending', 'sending'])->count();
        $failedToday = (clone $msgQuery)->where('status', 'failed')->whereDate('created_at', today())->count();

        $remoteStats = null;
        try {
            $response = $this->client()->timeout(4)->get("{$this->baseUrl}/api/message/queue-status/{$instanceName}");
            if ($response->successful()) {
                $body = $response->json();
                $remoteStats = $body['stats'] ?? $body;
            }
        } catch (\Throwable) {
            // fallback a métricas locales
        }

        $effectiveSent = max($sentToday, (int) ($remoteStats['sentToday'] ?? 0));
        $effectiveDailyLimit = (int) ($remoteStats['effectiveDailyLimit'] ?? $dailyLimit);
        $effectiveQueued = max($inQueue, (int) ($remoteStats['queued'] ?? 0));

        return [
            'sentToday' => $effectiveSent,
            'sentThisHour' => (int) ($remoteStats['sentThisHour'] ?? 0),
            'dailyLimit' => (int) ($remoteStats['dailyLimit'] ?? $dailyLimit),
            'effectiveDailyLimit' => $effectiveDailyLimit,
            'hourlyLimit' => (int) ($remoteStats['hourlyLimit'] ?? $hourlyLimit),
            'remaining' => max(0, $effectiveDailyLimit - $effectiveSent),
            'queued' => $effectiveQueued,
            'inQueue' => $effectiveQueued,
            'failedToday' => max($failedToday, (int) ($remoteStats['failedToday'] ?? 0)),
            'warmupMode' => (bool) ($remoteStats['warmupMode'] ?? $warmupMode),
            'warmupDay' => (int) ($remoteStats['warmupDay'] ?? 1),
            'workingHoursEnabled' => (bool) ($remoteStats['workingHoursEnabled'] ?? $workingHoursEnabled),
            'workingHoursStart' => $remoteStats['workingHoursStart'] ?? $workingHoursStart,
            'workingHoursEnd' => $remoteStats['workingHoursEnd'] ?? $workingHoursEnd,
            'withinWorkingHours' => (bool) ($remoteStats['withinWorkingHours'] ?? true),
            'simulateTyping' => (bool) ($remoteStats['simulateTyping'] ?? $simulateTyping),
            'typingMinSec' => (float) ($remoteStats['typingMinSec'] ?? $typingMinSec),
            'typingMaxSec' => (float) ($remoteStats['typingMaxSec'] ?? $typingMaxSec),
            'delayMinSec' => (int) ($remoteStats['delayMinSec'] ?? $delayMinSec),
            'delayMaxSec' => (int) ($remoteStats['delayMaxSec'] ?? $delayMaxSec),
            'batchSize' => (int) ($remoteStats['batchSize'] ?? $batchSize),
            'batchPauseSec' => (int) ($remoteStats['batchPauseSec'] ?? $batchPauseSec),
            'verifyNumber' => (bool) ($remoteStats['verifyNumber'] ?? $verifyNumber),
            'queuePaused' => (bool) ($remoteStats['queuePaused'] ?? $queuePaused),
            'pauseReason' => $remoteStats['pauseReason'] ?? null,
            'consecutiveFailures' => (int) ($remoteStats['consecutiveFailures'] ?? 0),
            'circuitBreakerActive' => (bool) ($remoteStats['circuitBreakerActive'] ?? $queuePaused),
            'proxyUrl' => $remoteStats['proxyUrl'] ?? $proxyUrl,
            'safetyScore' => (int) ($remoteStats['safetyScore'] ?? 100),
            'safetyTips' => $remoteStats['safetyTips'] ?? [],
        ];
    }

    public function updateAntiBan(array $settings, ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;

        try {
            $response = $this->client()->timeout(6)->post("{$this->baseUrl}/api/instance/{$instanceName}/antiban", $settings);

            return $response->json();
        } catch (\Throwable $e) {
            Log::warning('WhatsApp Update AntiBan Warning: '.$e->getMessage());

            return null;
        }
    }

    public function toggleQueuePause(bool $paused, ?string $reason = null, ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;

        try {
            $response = $this->client()->timeout(6)->post("{$this->baseUrl}/api/instance/{$instanceName}/queue/pause", [
                'paused' => $paused,
                'reason' => $reason,
            ]);

            return $response->json();
        } catch (\Throwable $e) {
            Log::warning('WhatsApp Toggle Queue Pause Error: '.$e->getMessage());

            return null;
        }
    }

    public function clearQueue(?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;

        try {
            $response = $this->client()->timeout(6)->post("{$this->baseUrl}/api/instance/{$instanceName}/queue/clear");

            return $response->json();
        } catch (\Throwable $e) {
            Log::warning('WhatsApp Clear Queue Error: '.$e->getMessage());

            return null;
        }
    }

    public function addToBlacklist(string $phone, string $reason = 'OPT_OUT_USER', ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;
        $formattedPhone = self::formatPhoneNumber($phone, $this->countryCode);

        try {
            return $this->client()->post("{$this->baseUrl}/api/instance/{$instanceName}/blacklist", [
                'phone' => $formattedPhone,
                'reason' => $reason,
            ])->json();
        } catch (\Throwable $e) {
            Log::error('WhatsApp Add Blacklist Error: '.$e->getMessage());

            return null;
        }
    }

    public function removeFromBlacklist(string $phone, ?string $instance = null): ?array
    {
        $instanceName = $instance ?? $this->instanceName;
        $formattedPhone = self::formatPhoneNumber($phone, $this->countryCode);

        try {
            return $this->client()->delete("{$this->baseUrl}/api/instance/{$instanceName}/blacklist/{$formattedPhone}")->json();
        } catch (\Throwable $e) {
            Log::error('WhatsApp Remove Blacklist Error: '.$e->getMessage());

            return null;
        }
    }

    public function resetCircuitBreaker(?string $instance = null): ?array
    {
        return $this->toggleQueuePause(false, null, $instance);
    }

    public function previewSpintax(string $template, int $count = 4, array $variables = []): array
    {
        try {
            $response = $this->client()->timeout(5)->post("{$this->baseUrl}/api/message/spintax/preview", [
                'text' => $template,
                'count' => $count,
                'variables' => (object) $variables,
            ]);

            if ($response->successful()) {
                $json = $response->json();
                if (! empty($json['variations'])) {
                    return $json;
                }
            }
        } catch (\Throwable) {
            // fallback local en PHP si el motor Python está apagado
        }

        $variations = [];
        for ($i = 0; $i < max(1, min(10, $count)); $i++) {
            $parsed = self::parseSpintaxLocal($template);
            foreach ($variables as $k => $v) {
                $parsed = str_replace(['{{'.$k.'}}', '{'.$k.'}'], (string) $v, $parsed);
            }
            $variations[] = $parsed;
        }

        return ['success' => true, 'variations' => $variations];
    }

    public static function parseSpintaxLocal(string $text): string
    {
        return (string) preg_replace_callback('/\{([^{}]*\|[^{}]*)\}/', function ($m) {
            $parts = explode('|', $m[1]);

            return $parts[array_rand($parts)];
        }, $text);
    }

    public function startInstance(?string $name = null): ?array
    {
        $instanceName = $name ?? $this->instanceName;

        try {
            return $this->client()->timeout(18)->post("{$this->baseUrl}/api/instance/{$instanceName}/start")->json();
        } catch (\Throwable $e) {
            Log::error('WhatsApp Start Instance Error: '.$e->getMessage());

            return null;
        }
    }

    public function stopInstance(?string $name = null): ?array
    {
        $instanceName = $name ?? $this->instanceName;

        try {
            return $this->client()->timeout(10)->post("{$this->baseUrl}/api/instance/{$instanceName}/stop")->json();
        } catch (\Throwable $e) {
            Log::error('WhatsApp Stop Instance Error: '.$e->getMessage());

            return null;
        }
    }

    public function connect(?string $customToken = null): ?array
    {
        return $this->createInstance($this->instanceName, $customToken);
    }

    public function disconnect(?string $name = null): ?array
    {
        $instanceName = $name ?? $this->instanceName;

        try {
            $response = $this->client()->timeout(12)->delete("{$this->baseUrl}/api/instance/{$instanceName}");

            return $response->successful() ? $response->json() : null;
        } catch (\Throwable $e) {
            Log::error('WhatsApp Disconnect Error: '.$e->getMessage());

            return null;
        }
    }

    public function reconnect(?string $name = null, bool $clearSession = true): ?array
    {
        $instanceName = $name ?? $this->instanceName;

        try {
            $response = $this->client()->timeout(20)->post("{$this->baseUrl}/api/instance/{$instanceName}/reconnect", [
                'clear_session' => $clearSession,
                'proxyUrl' => $this->sucursalModel?->whatsapp_proxy_url ?: null,
            ]);

            return $response->successful() ? $response->json() : null;
        } catch (\Throwable $e) {
            Log::error('WhatsApp Reconnect Error: '.$e->getMessage());

            return null;
        }
    }

    public function removeSession(): ?array
    {
        return $this->disconnect();
    }

    public function isConfigured(): bool
    {
        return ! empty($this->instanceName) && ! empty($this->companyId);
    }

    public static function formatPhoneNumber(string $phone, ?string $defaultCountryCode = '+58'): string
    {
        $raw = trim($phone);
        $digits = preg_replace('/[^0-9]/', '', $raw);

        if (empty($digits)) {
            return '';
        }

        $hasExplicitIntl = str_starts_with($raw, '+') || str_starts_with($digits, '00');
        $digits = ltrim($digits, '0');

        if (empty($digits)) {
            return '';
        }

        if (str_starts_with($digits, '580')) {
            $digits = '58'.substr($digits, 3);
        }

        if (str_starts_with($digits, '58') && strlen($digits) >= 12) {
            return $digits;
        }

        if (str_starts_with($digits, '521') && strlen($digits) === 13) {
            return $digits;
        }
        if (str_starts_with($digits, '52') && strlen($digits) === 12) {
            return '521'.substr($digits, 2);
        }

        // Preservar otros números internacionales válidos con prefijo explícito (+ o 00)
        if ($hasExplicitIntl && strlen($digits) >= 11 && strlen($digits) <= 15) {
            return $digits;
        }

        $cleanPrefix = $defaultCountryCode ? preg_replace('/[^0-9]/', '', $defaultCountryCode) : '58';

        if (in_array($cleanPrefix, ['52', '521'], true)) {
            if (strlen($digits) === 10) {
                return '521'.$digits;
            }
            if (str_starts_with($digits, '521') && strlen($digits) >= 12) {
                return $digits;
            }
            if (str_starts_with($digits, '52') && strlen($digits) === 12) {
                return '521'.substr($digits, 2);
            }

            return '521'.$digits;
        }

        if (strlen($digits) === 10) {
            return ($cleanPrefix ?: '58').$digits;
        }

        if ($cleanPrefix && str_starts_with($digits, $cleanPrefix)) {
            return $digits;
        }

        return ($cleanPrefix ?: '58').$digits;
    }
}
