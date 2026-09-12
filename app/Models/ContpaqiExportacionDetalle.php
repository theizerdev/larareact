<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Lo que le pasó a un empleado en una exportación: o salió en el archivo con
 * estos valores, o no salió y aquí está el motivo.
 *
 * Guardar las omisiones es la mitad del valor de esta tabla. "Faltaron 12
 * empleados" no le sirve a nadie; "estos 12 no tienen código de CONTPAQi
 * asignado" se resuelve en cinco minutos.
 */
class ContpaqiExportacionDetalle extends Model
{
    protected $table = 'contpaqi_exportacion_detalles';

    /** Salió en el archivo. */
    public const ESTADO_EXPORTADO = 'exportado';

    /** No salió. `motivo` dice por qué. */
    public const ESTADO_OMITIDO = 'omitido';

    /** No tiene mapeo a un código de CONTPAQi. */
    public const MOTIVO_SIN_MAPEO = 'Sin código de empleado asignado en CONTPAQi';

    /** Tiene mapeo pero está desactivado. */
    public const MOTIVO_MAPEO_INACTIVO = 'El mapeo a CONTPAQi está desactivado';

    /** No hubo nada que reportar en el período. */
    public const MOTIVO_SIN_MOVIMIENTOS = 'Sin movimientos en el período';

    protected $fillable = [
        'contpaqi_exportacion_id',
        'empleado_id',
        'codigo_empleado',
        'nombre_empleado',
        'estado',
        'motivo',
        'valores',
    ];

    protected function casts(): array
    {
        return [
            'valores' => 'array',
        ];
    }

    /** @return BelongsTo<ContpaqiExportacion, $this> */
    public function exportacion(): BelongsTo
    {
        return $this->belongsTo(ContpaqiExportacion::class, 'contpaqi_exportacion_id');
    }

    /** @return BelongsTo<Empleado, $this> */
    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    /** @param  Builder<$this>  $query */
    public function scopeOmitidos(Builder $query): void
    {
        $query->where('estado', self::ESTADO_OMITIDO);
    }
}
