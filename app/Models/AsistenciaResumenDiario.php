<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class AsistenciaResumenDiario extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'asistencia_resumenes_diarios';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'empleado_id',
                'fecha',
                'horas_ordinarias',
                'horas_extra_diarias',
                'es_festivo',
                'aplica_prima_dominical',
                'monto_estimado_dia',
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'empresa_id',
        'empleado_id',
        'turno_laboral_id',
        'fecha',
        'hora_entrada_real',
        'hora_salida_real',
        'minutos_retraso',
        'minutos_descanso_reales',
        'horas_ordinarias',
        'horas_extra_diarias',
        'es_festivo',
        'aplica_prima_dominical',
        'es_dia_descanso',
        'estado',
        'monto_estimado_dia',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'es_festivo' => 'boolean',
            'aplica_prima_dominical' => 'boolean',
            'es_dia_descanso' => 'boolean',
            'horas_ordinarias' => 'decimal:2',
            'horas_extra_diarias' => 'decimal:2',
            'monto_estimado_dia' => 'decimal:2',
        ];
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function turnoLaboral(): BelongsTo
    {
        return $this->belongsTo(TurnoLaboral::class);
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }
}
