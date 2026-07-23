<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductorPreRegistro extends Model
{
    use HasFactory;

    protected $table = 'productor_pre_registros';

    protected $fillable = [
        'razon_social_rancho',
        'nombre_comercial_rancho',
        'pais_telefono_id',
        'telefono',
        'token',
        'expires_at',
        'empresa_id',
        'sucursal_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

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
