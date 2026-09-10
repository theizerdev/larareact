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

class PlanFinanciamiento extends Model
{
    use HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'planes_financiamiento';

    protected $fillable = [
        'empresa_id',
        'nombre',
        'descripcion',
        'frecuencia',
        'numero_cuotas',
        'porcentaje_inicial_minimo',
        'porcentaje_interes_total',
        'dias_gracia',
        'mora_diaria_porcentaje',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'numero_cuotas' => 'integer',
            'porcentaje_inicial_minimo' => 'decimal:2',
            'porcentaje_interes_total' => 'decimal:2',
            'dias_gracia' => 'integer',
            'mora_diaria_porcentaje' => 'decimal:2',
            'activo' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['nombre', 'frecuencia', 'numero_cuotas', 'porcentaje_inicial_minimo', 'porcentaje_interes_total', 'activo'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function creditos(): HasMany
    {
        return $this->hasMany(Credito::class, 'plan_financiamiento_id');
    }

    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('activo', true);
    }
}

