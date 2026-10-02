<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class AsistenciaResumenSemanal extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'asistencia_resumenes_semanales';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'empleado_id',
                'periodo_inicio',
                'periodo_fin',
                'total_horas_ordinarias',
                'total_horas_extra_dobles',
                'total_horas_extra_triples',
                'monto_total_pagar',
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'empresa_id',
        'empleado_id',
        'periodo_inicio',
        'periodo_fin',
        'total_horas_ordinarias',
        'total_horas_extra_dobles',
        'total_horas_extra_triples',
        'dias_festivos_trabajados',
        'primas_dominicales_aplicadas',
        'monto_horas_ordinarias',
        'monto_horas_dobles',
        'monto_horas_triples',
        'monto_primas_dominicales',
        'monto_festivos',
        'monto_total_pagar',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'periodo_inicio' => 'date',
            'periodo_fin' => 'date',
            'total_horas_ordinarias' => 'decimal:2',
            'total_horas_extra_dobles' => 'decimal:2',
            'total_horas_extra_triples' => 'decimal:2',
            'monto_horas_ordinarias' => 'decimal:2',
            'monto_horas_dobles' => 'decimal:2',
            'monto_horas_triples' => 'decimal:2',
            'monto_primas_dominicales' => 'decimal:2',
            'monto_festivos' => 'decimal:2',
            'monto_total_pagar' => 'decimal:2',
        ];
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }
}
