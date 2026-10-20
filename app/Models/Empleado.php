<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empleado extends Model
{
    use HasFactory, Multitenantable, HasSpanishActivityLog;

    protected $table = 'empleados';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'user_id',
        'nombres',
        'apellidos',
        'documento_tipo',
        'documento_numero',
        'email',
        'telefono',
        'direccion',
        'cargo',
        'sueldo_base',
        'porcentaje_comision',
        'tipo_comision',
        'comision_aplica_a',
        'porcentaje_comision_reparacion',
        'tipo_comision_reparacion',
        'comision_reparacion_aplica_a',
        'estado',
        'fecha_ingreso',
        'notas',
    ];

    protected $casts = [
        'sueldo_base' => 'float',
        'porcentaje_comision' => 'float',
        'porcentaje_comision_reparacion' => 'float',
        'estado' => 'boolean',
        'fecha_ingreso' => 'date',
    ];

    protected $appends = [
        'nombre_completo',
    ];

    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombres} {$this->apellidos}");
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'empleado_id');
    }

    public function comisionPagos(): HasMany
    {
        return $this->hasMany(ComisionPago::class, 'empleado_id');
    }

    public function reparaciones(): HasMany
    {
        return $this->hasMany(OrdenReparacion::class, 'empleado_id');
    }
}
