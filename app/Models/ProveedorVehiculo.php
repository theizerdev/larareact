<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProveedorVehiculo extends Model
{
    use HasFactory;

    protected $table = 'proveedor_vehiculos';

    protected $fillable = [
        'proveedor_id',
        'tipo_vehiculo',
        'marca',
        'modelo',
        'year',
        'placa',
        'foto_frontal',
        'foto_trasera',
        'empresa_id',
        'sucursal_id',
    ];

    protected $casts = [
        'year' => 'integer',
    ];

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class);
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
