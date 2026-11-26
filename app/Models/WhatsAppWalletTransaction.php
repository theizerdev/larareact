<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppWalletTransaction extends Model
{
    protected $table = 'whatsapp_wallet_transactions';

    protected $fillable = [
        'empresa_id',
        'user_id',
        'tipo',
        'monto_usd',
        'saldo_anterior',
        'saldo_nuevo',
        'whatsapp_message_id',
        'subscription_payment_id',
        'descripcion',
    ];

    protected $casts = [
        'monto_usd' => 'float',
        'saldo_anterior' => 'float',
        'saldo_nuevo' => 'float',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }
}
