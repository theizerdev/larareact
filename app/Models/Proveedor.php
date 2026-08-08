<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Proveedor extends Model
{
    use HasFactory, Multitenantable, HasSpanishActivityLog;

    protected $table = 'proveedores';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'razon_social',
        'nombre_comercial',
        'rif_documento',
        'contacto_nombre',
        'telefono',
        'email',
        'direccion',
        'categoria_insumos',
        'notas',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }
}
