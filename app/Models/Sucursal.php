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
        return ! empty($this->whatsapp_instance) ? $this->whatsapp_instance : ('sucursal_' . $this->id);
    }

    /**
     * Determina si la sucursal tiene WhatsApp propio activo.
     */
    public function hasWhatsAppActive(): bool
    {
        return (bool) $this->whatsapp_active && ! empty($this->whatsapp_instance);
    }
}
