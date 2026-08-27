<?php

namespace App\Models;

use App\Traits\HasKycValidaciones;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProveedorEmpleado extends Model
{
    use HasFactory, HasKycValidaciones, Multitenantable;

    protected $table = 'proveedor_empleados';

    protected $fillable = [
        'proveedor_id',
        'nombres',
        'apellidos',
        'documento_identidad',
        'curp',
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
        'kyc_estatus',
        'kyc_validado_en',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date:Y-m-d',
        'edad' => 'integer',
        'kyc_validado_en' => 'datetime',
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
