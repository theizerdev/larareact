<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsAppPricingSetting extends Model
{
    protected $table = 'whatsapp_pricing_settings';

    protected $fillable = [
        'costo_por_mensaje_usd',
        'mensajes_gratis_defecto',
        'max_mensajes_acumulados_defecto',
        'min_compra_mensajes',
        'paquetes_recarga',
        'cobro_activo',
    ];

    protected $casts = [
        'costo_por_mensaje_usd' => 'float',
        'mensajes_gratis_defecto' => 'integer',
        'max_mensajes_acumulados_defecto' => 'integer',
        'min_compra_mensajes' => 'integer',
        'paquetes_recarga' => 'array',
        'cobro_activo' => 'boolean',
    ];

    public static function current(): self
    {
        $setting = self::first();

        if (! $setting) {
            $setting = self::create([
                'costo_por_mensaje_usd' => 0.0050,
                'mensajes_gratis_defecto' => 500,
                'max_mensajes_acumulados_defecto' => 1000,
                'min_compra_mensajes' => 100,
                'paquetes_recarga' => [100, 500, 1000, 5000],
                'cobro_activo' => true,
            ]);
        }

        return $setting;
    }
}
