<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConfiguracionContable extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'configuraciones_contables';

    protected $fillable = [
        'empresa_id',
        'rubro_comercial',
        'cuenta_caja_id',
        'cuenta_banco_id',
        'cuenta_ventas_productos_id',
        'cuenta_ventas_servicios_id',
        'cuenta_costo_ventas_productos_id',
        'cuenta_costo_repuestos_id',
        'cuenta_inventario_productos_id',
        'cuenta_inventario_repuestos_id',
        'cuenta_cuentas_por_cobrar_id',
        'cuenta_cuentas_por_pagar_id',
        'cuenta_gastos_generales_id',
        'contabilidad_automatica',
    ];

    protected $casts = [
        'contabilidad_automatica' => 'boolean',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function cuentaCaja(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_caja_id');
    }

    public function cuentaBanco(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_banco_id');
    }

    public function cuentaVentasProductos(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_ventas_productos_id');
    }

    public function cuentaVentasServicios(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_ventas_servicios_id');
    }

    public function cuentaCostoVentasProductos(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_costo_ventas_productos_id');
    }

    public function cuentaCostoRepuestos(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_costo_repuestos_id');
    }

    public function cuentaInventarioProductos(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_inventario_productos_id');
    }

    public function cuentaInventarioRepuestos(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_inventario_repuestos_id');
    }

    public function cuentaCuentasPorCobrar(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_cuentas_por_cobrar_id');
    }

    public function cuentaCuentasPorPagar(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_cuentas_por_pagar_id');
    }

    public function cuentaGastosGenerales(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_gastos_generales_id');
    }
}
