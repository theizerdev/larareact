<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Equivalencia entre un empleado de Shigoto y su "Código empleado" de CONTPAQi.
 *
 * Sin una fila activa aquí el empleado no viaja en el archivo de prenómina: se
 * reporta como omitido con su motivo. Es a propósito, y por la misma razón que
 * en la integración con PeopleSoft — un renglón con el código equivocado le
 * carga las horas a otra persona, y el error se descubre cuando la nómina ya
 * se timbró.
 */
class ContpaqiEmpleadoMapeo extends Model
{
    protected $table = 'contpaqi_empleado_mapeos';

    protected $fillable = [
        'empresa_id',
        'empleado_id',
        'codigo_empleado',
        'nombre_contpaqi',
        'activo',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    /** @return BelongsTo<Empleado, $this> */
    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    /** @return BelongsTo<Empresa, $this> */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    /** @param  Builder<$this>  $query */
    public function scopeParaEmpresa(Builder $query, int $empresaId): void
    {
        $query->where('empresa_id', $empresaId);
    }

    /**
     * ¿Alcanza para escribir el renglón del lado de CONTPAQi?
     *
     * Un mapeo inactivo o sin código no identifica a nadie. La validación vive
     * aquí y no en el servicio para que la UI pueda avisar antes de exportar,
     * en vez de que el problema salga a la luz revisando el archivo.
     */
    public function esUtilizable(): bool
    {
        return $this->activo && filled($this->codigo_empleado);
    }
}
