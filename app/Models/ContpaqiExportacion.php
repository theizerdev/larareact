<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Un archivo de prenómina generado para CONTPAQi: una empresa, un período.
 *
 * Es el equivalente de PeoplesoftExportacion, con una diferencia de fondo: allá
 * cada fila era un marcaje entregado a un servicio web; aquí la unidad es el
 * archivo completo, porque CONTPAQi importa de golpe y no renglón por renglón.
 */
class ContpaqiExportacion extends Model
{
    protected $table = 'contpaqi_exportaciones';

    /** Se está armando el archivo. */
    public const ESTADO_GENERANDO = 'generando';

    /** Archivo listo en disco, todavía no lo baja nadie. */
    public const ESTADO_GENERADA = 'generada';

    /** Alguien ya lo descargó; se asume que va camino a CONTPAQi. */
    public const ESTADO_DESCARGADA = 'descargada';

    /** Falló la generación. `mensaje_error` dice por qué. */
    public const ESTADO_ERROR = 'error';

    protected $fillable = [
        'empresa_id',
        'lote_uuid',
        'periodo_inicio',
        'periodo_fin',
        'numero_periodo',
        'estado',
        'disco',
        'ruta_archivo',
        'nombre_archivo',
        'empleados_exportados',
        'empleados_omitidos',
        'renglones_generados',
        'columnas',
        'mensaje_error',
        'generado_por',
        'generada_at',
    ];

    protected function casts(): array
    {
        return [
            'periodo_inicio' => 'date',
            'periodo_fin' => 'date',
            'columnas' => 'array',
            'generada_at' => 'datetime',
            'numero_periodo' => 'integer',
        ];
    }

    /** @return BelongsTo<Empresa, $this> */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    /** @return HasMany<ContpaqiExportacionDetalle, $this> */
    public function detalles(): HasMany
    {
        return $this->hasMany(ContpaqiExportacionDetalle::class, 'contpaqi_exportacion_id');
    }

    /** @return BelongsTo<User, $this> */
    public function generadaPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generado_por');
    }

    /** @param  Builder<$this>  $query */
    public function scopeParaEmpresa(Builder $query, int $empresaId): void
    {
        $query->where('empresa_id', $empresaId);
    }

    /** ¿Hay un archivo que se pueda bajar? */
    public function tieneArchivo(): bool
    {
        return filled($this->ruta_archivo)
            && in_array($this->estado, [self::ESTADO_GENERADA, self::ESTADO_DESCARGADA], true);
    }
}
