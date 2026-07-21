<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmpleadoPreRegistro extends Model
{
    use HasFactory;

    protected $table = 'empleado_pre_registros';

    protected $fillable = [
        'nombres',
        'apellidos',
        'pais_telefono_id',
        'telefono',
        'motivo_registro',
        'responsable_id',
        'departamento_id',
        'cargo_id',
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

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Responsable::class);
    }

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class);
    }

    public function cargo(): BelongsTo
    {
        return $this->belongsTo(Cargo::class);
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
