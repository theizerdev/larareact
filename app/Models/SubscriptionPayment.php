<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPayment extends Model
{
    use HasFactory;

    protected $connection = 'landlord';

    protected $table = 'subscription_payments';

    protected $fillable = [
        'subscription_id',
        'plan_id',
        'empresa_id',
        'user_id',
        'monto',
        'ciclo_meses',
        'sucursales_contratadas',
        'metodo_pago',
        'referencia_pago',
        'comprobante_path',
        'notas',
        'estado',
        'aprobado_por',
        'aprobado_at',
    ];

    protected $casts = [
        'monto' => 'float',
        'ciclo_meses' => 'integer',
        'sucursales_contratadas' => 'integer',
        'aprobado_at' => 'datetime',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class, 'subscription_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function aprobador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprobado_por');
    }
}
