<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $table = 'subscription_plans';

    protected $fillable = [
        'nombre',
        'descripcion',
        'precio_3_meses',
        'precio_6_meses',
        'precio_12_meses',
        'precio_regular_mensual',
        'precio_promocional_mensual',
        'tiene_promocion',
        'meses_duracion_promocion',
        'badge_promocion',
        'destacado',
        'orden',
        'ciclo_meses',
        'max_suscripciones',
        'fecha_expiracion',
        'precio_sucursal_extra_mensual',
        'costo_por_mensaje_usd',
        'mensajes_incluidos_mes',
        'max_mensajes_acumulados',
        'min_compra_mensajes',
        'sucursales_incluidas',
        'modulos_incluidos',
        'activo',
    ];

    protected $casts = [
        'precio_3_meses' => 'float',
        'precio_6_meses' => 'float',
        'precio_12_meses' => 'float',
        'precio_regular_mensual' => 'float',
        'precio_promocional_mensual' => 'float',
        'tiene_promocion' => 'boolean',
        'meses_duracion_promocion' => 'integer',
        'destacado' => 'boolean',
        'orden' => 'integer',
        'ciclo_meses' => 'integer',
        'max_suscripciones' => 'integer',
        'fecha_expiracion' => 'datetime',
        'precio_sucursal_extra_mensual' => 'float',
        'costo_por_mensaje_usd' => 'float',
        'mensajes_incluidos_mes' => 'integer',
        'max_mensajes_acumulados' => 'integer',
        'min_compra_mensajes' => 'integer',
        'sucursales_incluidas' => 'integer',
        'modulos_incluidos' => 'array',
        'activo' => 'boolean',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class, 'plan_id');
    }

    /**
     * Calcula el porcentaje de descuento si tiene promoción activa.
     */
    public function getPorcentajeAhorroAttribute(): int
    {
        if (!$this->tiene_promocion || $this->precio_regular_mensual <= 0 || $this->precio_promocional_mensual <= 0) {
            return 0;
        }

        $descuento = (($this->precio_regular_mensual - $this->precio_promocional_mensual) / $this->precio_regular_mensual) * 100;
        return max(0, (int) round($descuento));
    }

    /**
     * Retorna el precio mensual efectivo a mostrar (promocional o regular).
     */
    public function getPrecioMensualEfectivoAttribute(): float
    {
        if ($this->tiene_promocion && $this->precio_promocional_mensual > 0) {
            return $this->precio_promocional_mensual;
        }

        if ($this->precio_regular_mensual > 0) {
            return $this->precio_regular_mensual;
        }

        return 0.00;
    }

    /**
     * Indica si el plan superó su fecha de caducidad.
     */
    public function isExpired(): bool
    {
        return $this->fecha_expiracion !== null && now()->gt($this->fecha_expiracion);
    }

    /**
     * Cantidad de empresas únicas con suscripción activa o en prueba en este plan.
     */
    public function activeSubscriptionsCount(): int
    {
        return (int) $this->subscriptions()
            ->whereIn('estado', ['active', 'trial'])
            ->distinct('empresa_id')
            ->count('empresa_id');
    }

    /**
     * Cupos disponibles restantes (null si es ilimitado).
     */
    public function remainingSlots(): ?int
    {
        if ($this->max_suscripciones === null) {
            return null;
        }

        return max(0, $this->max_suscripciones - $this->activeSubscriptionsCount());
    }

    /**
     * Verifica si el plan está vigente y tiene cupo para la empresa indicada.
     */
    public function hasAvailableSlotsForEmpresa(?int $empresaId = null): bool
    {
        if (! $this->activo || $this->isExpired()) {
            return false;
        }

        if ($this->max_suscripciones === null) {
            return true;
        }

        if ($empresaId !== null && $this->subscriptions()
            ->where('empresa_id', $empresaId)
            ->whereIn('estado', ['active', 'trial'])
            ->exists()) {
            return true;
        }

        return $this->activeSubscriptionsCount() < $this->max_suscripciones;
    }

    /**
     * Scope de planes activos y no caducados.
     */
    public function scopeAvailable($query)
    {
        return $query->where('activo', true)
            ->where(function ($q) {
                $q->whereNull('fecha_expiracion')
                    ->orWhere('fecha_expiracion', '>', now());
            });
    }

    /**
     * Garantizar que existan los planes oficiales.
     */
    public static function ensureDefaultPlansExist(): void
    {
        if (self::count() === 0) {
            (new \Database\Seeders\SubscriptionPlansSeeder())->run();
        }
    }

    /**
     * Obtener el plan de renovación por defecto (plan de pago activo y con cupo).
     */
    public static function getPlanRenovacionDefault(): ?self
    {
        self::ensureDefaultPlansExist();

        $candidates = self::available()
            ->where(function ($q) {
                $q->where('precio_regular_mensual', '>', 0)
                    ->orWhere('precio_12_meses', '>', 0);
            })
            ->orderBy('orden', 'asc')
            ->get();

        foreach ($candidates as $candidate) {
            if ($candidate->hasAvailableSlotsForEmpresa()) {
                return $candidate;
            }
        }

        return $candidates->first()
            ?? self::where('nombre', '!=', 'Plan Prueba')->first()
            ?? self::first();
    }

    /**
     * Calcula el precio total para un número de meses y sucursales (con o sin tarifa promo).
     */
    public function calcularPrecio(int $meses = 1, int $totalSucursales = 1, bool $aplicarPromo = false): float
    {
        $meses = max(1, $meses);
        $ciclo = (int) ($this->ciclo_meses ?? 1);

        if ($ciclo === 12 && $this->precio_12_meses > 0 && ($meses === 12 || $meses === 1)) {
            $basePrice = (float) $this->precio_12_meses;
            $mesesExtra = 12;
        } else {
            $precioUnitario = ($aplicarPromo && $this->tiene_promocion && $this->precio_promocional_mensual > 0)
                ? $this->precio_promocional_mensual
                : ($this->tiene_promocion && $this->precio_promocional_mensual > 0 ? $this->precio_promocional_mensual : ($this->precio_regular_mensual ?: 149.00));

            $basePrice = $precioUnitario * $meses;
            $mesesExtra = $meses;
        }

        $precioExtra = $this->precio_sucursal_extra_mensual > 0 ? $this->precio_sucursal_extra_mensual : 84.72;
        $sucursalesExtra = max(0, $totalSucursales - ($this->sucursales_incluidas ?: 1));
        $costoSucursalesExtra = $sucursalesExtra * $precioExtra * $mesesExtra;

        return round($basePrice + $costoSucursalesExtra, 2);
    }

    /**
     * Calcula el costo prorrateado de sucursales adicionales según los días restantes del ciclo.
     */
    public function calcularProrrateoSucursalExtra(int $sucursalesExtra, int $diasRestantes): float
    {
        if ($sucursalesExtra <= 0 || $diasRestantes <= 0) {
            return 0.00;
        }

        $precioMensualExtra = $this->precio_sucursal_extra_mensual > 0 ? $this->precio_sucursal_extra_mensual : 84.72;
        // Tarifa diaria considerando mes base estándar de 30 días
        $tarifaDiaria = $precioMensualExtra / 30;

        return round($sucursalesExtra * $tarifaDiaria * $diasRestantes, 2);
    }
}
