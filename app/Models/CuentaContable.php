<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CuentaContable extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'cuentas_contables';

    protected $fillable = [
        'empresa_id',
        'codigo',
        'nombre',
        'tipo',
        'naturaleza',
        'nivel',
        'padre_id',
        'acepta_movimiento',
        'activa',
    ];

    protected $casts = [
        'nivel' => 'integer',
        'acepta_movimiento' => 'boolean',
        'activa' => 'boolean',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function padre(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'padre_id');
    }

    public function subcuentas(): HasMany
    {
        return $this->hasMany(CuentaContable::class, 'padre_id')->orderBy('codigo');
    }

    public function apuntes(): HasMany
    {
        return $this->hasMany(ApunteContable::class, 'cuenta_id');
    }
}
