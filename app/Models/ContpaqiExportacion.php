<?php

namespace App\Models;

use Carbon\CarbonInterface;
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

    /**
     * Contabilidad confirmó que este archivo se importó y la nómina se pagó
     * con él. Es el estado terminal bueno: bloquea nuevas exportaciones del
     * período y, entre varias del mismo, señala cuál fue la definitiva.
     */
    public const ESTADO_CERRADA = 'cerrada';

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
        'cerrada_por',
        'cerrada_at',
    ];

    protected function casts(): array
    {
        return [
            // Con formato explícito: sin él, al mandarse a la pantalla salen
            // como ISO en UTC ("2026-09-21T06:00:00.000000Z"), que además de
            // ilegible corre la fecha seis horas.
            'periodo_inicio' => 'date:Y-m-d',
            'periodo_fin' => 'date:Y-m-d',
            'columnas' => 'array',
            'generada_at' => 'datetime:Y-m-d H:i',
            'cerrada_at' => 'datetime:Y-m-d H:i',
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

    /** @return BelongsTo<User, $this> */
    public function cerradaPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cerrada_por');
    }

    /** @param  Builder<$this>  $query */
    public function scopeParaEmpresa(Builder $query, int $empresaId): void
    {
        $query->where('empresa_id', $empresaId);
    }

    /**
     * Exportaciones cerradas que tocan un rango de fechas.
     *
     * Traslape y no igualdad exacta a propósito: si la semana del 6 al 12 ya
     * se pagó, tampoco debe poder generarse "del 8 al 14", porque volvería a
     * exportar tres días que ya viajaron en el archivo definitivo.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeCerradasEnRango(Builder $query, CarbonInterface|string $desde, CarbonInterface|string $hasta): void
    {
        $desde = $desde instanceof CarbonInterface ? $desde->toDateString() : $desde;
        $hasta = $hasta instanceof CarbonInterface ? $hasta->toDateString() : $hasta;

        $query->where('estado', self::ESTADO_CERRADA)
            ->where('periodo_inicio', '<=', $hasta)
            ->where('periodo_fin', '>=', $desde);
    }

    /** ¿Hay un archivo que se pueda bajar? */
    public function tieneArchivo(): bool
    {
        return filled($this->ruta_archivo)
            && in_array($this->estado, [self::ESTADO_GENERADA, self::ESTADO_DESCARGADA, self::ESTADO_CERRADA], true);
    }

    /** ¿Se puede dar por definitiva? Sólo si hay archivo y todavía no se cerró. */
    public function sePuedeCerrar(): bool
    {
        return filled($this->ruta_archivo)
            && in_array($this->estado, [self::ESTADO_GENERADA, self::ESTADO_DESCARGADA], true);
    }
}
