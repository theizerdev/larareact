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

    public const CRONOGRAMA_REFORMA = [
        2026 => ['normales' => 48.0, 'tex_doble' => 12.0, 'tex_triple' => 4.0, 'total' => 64.0],
        2027 => ['normales' => 46.0, 'tex_doble' => 9.0,  'tex_triple' => 4.0, 'total' => 59.0],
        2028 => ['normales' => 44.0, 'tex_doble' => 9.0,  'tex_triple' => 4.0, 'total' => 57.0],
        2029 => ['normales' => 42.0, 'tex_doble' => 9.0,  'tex_triple' => 4.0, 'total' => 55.0],
        2030 => ['normales' => 40.0, 'tex_doble' => 9.0,  'tex_triple' => 4.0, 'total' => 53.0],
    ];

    public static function getValoresPorAno(int $ano): array
    {
        return self::CRONOGRAMA_REFORMA[$ano] ?? self::CRONOGRAMA_REFORMA[2026];
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
        'ley_silla_intervalo_horas',
        'ley_silla_descanso_minutos',
        'opciones_descanso_minutos',
        'whatsapp_recordatorio_descanso',
        'whatsapp_recordatorio_horas_post_entrada',
        // Reforma Laboral 48h -> 40h
        'reforma_laboral_ano',
        'limite_horas_normales_semanal',
        'limite_tex_doble_semanal',
        'limite_tex_triple_semanal',
        // Semáforo Normal
        'semaforo_normal_verde',
        'semaforo_normal_amarillo',
        'semaforo_normal_rojo',
        // Semáforo TEX Doble
        'semaforo_tex_doble_verde',
        'semaforo_tex_doble_amarillo',
        'semaforo_tex_doble_rojo',
        // Semáforo TEX Triple
        'semaforo_tex_triple_verde',
        'semaforo_tex_triple_amarillo',
        'semaforo_tex_triple_rojo',
        // Notificaciones Escalonadas
        'notif_rh_email',
        'notif_rh_enabled',
        'notif_responsable_enabled',
        'notif_dg_email',
        'notif_dg_enabled',
    ];

    protected function casts(): array
    {
        return [
            'descanso_es_tiempo_efectivo' => 'boolean',
            'horas_extra_requieren_aprobacion' => 'boolean',
            'requiere_foto_marcaje' => 'boolean',
            'whatsapp_recordatorio_descanso' => 'boolean',
            'opciones_descanso_minutos' => 'array',
            'porcentaje_prima_dominical' => 'decimal:2',
            'ley_silla_intervalo_horas' => 'decimal:2',
            'whatsapp_recordatorio_horas_post_entrada' => 'decimal:2',
            'ley_silla_descanso_minutos' => 'integer',
            'tolerancia_retardo_minutos' => 'integer',
            'tolerancia_falta_minutos' => 'integer',
            'redondeo_marcaje_minutos' => 'integer',
            // Reforma Laboral casts
            'reforma_laboral_ano' => 'integer',
            'limite_horas_normales_semanal' => 'decimal:2',
            'limite_tex_doble_semanal' => 'decimal:2',
            'limite_tex_triple_semanal' => 'decimal:2',
            'semaforo_normal_verde' => 'decimal:2',
            'semaforo_normal_amarillo' => 'decimal:2',
            'semaforo_normal_rojo' => 'decimal:2',
            'semaforo_tex_doble_verde' => 'decimal:2',
            'semaforo_tex_doble_amarillo' => 'decimal:2',
            'semaforo_tex_doble_rojo' => 'decimal:2',
            'semaforo_tex_triple_verde' => 'decimal:2',
            'semaforo_tex_triple_amarillo' => 'decimal:2',
            'semaforo_tex_triple_rojo' => 'decimal:2',
            'notif_rh_enabled' => 'boolean',
            'notif_responsable_enabled' => 'boolean',
            'notif_dg_enabled' => 'boolean',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }
}
