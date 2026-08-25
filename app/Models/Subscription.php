<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use HasFactory;

    protected $table = 'subscriptions';

    protected $fillable = [
        'empresa_id',
        'plan_id',
        'nombre_plan',
        'ciclo_meses',
        'max_sucursales',
        'monto_total',
        'es_tarifa_promocional',
        'fecha_fin_promocion',
        'monto_renovacion_regular',
        'fecha_inicio',
        'fecha_vencimiento',
        'estado',
        'last_reminder_sent_at',
        'reminder_sent_count',
    ];

    protected $casts = [
        'ciclo_meses' => 'integer',
        'max_sucursales' => 'integer',
        'monto_total' => 'float',
        'es_tarifa_promocional' => 'boolean',
        'fecha_fin_promocion' => 'datetime',
        'monto_renovacion_regular' => 'float',
        'fecha_inicio' => 'datetime',
        'fecha_vencimiento' => 'datetime',
        'last_reminder_sent_at' => 'datetime',
        'reminder_sent_count' => 'integer',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class, 'subscription_id');
    }

    /**
     * Retorna el nombre comercial exacto del plan según la duración en meses.
     */
    public static function getNombrePlanByCiclo(int $cicloMeses, bool $isOnlyExtraBranch = false): string
    {
        if ($isOnlyExtraBranch) {
            return 'Sucursales Adicionales';
        }

        return match ($cicloMeses) {
            1 => 'Plan Mensual',
            3 => 'Plan Trimestral',
            6 => 'Plan Semestral',
            12 => 'Plan Anual',
            0 => 'Prueba Gratuita',
            default => 'Plan Mensual',
        };
    }
}
