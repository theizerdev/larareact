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
        'precio_sucursal_extra_mensual',
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
        'precio_sucursal_extra_mensual' => 'float',
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

        return $this->precio_3_meses > 0 ? round($this->precio_3_meses / 3, 2) : 0.00;
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
     * Obtener el plan de renovación por defecto (plan de pago activo).
     */
    public static function getPlanRenovacionDefault(): ?self
    {
        self::ensureDefaultPlansExist();

        return self::where('activo', true)
            ->where('precio_3_meses', '>', 0)
            ->first()
            ?? self::where('nombre', '!=', 'Plan Prueba')->first()
            ?? self::first();
    }

    /**
     * Calcula el precio total para un número de meses y sucursales (con o sin tarifa promo).
     */
    public function calcularPrecio(int $meses, int $totalSucursales = 1, bool $aplicarPromo = false): float
    {
        if ($aplicarPromo && $this->tiene_promocion && $this->precio_promocional_mensual > 0) {
            $basePrice = $this->precio_promocional_mensual * $meses;
        } else {
            $basePrice = match ($meses) {
                3 => ($this->precio_3_meses > 0 ? $this->precio_3_meses : ($this->precio_regular_mensual > 0 ? $this->precio_regular_mensual * 3 : 897.00)),
                6 => ($this->precio_6_meses > 0 ? $this->precio_6_meses : ($this->precio_regular_mensual > 0 ? $this->precio_regular_mensual * 6 : 1494.00)),
                12 => ($this->precio_12_meses > 0 ? $this->precio_12_meses : ($this->precio_regular_mensual > 0 ? $this->precio_regular_mensual * 12 : 2388.00)),
                default => ($this->precio_3_meses > 0 ? $this->precio_3_meses : ($this->precio_regular_mensual > 0 ? $this->precio_regular_mensual * $meses : 897.00)),
            };
        }

        $precioExtra = $this->precio_sucursal_extra_mensual > 0 ? $this->precio_sucursal_extra_mensual : 10.00;
        $sucursalesExtra = max(0, $totalSucursales - ($this->sucursales_incluidas ?: 1));
        $costoSucursalesExtra = $sucursalesExtra * $precioExtra * ($meses / 3);

        return round($basePrice + $costoSucursalesExtra, 2);
    }
}
