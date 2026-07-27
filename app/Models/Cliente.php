<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cliente extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'clientes';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'nombre',
        'telefono',
        'email',
        'direccion',
        'limite_credito',
        'saldo_pendiente',
        'estado',
    ];

    protected $casts = [
        'limite_credito' => 'float',
        'saldo_pendiente' => 'float',
        'estado' => 'boolean',
    ];

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'cliente_id');
    }

    public function creditPayments(): HasMany
    {
        return $this->hasMany(CreditPayment::class, 'cliente_id');
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
