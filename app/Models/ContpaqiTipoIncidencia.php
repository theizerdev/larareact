<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Un renglón del catálogo de tipos de incidencia de CONTPAQi Nóminas.
 *
 * Deliberadamente NO usa el trait Multitenantable. Ese trait filtra por
 * `sucursal_id` en cualquier tabla que no sea empresas/sucursales, y el
 * catálogo de nómina pertenece a la razón social completa, no a una sucursal:
 * agregarle esa columna sólo para satisfacer al trait modelaría mal el
 * negocio. El alcance por empresa se aplica explícitamente con paraEmpresa().
 */
class ContpaqiTipoIncidencia extends Model
{
    protected $table = 'contpaqi_tipos_incidencia';

    /** La cantidad se captura en días. */
    public const UNIDAD_DIAS = 'dias';

    /** La cantidad se captura en horas. */
    public const UNIDAD_HORAS = 'horas';

    protected $fillable = [
        'empresa_id',
        'mnemonico',
        'descripcion',
        'unidad',
        'concepto_nomipaq',
        'tipo_imss',
        'derecho_sueldo',
        'porcentaje_derecho',
        'descuenta_septimo',
        'es_derivada',
        'activo',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'derecho_sueldo' => 'boolean',
            'descuenta_septimo' => 'boolean',
            'es_derivada' => 'boolean',
            'activo' => 'boolean',
            'porcentaje_derecho' => 'decimal:2',
            'concepto_nomipaq' => 'integer',
        ];
    }

    /** @return BelongsTo<Empresa, $this> */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    /** @return HasMany<IncidenciaEmpleado, $this> */
    public function incidencias(): HasMany
    {
        return $this->hasMany(IncidenciaEmpleado::class, 'contpaqi_tipo_incidencia_id');
    }

    /** @param  Builder<$this>  $query */
    public function scopeParaEmpresa(Builder $query, int $empresaId): void
    {
        $query->where('empresa_id', $empresaId);
    }

    /** @param  Builder<$this>  $query */
    public function scopeActivos(Builder $query): void
    {
        $query->where('activo', true);
    }

    /**
     * Tipos que se pueden capturar a mano.
     *
     * Excluye los derivados a propósito: si la asistencia ya calcula las horas
     * extra del período, ofrecer HE1 en el formulario de captura es invitar a
     * que se pague dos veces lo mismo.
     *
     * @param  Builder<$this>  $query
     */
    public function scopeCapturables(Builder $query): void
    {
        $query->where('activo', true)->where('es_derivada', false);
    }

    public function esEnHoras(): bool
    {
        return $this->unidad === self::UNIDAD_HORAS;
    }
}
