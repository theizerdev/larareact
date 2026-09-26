<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Sucursal extends Model
{
    use HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'sucursales';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['nombre', 'telefono', 'direccion', 'status', 'empresa_id'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'empresa_id',
        'nombre',
        'pais_telefono_id',
        'telefono',
        'direccion',
        'latitud',
        'longitud',
        'status',
        'whatsapp_instance',
        'whatsapp_phone',
        'whatsapp_status',
        'whatsapp_last_connected',
        'whatsapp_active',
        'whatsapp_rate_limit',
        'whatsapp_warmup_mode',
        'whatsapp_working_hours_enabled',
        'whatsapp_working_hours_start',
        'whatsapp_working_hours_end',
    ];

    protected function casts(): array
    {
        return [
            'latitud' => 'decimal:8',
            'longitud' => 'decimal:8',
            'status' => 'boolean',
            'whatsapp_active' => 'boolean',
            'whatsapp_warmup_mode' => 'boolean',
            'whatsapp_working_hours_enabled' => 'boolean',
            'whatsapp_rate_limit' => 'integer',
            'whatsapp_last_connected' => 'datetime',
        ];
    }

    /**
     * Get the empresa that this sucursal belongs to.
     */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    /**
     * Get the pais used for the phone prefix of this sucursal.
     */
    public function paisTelefono(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_telefono_id');
    }

    /**
     * Obtener el identificador de instancia de WhatsApp para esta sucursal.
     */
    public function getWhatsAppInstanceName(): string
    {
        if (! empty($this->whatsapp_instance)) {
            return $this->whatsapp_instance;
        }

        return $this->buildWhatsAppInstanceName();
    }

    /**
     * Construye un nombre único y limpio para la instancia en el microservicio de WhatsApp
     * utilizando el nombre de la sucursal y la empresa.
     */
    public function buildWhatsAppInstanceName(): string
    {
        $empresa = $this->empresa ?? Empresa::find($this->empresa_id);
        $companyName = $empresa?->nombre_comercial ?: ($empresa?->razon_social ?: '');
        $cleanCompanySlug = preg_replace('/[^a-z0-9_-]/', '', str_replace(['/', ' '], '_', strtolower($companyName)));
        $cleanCompanySlug = trim($cleanCompanySlug, '_');

        $branchName = $this->nombre ?: 'sucursal';
        $cleanBranchSlug = preg_replace('/[^a-z0-9_-]/', '', str_replace(['/', ' '], '_', strtolower($branchName)));
        $cleanBranchSlug = trim($cleanBranchSlug, '_');

        $suffix = $this->id ? "_{$this->id}" : '';

        if (! empty($cleanCompanySlug) && ! empty($cleanBranchSlug)) {
            $name = "{$cleanCompanySlug}_{$cleanBranchSlug}{$suffix}";
        } elseif (! empty($cleanBranchSlug)) {
            $name = "{$cleanBranchSlug}{$suffix}";
        } else {
            $name = "sucursal{$suffix}";
        }

        return trim(preg_replace('/_+/', '_', $name), '_');
    }

    /**
     * Inicializa y registra la instancia de esta sucursal en el microservicio de WhatsApp.
     */
    public function createWhatsAppInstanceOnMicroservice(): ?array
    {
        if (empty($this->whatsapp_instance)) {
            $instanceName = $this->buildWhatsAppInstanceName();
            $this->update([
                'whatsapp_instance' => $instanceName,
            ]);
        } else {
            $instanceName = $this->whatsapp_instance;
        }

        try {
            $empresa = $this->empresa ?? Empresa::find($this->empresa_id);
            $token = $empresa?->whatsapp_api_key ?? null;

            return \App\Services\WhatsAppService::forSucursal($this)
                ->setTimeout(5)
                ->createInstance($instanceName, $token);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("WhatsApp instance creation warning for sucursal {$this->id}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Determina si la sucursal tiene WhatsApp propio activo.
     */
    public function hasWhatsAppActive(): bool
    {
        return (bool) $this->whatsapp_active && ! empty($this->whatsapp_instance);
    }
}
