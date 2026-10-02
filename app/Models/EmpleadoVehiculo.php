<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class EmpleadoVehiculo extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'empleado_vehiculos';

    protected $fillable = [
        'empleado_id',
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

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
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
