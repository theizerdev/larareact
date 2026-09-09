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
            ->logOnly(['nombre', 'codigo_numeral', 'telefono', 'direccion', 'status', 'empresa_id'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'empresa_id',
        'nombre',
        'codigo_numeral',
        'pais_telefono_id',
        'pais_id',
        'telefono',
        'direccion',
        'codigo_postal',
        'colonia',
        'ciudad',
        'estado',
        'latitud',
        'longitud',
        'zona_horaria',
        'status',
    ];

    protected function casts(): array
    {
        return [
            // Ver nota en Empresa::casts(): `float` en vez de `decimal:8` para no
            // serializar las coordenadas como string hacia el frontend.
            'latitud' => 'float',
            'longitud' => 'float',
            'status' => 'boolean',
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
     * Get the pais where this sucursal is physically located.
     */
    public function pais(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_id');
    }
}
