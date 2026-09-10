<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Cuota extends Model
{
    use HasSpanishActivityLog, LogsActivity;

    protected $table = 'cuotas';

    protected $fillable = [
        'credito_id',
        'numero_cuota',
        'fecha_vencimiento',
        'monto_capital',
        'monto_interes',
        'monto_cuota',
        'monto_mora',
        'monto_pagado',
        'saldo_cuota',
        'fecha_pago',
        'metodo_pago',
        'referencia_pago',
        'estado',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'numero_cuota' => 'integer',
            'fecha_vencimiento' => 'date:Y-m-d',
            'fecha_pago' => 'date:Y-m-d',
            'monto_capital' => 'decimal:2',
            'monto_interes' => 'decimal:2',
            'monto_cuota' => 'decimal:2',
            'monto_mora' => 'decimal:2',
            'monto_pagado' => 'decimal:2',
            'saldo_cuota' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['numero_cuota', 'monto_pagado', 'saldo_cuota', 'estado'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    public function credito(): BelongsTo
    {
        return $this->belongsTo(Credito::class, 'credito_id');
    }

    public function getEstaVencidaAttribute(): bool
    {
        if ($this->estado === 'pagada') {
            return false;
        }

        return Carbon::now()->startOfDay()->gt($this->fecha_vencimiento);
    }

    public function getDiasAtrasoAttribute(): int
    {
        if (!$this->esta_vencida) {
            return 0;
        }

        return (int) Carbon::now()->startOfDay()->diffInDays($this->fecha_vencimiento);
    }
}

