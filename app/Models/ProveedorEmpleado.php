<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProveedorEmpleado extends Model
{
    use HasFactory;

    protected $table = 'proveedor_empleados';

    protected $fillable = [
        'proveedor_id',
        'nombres',
        'apellidos',
        'documento_identidad',
        'genero',
        'fecha_nacimiento',
        'edad',
        'correo',
        'cargo',
        'foto_carnet',
        'documento_frontal',
        'documento_reverso',
        'empresa_id',
        'sucursal_id',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date:Y-m-d',
        'edad' => 'integer',
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
