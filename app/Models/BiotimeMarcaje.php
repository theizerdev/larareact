<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Espejo de GET /iclock/api/transactions/ (marcajes / punches de BioTime).
 *
 * IMPORTANTE: es una tabla independiente de asistencia_marcajes. No alimenta
 * el cálculo LFT/pre-nómina ni dispara notificaciones. Sin LogsActivity a
 * propósito (el histórico son decenas de miles de filas).
 *
 * Los @property de abajo son sólo para el análisis estático: PHPStan no lee
 * el método casts() de Laravel 11 y sin ellos da por string lo que en
 * ejecución es un Carbon.
 *
 * @property \Illuminate\Support\Carbon|null $punch_time
 * @property \Illuminate\Support\Carbon|null $upload_time
 * @property array<string,mixed>|null $raw
 */
class BiotimeMarcaje extends Model
{
    protected $table = 'biotime_marcajes';

    protected $fillable = [
        'empresa_id',
        'biotime_id',
        'emp_code',
        'biotime_empleado_id',
        'empleado_id',
        'dispositivo_sn',
        'dispositivo_alias',
        'area_alias',
        'punch_time',
        'punch_state',
        'punch_state_label',
        'verify_type',
        'verify_type_label',
        'work_code',
        'latitude',
        'longitude',
        'gps_location',
        'temperature',
        'is_mask',
        'source',
        'upload_time',
        'raw',
    ];

    protected function casts(): array
    {
        return [
            'punch_time' => 'datetime',
            'upload_time' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'temperature' => 'decimal:2',
            'raw' => 'array',
        ];
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function biotimeEmpleado(): BelongsTo
    {
        return $this->belongsTo(BiotimeEmpleado::class, 'biotime_empleado_id');
    }

    /**
     * Etiquetas legibles para punch_state de BioTime 8.0.
     */
    public const PUNCH_STATES = [
        '0' => 'Entrada',
        '1' => 'Salida',
        '2' => 'Salida (descanso)',
        '3' => 'Entrada (descanso)',
        '4' => 'Entrada horas extra',
        '5' => 'Salida horas extra',
    ];

    /**
     * Etiquetas legibles para verify_type de BioTime.
     */
    public const VERIFY_TYPES = [
        -1 => 'Automático',
        0 => 'Contraseña',
        1 => 'Huella',
        2 => 'Tarjeta',
        3 => 'Huella o contraseña',
        4 => 'Huella o tarjeta',
        9 => 'Rostro',
        15 => 'Rostro',
        25 => 'Palma',
    ];

    public static function labelPunchState(int|string|null $state): ?string
    {
        if ($state === null) {
            return null;
        }

        return self::PUNCH_STATES[(string) $state] ?? ('Estado '.$state);
    }

    public static function labelVerifyType(int|string|null $type): ?string
    {
        if ($type === null || $type === '') {
            return null;
        }

        return self::VERIFY_TYPES[(int) $type] ?? ('Tipo '.$type);
    }
}
