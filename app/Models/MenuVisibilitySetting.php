<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Visibilidad global del menú lateral (solo superadmin la edita).
 *
 * Se guardan únicamente las excepciones: una clave sin fila -> visible.
 * Ocultar es puramente visual; no toca permisos ni el acceso por URL.
 */
class MenuVisibilitySetting extends Model
{
    protected $fillable = ['menu_key', 'visible'];

    protected $casts = [
        'visible' => 'boolean',
    ];

    public const CACHE_KEY = 'menu_visibility_map';

    /**
     * Mapa clave => bool con SOLO las claves ocultas (visible = false).
     * El frontend trata la ausencia de clave como "visible".
     *
     * @return array<string, bool>
     */
    public static function map(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            return static::query()
                ->where('visible', false)
                ->pluck('visible', 'menu_key')
                ->map(fn () => false)
                ->toArray();
        });
    }

    public static function bustCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
