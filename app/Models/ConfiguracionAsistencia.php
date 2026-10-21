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
                'requiere_ubicacion_marcaje',
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
        'requiere_ubicacion_marcaje',
        'redondeo_marcaje_minutos',
        'ley_silla_intervalo_horas',
        'ley_silla_descanso_minutos',
        'opciones_descanso_minutos',
        'opciones_comida',
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
            'requiere_ubicacion_marcaje' => 'boolean',
            'whatsapp_recordatorio_descanso' => 'boolean',
            'opciones_descanso_minutos' => 'array',
            'opciones_comida' => 'array',
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

    /**
     * Tipos de comida que ofrece el kiosko al registrar INICIO COMIDA mientras
     * la empresa no configure los suyos.
     */
    public const OPCIONES_COMIDA_DEFAULT = [
        ['nombre' => 'Opción 1', 'costo' => 0],
        ['nombre' => 'Opción 2', 'costo' => 0],
        ['nombre' => 'Opción 3', 'costo' => 0],
    ];

    /**
     * @return array<int, array{nombre: string, costo: float}>
     */
    public function opcionesComida(): array
    {
        return self::obtenerOpcionesParaKiosko($this->empresa_id);
    }

    /**
     * Obtiene las opciones de comida disponibles para el Kiosko.
     * Prioriza el catálogo dinámico (OpcionComida) y recurre a la columna json o defaults.
     */
    /**
     * Obtiene las opciones de comida disponibles para el Kiosko.
     * Prioriza el catálogo dinámico (OpcionComida) y recurre a la columna json o defaults.
     */
    public static function obtenerOpcionesParaKiosko(?int $empresaId, ?int $sucursalId = null, ?string $zonaHoraria = null): array
    {
        if ($empresaId) {
            $opcionesModel = OpcionComida::where('empresa_id', $empresaId)
                ->where('status', true)
                ->where(function ($q) use ($sucursalId) {
                    $q->whereNull('sucursal_id');
                    if ($sucursalId) {
                        $q->orWhere('sucursal_id', $sucursalId);
                    }
                })
                ->orderBy('orden', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            if ($opcionesModel->isNotEmpty()) {
                return $opcionesModel->map(fn ($o) => [
                    'id' => $o->id,
                    'nombre' => $o->nombre,
                    'tipo' => $o->tipo,
                    'costo' => (float) $o->costo_empleado,
                    'costo_empleado' => (float) $o->costo_empleado,
                    'costo_empresa' => (float) $o->costo_empresa,
                    'descripcion' => $o->descripcion,
                    'icono' => $o->icono,
                    'color' => $o->color,
                    'hora_inicio' => $o->hora_inicio,
                    'hora_fin' => $o->hora_fin,
                    'disponible_ahora' => self::estaEnHorario($o->hora_inicio, $o->hora_fin, $zonaHoraria),
                ])->values()->all();
            }
        }

        $config = $empresaId ? self::where('empresa_id', $empresaId)->first() : null;
        return self::normalizarOpcionesComida($config?->opciones_comida);
    }

    /**
     * Determina si la hora actual en la zona horaria dada cae dentro del rango [hora_inicio, hora_fin].
     * Soporta turnos que cruzan la medianoche (ej. 19:00 a 01:00).
     */
    public static function estaEnHorario(?string $horaInicio, ?string $horaFin, ?string $tz = null): bool
    {
        if (empty($horaInicio) || empty($horaFin)) {
            return true;
        }

        try {
            $now = now($tz ?: config('app.timezone', 'America/Mexico_City'));
            $currentMin = (int) $now->format('H') * 60 + (int) $now->format('i');

            $iniParts = explode(':', $horaInicio);
            $finParts = explode(':', $horaFin);
            $iniMin = (int) ($iniParts[0] ?? 0) * 60 + (int) ($iniParts[1] ?? 0);
            $finMin = (int) ($finParts[0] ?? 0) * 60 + (int) ($finParts[1] ?? 0);

            if ($iniMin <= $finMin) {
                return $currentMin >= $iniMin && $currentMin <= $finMin;
            }

            // Cruza la medianoche
            return $currentMin >= $iniMin || $currentMin <= $finMin;
        } catch (\Throwable $e) {
            return true;
        }
    }

    /**
     * @return array<int, array{nombre: string, costo: float}>
     */
    public static function normalizarOpcionesComida(?array $opciones): array
    {
        $opciones = array_values(array_filter(
            $opciones ?? [],
            fn ($o) => is_array($o) && filled($o['nombre'] ?? null)
        ));

        if ($opciones === []) {
            $opciones = self::OPCIONES_COMIDA_DEFAULT;
        }

        return array_map(fn ($o) => [
            'nombre' => trim((string) $o['nombre']),
            'costo' => round((float) ($o['costo'] ?? 0), 2),
        ], $opciones);
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }
}
