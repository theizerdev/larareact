<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Producto extends Model
{
    use HasFactory, Multitenantable, HasSpanishActivityLog;

    protected $fillable = [
        'categoria_id',
        'marca_id',
        'familia_id',
        'modelo_id',
        'empresa_id',
        'sucursal_id',
        'sku',
        'codigo_barras',
        'nombre_variante',
        'condicion',
        'tipo_producto',
        'tipo_venta',
        'usa_inventario',
        'variant_specs',
        'precio_compra',
        'precio_venta',
        'precio_mayoreo',
        'stock',
        'stock_minimo',
        'tipo_impuesto',
        'tasa_iva',
        'aplica_impuesto_adicional',
        'tasa_impuesto_adicional',
        'aplica_retencion',
        'tasa_retencion',
        'precio_incluye_impuestos',
        'clave_sat_producto',
        'clave_sat_unidad',
        'objeto_impuesto_sat',
        'estado',
    ];

    protected $casts = [
        'variant_specs' => 'array',
        'precio_compra' => 'float',
        'precio_venta' => 'float',
        'precio_mayoreo' => 'float',
        'stock' => 'float',
        'stock_minimo' => 'float',
        'usa_inventario' => 'boolean',
        'aplica_impuesto_adicional' => 'boolean',
        'aplica_retencion' => 'boolean',
        'precio_incluye_impuestos' => 'boolean',
        'tasa_iva' => 'float',
        'tasa_impuesto_adicional' => 'float',
        'tasa_retencion' => 'float',
        'estado' => 'boolean',
    ];

    protected $appends = [
        'specs_completas',
    ];

    /**
     * Relación con Categoría
     */
    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    /**
     * Relación con Marca
     */
    public function marca(): BelongsTo
    {
        return $this->belongsTo(Marca::class, 'marca_id');
    }

    /**
     * Relación con Familia
     */
    public function familia(): BelongsTo
    {
        return $this->belongsTo(Familia::class, 'familia_id');
    }

    /**
     * Relación con el Modelo de Catálogo
     */
    public function modelo(): BelongsTo
    {
        return $this->belongsTo(Modelo::class, 'modelo_id');
    }

    /**
     * Relación con Empresa
     */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    /**
     * Relación con Sucursal
     */
    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    /**
     * Accessor para obtener las especificaciones completas combinadas:
     * 1. Especificaciones del Modelo (modelo.specs_overrides) - ÚNICAMENTE DEL MODELO
     * 2. Condición del Producto
     * 3. Modalidad de Venta e Inventario
     * 4. Atributos de Variante
     */
    public function getSpecsCompletasAttribute(): array
    {
        $overrideModelo = $this->modelo?->specs_overrides ?? [];

        $condicionStr = match ($this->condicion) {
            'nuevo' => 'Nuevo',
            'usado' => 'Usado',
            'reacondicionado' => 'Reacondicionado',
            'repuesto' => 'Para Repuesto',
            default => ucfirst($this->condicion ?? 'nuevo'),
        };

        $tipoVentaStr = match ($this->tipo_venta) {
            'granel' => 'A Granel (Decimales)',
            'paquete' => 'Como Paquete / Kit',
            default => 'Por Unidad / Pza',
        };

        $metadatos = [
            'Condición' => $condicionStr,
            'Modalidad de Venta' => $tipoVentaStr,
            'Maneja Inventario' => $this->usa_inventario ? 'Sí' : 'No',
        ];

        return array_merge($overrideModelo, $metadatos, $this->variant_specs ?? []);
    }
}
