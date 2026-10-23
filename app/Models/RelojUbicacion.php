<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class RelojUbicacion extends Model
{
    use HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'reloj_ubicaciones';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'empresa_id',
                'sucursal_id',
                'numero_localidad',
                'planta',
                'direccion',
                'estado',
                'ciudad',
                'legacy',
                'activo',
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'numero_localidad',
        'planta',
        'direccion',
        'estado',
        'ciudad',
        'legacy',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'numero_localidad' => 'integer',
            'activo' => 'boolean',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function equiposBiometricos(): HasMany
    {
        return $this->hasMany(RelojEquipoBiometrico::class, 'reloj_ubicacion_id');
    }
}

