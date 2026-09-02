<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Equivalencia entre el `emp_code` que manda el reloj ZKTeco y el time
 * reporter de PeopleSoft (BADGE_ID o EMPLID + EMPL_RCD).
 *
 * Sin una fila activa aquí, un marcaje no se exporta: se omite con motivo.
 * Es a propósito — mandar un punch con identidad equivocada ensucia la nómina
 * de otra persona.
 */
class PeoplesoftEmpleadoMapeo extends Model
{
    protected $table = 'peoplesoft_empleado_mapeos';

    protected $fillable = [
        'empresa_id',
        'emp_code',
        'empleado_id',
        'badge_id',
        'emplid',
        'empl_rcd',
        'activo',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'empl_rcd' => 'integer',
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

    /**
     * ¿Alcanza para identificar a la persona del lado de PeopleSoft?
     *
     * Time and Labor acepta el punch con BADGE_ID (lo traduce a EMPLID) o
     * directamente con EMPLID. Con ninguno de los dos, no hay envío posible.
     */
    public function esUtilizable(): bool
    {
        return $this->activo && (filled($this->badge_id) || filled($this->emplid));
    }
}
