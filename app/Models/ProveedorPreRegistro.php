<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProveedorPreRegistro extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'proveedor_pre_registros';

    protected $fillable = [
        'nombre_comercial',
        'pais_telefono_id',
        'telefono',
        'token',
        'expires_at',
        'empresa_id',
        'sucursal_id',
        'status',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function paisTelefono(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_telefono_id');
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }
}
