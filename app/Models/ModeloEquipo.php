<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ModeloEquipo extends Model
{
    use HasSpanishActivityLog, LogsActivity;

    protected $table = 'modelo_equipos';

    protected $fillable = [
        'marca_id',
        'nombre',
        'almacenamiento',
        'ram',
        'procesador',
        'pantalla',
        'bateria',
        'imagen',
        'descripcion',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['nombre', 'almacenamiento', 'ram', 'activo'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    public function marca(): BelongsTo
    {
        return $this->belongsTo(Marca::class, 'marca_id');
    }

    public function equipos(): HasMany
    {
        return $this->hasMany(InventarioEquipo::class, 'modelo_equipo_id');
    }

    /**
     * Nombre completo descriptivo (ej: Samsung Galaxy A54 128GB/8GB)
     */
    public function getNombreCompletoAttribute(): string
    {
        $detalles = array_filter([$this->almacenamiento, $this->ram]);
        $sufijo = !empty($detalles) ? ' (' . implode(' / ', $detalles) . ')' : '';
        return ($this->marca?->nombre ?? '') . ' ' . $this->nombre . $sufijo;
    }
}

