<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasFactory, Multitenantable, HasSpanishActivityLog;

    protected $table = 'sales';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'cash_register_id',
        'user_id',
        'cliente_id',
        'codigo_ticket',
        'cliente_nombre',
        'metodo_pago',
        'subtotal',
        'impuesto',
        'descuento',
        'total',
        'monto_recibido',
        'cambio',
        'estado',
        'es_credito',
        'saldo_credito',
        'notas',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'impuesto' => 'float',
        'descuento' => 'float',
        'total' => 'float',
        'monto_recibido' => 'float',
        'cambio' => 'float',
        'saldo_credito' => 'float',
        'es_credito' => 'boolean',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class);
    }

    public function creditPayments(): HasMany
    {
        return $this->hasMany(CreditPayment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class);
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
