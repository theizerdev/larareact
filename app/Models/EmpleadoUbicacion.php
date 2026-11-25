<?php

namespace App\Models;

use App\Traits\AlcancePorLegacy;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Punto de ubicación del colaborador durante su jornada (app móvil, cada
 * 15 minutos). Ver UbicacionJornadaService.
 *
 * @property int $id
 * @property int|null $empresa_id
 * @property int|null $sucursal_id
 * @property int $empleado_id
 * @property int|null $user_id
 * @property int|null $asistencia_marcaje_id
 * @property string $latitud
 * @property string $longitud
 * @property string|null $precision_metros
 * @property bool $ubicacion_simulada
 * @property Carbon $fecha_hora
 * @property string $uuid_cliente
 */
class EmpleadoUbicacion extends Model
{
    use AlcancePorLegacy, Multitenantable;

    protected $table = 'empleado_ubicaciones';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'empleado_id',
        'user_id',
        'asistencia_marcaje_id',
        'latitud',
        'longitud',
        'precision_metros',
        'ubicacion_simulada',
        'fecha_hora',
        'uuid_cliente',
    ];

    protected function casts(): array
    {
        return [
            'fecha_hora' => 'datetime',
            'ubicacion_simulada' => 'boolean',
        ];
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function marcajeInicio(): BelongsTo
    {
        return $this->belongsTo(AsistenciaMarcaje::class, 'asistencia_marcaje_id');
    }
}
