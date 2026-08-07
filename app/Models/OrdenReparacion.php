<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrdenReparacion extends Model
{
    use HasFactory;

    protected $table = 'ordenes_reparacion';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'numero_orden',
        'cliente_id',
        'cliente_nombre',
        'cliente_telefono',
        'tipo_dispositivo',
        'marca_id',
        'marca_nombre',
        'modelo_id',
        'modelo_nombre',
        'color',
        'imei_serie',
        'descripcion_falla',
        'observaciones_fisicas',
        'contrasena_patron',
        'inspeccion_json',
        'post_servicio_json',
        'tecnico_id',
        'estado_orden',
        'costo_mano_obra',
        'costo_repuestos',
        'costo_estimado',
        'anticipo',
        'saldo_restante',
        'garantia_dias',
        'fecha_recepcion',
        'fecha_prometida',
        'fecha_entrega',
        'sale_id',
    ];

    protected $casts = [
        'costo_mano_obra' => 'decimal:2',
        'costo_repuestos' => 'decimal:2',
        'costo_estimado' => 'decimal:2',
        'anticipo' => 'decimal:2',
        'saldo_restante' => 'decimal:2',
        'fecha_recepcion' => 'datetime',
        'fecha_prometida' => 'date',
        'fecha_entrega' => 'datetime',
        'inspeccion_json' => 'array',
        'post_servicio_json' => 'array',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function marca(): BelongsTo
    {
        return $this->belongsTo(Marca::class);
    }

    public function modelo(): BelongsTo
    {
        return $this->belongsTo(Modelo::class);
    }

    public function tecnico(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tecnico_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrdenReparacionItem::class, 'orden_id');
    }

    public function historial(): HasMany
    {
        return $this->hasMany(OrdenReparacionHistorial::class, 'orden_id')->orderBy('created_at', 'desc');
    }

    public function fotos(): HasMany
    {
        return $this->hasMany(OrdenReparacionFoto::class, 'orden_id');
    }
}
