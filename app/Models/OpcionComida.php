<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class OpcionComida extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity, Multitenantable, SoftDeletes;

    protected $table = 'opciones_comida';

    public const TIPO_DESAYUNO = 'desayuno';
    public const TIPO_ALMUERZO = 'almuerzo';
    public const TIPO_CENA = 'cena';
    public const TIPO_REFRIGERIO = 'refrigerio';

    public const TIPOS = [
        self::TIPO_DESAYUNO => 'Desayuno',
        self::TIPO_ALMUERZO => 'Almuerzo / Comida',
        self::TIPO_CENA => 'Cena',
        self::TIPO_REFRIGERIO => 'Refrigerio',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'nombre',
                'tipo',
                'descripcion',
                'costo_empleado',
                'costo_empresa',
                'hora_inicio',
                'hora_fin',
                'dias_disponibles',
                'icono',
                'color',
                'orden',
                'status',
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'nombre',
        'tipo',
        'descripcion',
        'costo_empleado',
        'costo_empresa',
        'hora_inicio',
        'hora_fin',
        'dias_disponibles',
        'icono',
        'color',
        'orden',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'costo_empleado' => 'decimal:2',
            'costo_empresa' => 'decimal:2',
            'dias_disponibles' => 'array',
            'orden' => 'integer',
        ];
    }

    public function scopeActivas(Builder $query): Builder
    {
        return $query->where('status', true)->orderBy('orden', 'asc');
    }

    public function scopeParaSucursal(Builder $query, ?int $sucursalId): Builder
    {
        return $query->where(function ($q) use ($sucursalId) {
            $q->whereNull('sucursal_id');
            if ($sucursalId) {
                $q->orWhere('sucursal_id', $sucursalId);
            }
        });
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }
}
