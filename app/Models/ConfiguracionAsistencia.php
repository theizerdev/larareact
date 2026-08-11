<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ConfiguracionAsistencia extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'configuraciones_asistencia';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'tolerancia_retardo_minutos',
                'tolerancia_falta_minutos',
                'descanso_es_tiempo_efectivo',
                'horas_extra_requieren_aprobacion',
                'porcentaje_prima_dominical',
                'requiere_foto_marcaje',
                'redondeo_marcaje_minutos',
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'tolerancia_retardo_minutos',
        'tolerancia_falta_minutos',
        'descanso_es_tiempo_efectivo',
        'horas_extra_requieren_aprobacion',
        'porcentaje_prima_dominical',
        'requiere_foto_marcaje',
        'redondeo_marcaje_minutos',
    ];

    protected function casts(): array
    {
        return [
            'descanso_es_tiempo_efectivo' => 'boolean',
            'horas_extra_requieren_aprobacion' => 'boolean',
            'requiere_foto_marcaje' => 'boolean',
            'porcentaje_prima_dominical' => 'decimal:2',
            'tolerancia_retardo_minutos' => 'integer',
            'tolerancia_falta_minutos' => 'integer',
            'redondeo_marcaje_minutos' => 'integer',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }
}
