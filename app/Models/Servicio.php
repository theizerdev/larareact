<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Servicio extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'servicios';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'categoria_id',
        'nombre',
        'codigo',
        'descripcion',
        'precio',
        'estado',
    ];

    protected $casts = [
        'precio' => 'float',
        'estado' => 'boolean',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }
}
