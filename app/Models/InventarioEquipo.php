<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class InventarioEquipo extends Model
{
    use HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'inventario_equipos';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'modelo_equipo_id',
        'imei_1',
        'imei_2',
        'serial',
        'color',
        'condicion',
        'costo_compra',
        'precio_contado',
        'precio_financiado',
        'estado',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'costo_compra' => 'decimal:2',
            'precio_contado' => 'decimal:2',
            'precio_financiado' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['imei_1', 'estado', 'precio_financiado', 'sucursal_id'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function modelo(): BelongsTo
    {
        return $this->belongsTo(ModeloEquipo::class, 'modelo_equipo_id');
    }

    public function creditos(): HasMany
    {
        return $this->hasMany(Credito::class, 'inventario_equipo_id');
    }

    public function scopeDisponibles(Builder $query): Builder
    {
        return $query->where('estado', 'disponible');
    }
}

