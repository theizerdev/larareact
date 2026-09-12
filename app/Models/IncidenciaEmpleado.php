<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * Una incidencia capturada a mano: vacaciones, permiso, incapacidad, castigo.
 *
 * Lleva bitácora de actividad porque toca dinero de una persona. Cuando alguien
 * pregunte por qué su semana salió con tres días menos, la respuesta tiene que
 * poder reconstruirse: quién capturó la incidencia, quién la aprobó y cuándo.
 */
class IncidenciaEmpleado extends Model
{
    use HasSpanishActivityLog, LogsActivity;

    protected $table = 'incidencias_empleado';

    /** Capturada pero todavía no enviada a revisión. */
    public const ESTADO_BORRADOR = 'borrador';

    /** Enviada, esperando autorización. */
    public const ESTADO_PENDIENTE = 'pendiente';

    /** Autorizada. Es el único estado que entra a la exportación. */
    public const ESTADO_APROBADA = 'aprobada';

    /** Rechazada. No afecta la nómina ni cubre faltas. */
    public const ESTADO_RECHAZADA = 'rechazada';

    /** Ya viajó en un archivo de prenómina. Estado terminal. */
    public const ESTADO_APLICADA = 'aplicada';

    protected $fillable = [
        'empresa_id',
        'empleado_id',
        'contpaqi_tipo_incidencia_id',
        'fecha_inicio',
        'fecha_fin',
        'cantidad',
        'estado',
        'folio',
        'motivo',
        'documento',
        'capturado_por',
        'aprobado_por',
        'aprobado_at',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date',
            'cantidad' => 'decimal:2',
            'aprobado_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'empleado_id',
                'contpaqi_tipo_incidencia_id',
                'fecha_inicio',
                'fecha_fin',
                'cantidad',
                'estado',
                'folio',
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    /** @return BelongsTo<Empleado, $this> */
    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    /** @return BelongsTo<ContpaqiTipoIncidencia, $this> */
    public function tipo(): BelongsTo
    {
        return $this->belongsTo(ContpaqiTipoIncidencia::class, 'contpaqi_tipo_incidencia_id');
    }

    /** @return BelongsTo<Empresa, $this> */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    /** @return BelongsTo<User, $this> */
    public function capturadaPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'capturado_por');
    }

    /** @return BelongsTo<User, $this> */
    public function aprobadaPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprobado_por');
    }

    /** @param  Builder<$this>  $query */
    public function scopeParaEmpresa(Builder $query, int $empresaId): void
    {
        $query->where('empresa_id', $empresaId);
    }

    /**
     * Incidencias que cuentan para la nómina.
     *
     * 'aplicada' entra junto con 'aprobada' porque una incidencia ya exportada
     * sigue siendo cierta: si se regenera el archivo del mismo período tiene
     * que volver a aparecer, o el segundo archivo contradiría al primero.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeVigentes(Builder $query): void
    {
        $query->whereIn('estado', [self::ESTADO_APROBADA, self::ESTADO_APLICADA]);
    }

    /**
     * Incidencias que se traslapan con un rango de fechas.
     *
     * Traslape, no contención: una incapacidad del 3 al 20 cuenta para la
     * semana del 6 al 12 aunque ni empiece ni termine dentro de ella.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeEnRango(Builder $query, CarbonInterface|string $desde, CarbonInterface|string $hasta): void
    {
        $desde = $desde instanceof CarbonInterface ? $desde->toDateString() : $desde;
        $hasta = $hasta instanceof CarbonInterface ? $hasta->toDateString() : $hasta;

        $query->where('fecha_inicio', '<=', $hasta)
            ->where('fecha_fin', '>=', $desde);
    }

    /** ¿Esta incidencia cubre la fecha dada? */
    public function cubre(CarbonInterface $fecha): bool
    {
        return $fecha->betweenIncluded($this->fecha_inicio, $this->fecha_fin);
    }
}
