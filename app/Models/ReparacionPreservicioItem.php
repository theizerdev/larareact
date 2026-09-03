<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReparacionPreservicioItem extends Model
{
    use Multitenantable;

    protected $table = 'reparacion_preservicio_items';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'seccion',
        'nombre',
        'descripcion',
        'icono',
        'tipo_campo',
        'orden',
        'activo',
        'is_default',
    ];

    protected $casts = [
        'activo'     => 'boolean',
        'is_default' => 'boolean',
        'orden'      => 'integer',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }
}
