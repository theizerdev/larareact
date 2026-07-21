<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pais extends Model
{
    protected $table = 'pais';

    protected $fillable = [
        'nombre',
        'codigo_iso2',
        'codigo_iso3',
        'codigo_telefonico',
        'moneda_principal',
        'idioma_principal',
        'continente',
        'latitud',
        'longitud',
        'zona_horaria',
        'formato_fecha',
        'formato_moneda',
        'impuesto_predeterminado',
        'separador_miles',
        'separador_decimales',
        'decimales_moneda',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'impuesto_predeterminado' => 'decimal:2',
            'activo' => 'boolean',
        ];
    }

    /**
     * Get the currency symbol based on currency code.
     */
    public function getSimboloMonedaAttribute(): string
    {
        return match ($this->moneda_principal) {
            'VES' => 'Bs.',
            'EUR' => '€',
            'COP' => '$',
            'MXN' => '$',
            'USD' => '$',
            default => '$'
        };
    }
}
